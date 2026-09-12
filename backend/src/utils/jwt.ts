import crypto from "crypto";
import jwt, { JwtPayload, SignOptions } from "jsonwebtoken";
import { CookieOptions } from "express";
import { RowDataPacket, ResultSetHeader } from "mysql2";

import pool from "../models/db";

export interface TokenUser {
  id: number;
  name: string;
  email: string;
}

export interface AccessTokenPayload extends JwtPayload {
  id: number;
  name: string;
  email: string;
  type?: "access";
}

export interface RefreshTokenPayload extends JwtPayload {
  id: number;
  type?: "refresh";
  jti?: string;
}

interface RefreshTokenRow extends RowDataPacket {
  id: number;
  user_id: number;
  token_hash: string;
  expires_at: Date;
  revoked: number;
}

interface UserRow extends RowDataPacket {
  id: number;
  name: string;
  email: string;
}

export function getAccessSecret(): string {
  const secret = process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT access secret is not configured in environment variables");
  }
  return secret;
}

export function getRefreshSecret(): string {
  const secret =
    process.env.JWT_REFRESH_SECRET ||
    (process.env.JWT_SECRET ? `${process.env.JWT_SECRET}_refresh` : undefined);
  if (!secret) {
    throw new Error("JWT refresh secret is not configured in environment variables");
  }
  return secret;
}

export function getAccessExpiresIn(): string {
  // Industry standard for access token is 15 minutes
  return process.env.JWT_ACCESS_EXPIRES_IN || "15m";
}

export function getRefreshExpiresIn(): string {
  // Industry standard for refresh token is 7 days
  return process.env.JWT_REFRESH_EXPIRES_IN || "7d";
}

export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

/**
 * Generate a short-lived access token (default: 15 minutes)
 */
export function generateAccessToken(user: TokenUser): string {
  const payload = {
    id: user.id,
    name: user.name,
    email: user.email,
    type: "access" as const
  };

  const options: SignOptions = {
    expiresIn: getAccessExpiresIn() as any
  };

  return jwt.sign(payload, getAccessSecret(), options);
}

/**
 * Generate a long-lived refresh token (default: 7 days)
 */
export function generateRefreshToken(user: Pick<TokenUser, "id">): string {
  const payload = {
    id: user.id,
    type: "refresh" as const,
    jti: crypto.randomUUID()
  };

  const options: SignOptions = {
    expiresIn: getRefreshExpiresIn() as any
  };

  return jwt.sign(payload, getRefreshSecret(), options);
}

/**
 * Verify an access token
 */
export function verifyAccessToken(token: string): AccessTokenPayload {
  const decoded = jwt.verify(token, getAccessSecret());
  if (typeof decoded === "string" || !decoded.id) {
    throw new Error("Invalid token payload");
  }
  return decoded as AccessTokenPayload;
}

/**
 * Verify a refresh token signature and decode its claims
 */
export function verifyRefreshToken(token: string): RefreshTokenPayload {
  const decoded = jwt.verify(token, getRefreshSecret());
  if (typeof decoded === "string" || !decoded.id) {
    throw new Error("Invalid refresh token payload");
  }
  return decoded as RefreshTokenPayload;
}

/**
 * Parse a standard duration string like "15m", "7d", "24h" or number of seconds into milliseconds
 */
export function parseDurationToMs(duration: string): number {
  const match = /^(\d+)([smhd]?)$/.exec(duration.trim());
  if (!match) {
    return 7 * 24 * 60 * 60 * 1000; // default 7 days
  }
  const value = parseInt(match[1], 10);
  const unit = match[2];
  switch (unit) {
    case "s":
      return value * 1000;
    case "m":
      return value * 60 * 1000;
    case "h":
      return value * 60 * 60 * 1000;
    case "d":
    default:
      return value * 24 * 60 * 60 * 1000;
  }
}

/**
 * Store a hashed refresh token in MySQL with expiration
 */
export async function storeRefreshToken(userId: number, rawToken: string): Promise<void> {
  const tokenHash = hashToken(rawToken);

  let expiresAt: Date;
  try {
    const decoded = jwt.decode(rawToken) as JwtPayload | null;
    if (decoded && decoded.exp) {
      expiresAt = new Date(decoded.exp * 1000);
    } else {
      expiresAt = new Date(Date.now() + parseDurationToMs(getRefreshExpiresIn()));
    }
  } catch {
    expiresAt = new Date(Date.now() + parseDurationToMs(getRefreshExpiresIn()));
  }

  // Format as MySQL DATETIME (YYYY-MM-DD HH:MM:SS)
  const mysqlDateTime = expiresAt.toISOString().slice(0, 19).replace("T", " ");

  await pool.execute<ResultSetHeader>(
    "INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES (?, ?, ?)",
    [userId, tokenHash, mysqlDateTime]
  );
}

/**
 * Revoke a single refresh token by marking it revoked in MySQL
 */
export async function revokeRefreshToken(rawToken: string): Promise<boolean> {
  const tokenHash = hashToken(rawToken);
  const [result] = await pool.execute<ResultSetHeader>(
    "UPDATE refresh_tokens SET revoked = 1 WHERE token_hash = ?",
    [tokenHash]
  );
  return result.affectedRows > 0;
}

/**
 * Revoke all refresh tokens for a specific user (e.g. password change, security reset, or reuse detection)
 */
export async function revokeAllUserRefreshTokens(userId: number): Promise<void> {
  await pool.execute<ResultSetHeader>(
    "UPDATE refresh_tokens SET revoked = 1 WHERE user_id = ?",
    [userId]
  );
}

/**
 * Verifies a refresh token, performs token rotation (revoking the old token and generating a new pair),
 * and checks for token reuse detection.
 */
export async function rotateRefreshToken(oldRawToken: string): Promise<{
  accessToken: string;
  refreshToken: string;
  user: TokenUser;
}> {
  // 1. Verify token cryptographic signature and expiration claim
  let payload: RefreshTokenPayload;
  try {
    payload = verifyRefreshToken(oldRawToken);
  } catch (err: any) {
    if (err.name === "TokenExpiredError") {
      const expiredError = new Error("Refresh token has expired. Please sign in again.");
      (expiredError as any).code = "REFRESH_TOKEN_EXPIRED";
      throw expiredError;
    }
    const invalidError = new Error("Invalid refresh token");
    (invalidError as any).code = "INVALID_REFRESH_TOKEN";
    throw invalidError;
  }

  const tokenHash = hashToken(oldRawToken);

  // 2. Query token record in database
  const [rows] = await pool.execute<RefreshTokenRow[]>(
    "SELECT id, user_id, token_hash, expires_at, revoked FROM refresh_tokens WHERE token_hash = ?",
    [tokenHash]
  );

  if (rows.length === 0) {
    // Unknown token
    const err = new Error("Refresh token not found or already used");
    (err as any).code = "TOKEN_NOT_FOUND";
    throw err;
  }

  const tokenRecord = rows[0];

  // 3. Check if already revoked -> potential token reuse attack!
  if (tokenRecord.revoked) {
    // For enhanced security, revoke all tokens for this user when reuse is detected
    await revokeAllUserRefreshTokens(tokenRecord.user_id);
    const reuseErr = new Error("Token reuse detected. All sessions have been terminated for security.");
    (reuseErr as any).code = "TOKEN_REUSE_DETECTED";
    throw reuseErr;
  }

  // 4. Check if expired in database
  if (new Date(tokenRecord.expires_at).getTime() < Date.now()) {
    await revokeRefreshToken(oldRawToken);
    const expErr = new Error("Refresh token has expired");
    (expErr as any).code = "REFRESH_TOKEN_EXPIRED";
    throw expErr;
  }

  // 5. Verify user still exists in database
  const [userRows] = await pool.execute<UserRow[]>(
    "SELECT id, name, email FROM users WHERE id = ?",
    [tokenRecord.user_id]
  );

  if (userRows.length === 0) {
    await revokeRefreshToken(oldRawToken);
    const userErr = new Error("User associated with this token no longer exists");
    (userErr as any).code = "USER_NOT_FOUND";
    throw userErr;
  }

  const user = userRows[0];

  // 6. Revoke the old token (Refresh Token Rotation)
  await revokeRefreshToken(oldRawToken);

  // 7. Issue new Access Token (15m) and new Refresh Token (7d)
  const newAccessToken = generateAccessToken(user);
  const newRefreshToken = generateRefreshToken(user);

  // 8. Store the new refresh token in database
  await storeRefreshToken(user.id, newRefreshToken);

  return {
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
    user: {
      id: user.id,
      name: user.name,
      email: user.email
    }
  };
}

/**
 * Standard cookie options for the short-lived access token
 */
export function getAccessTokenCookieOptions(): CookieOptions {
  const isProd = process.env.NODE_ENV === "production";
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    path: "/",
    maxAge: parseDurationToMs(getAccessExpiresIn())
  };
}

/**
 * Standard cookie options for the long-lived refresh token
 */
export function getRefreshTokenCookieOptions(): CookieOptions {
  const isProd = process.env.NODE_ENV === "production";
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    path: "/",
    maxAge: parseDurationToMs(getRefreshExpiresIn())
  };
}

/**
 * Cookie options for clearing cookies upon logout
 */
export function getClearCookieOptions(): CookieOptions {
  const isProd = process.env.NODE_ENV === "production";
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    path: "/"
  };
}


