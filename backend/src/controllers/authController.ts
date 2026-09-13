import crypto from "crypto";
import { NextFunction, Request, Response } from "express";
import bcrypt from "bcryptjs";
import pool from "../models/db";
import { ResultSetHeader, RowDataPacket } from "mysql2";
import {
  generateAccessToken,
  generateRefreshToken,
  storeRefreshToken,
  rotateRefreshToken,
  revokeRefreshToken,
  getAccessTokenCookieOptions,
  getRefreshTokenCookieOptions,
  getClearCookieOptions
} from "../utils/jwt";
import { sendVerificationEmail } from "../utils/email";
import { logger } from "../utils/logger";

interface UserRow extends RowDataPacket {
  id: number;
  name: string;
  email: string;
  password: string;
  is_verified?: number;
  verification_token?: string | null;
  verification_token_expires?: Date | null;
}

export async function register(req: Request, res: Response, next?: NextFunction) {
  const { name, email, password } = req.body;
  const normalizedEmail = email.toLowerCase().trim();

  try {
    const [rows] = await pool.execute<UserRow[]>("SELECT id FROM users WHERE email = ?", [normalizedEmail]);
    if (rows.length > 0) {
      logger.warn(`Registration rejected: email already registered [email: ${normalizedEmail}]`);
      return res.status(409).json({ message: "An account with this email already exists" });
    }

    const hashed = await bcrypt.hash(password, 10);
    const verificationToken = crypto.randomBytes(32).toString("hex");
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    const [result] = await pool.execute<ResultSetHeader>(
      "INSERT INTO users (name, email, password, is_verified, verification_token, verification_token_expires) VALUES (?, ?, ?, 0, ?, ?)",
      [name.trim(), normalizedEmail, hashed, verificationToken, verificationExpires]
    );

    // Send verification email
    await sendVerificationEmail({
      to: normalizedEmail,
      name: name.trim(),
      token: verificationToken
    });

    logger.info(`User registered successfully [userId: ${result.insertId}, email: ${normalizedEmail}]`);

    return res.status(201).json({
      ok: true,
      message: "Registration successful! Please check your email to verify your account.",
      email: normalizedEmail,
      requiresVerification: true,
      user: {
        id: result.insertId,
        name: name.trim(),
        email: normalizedEmail
      }
    });
  } catch (err) {
    logger.error(`Registration error [email: ${normalizedEmail}]:`, err);
    if (next) return next(err);
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function login(req: Request, res: Response, next?: NextFunction) {
  const { email, password } = req.body;
  const normalizedEmail = email.toLowerCase().trim();

  try {
    const [rows] = await pool.execute<UserRow[]>(
      "SELECT id, password, name, email, is_verified FROM users WHERE email = ?",
      [normalizedEmail]
    );

    if (rows.length === 0) {
      logger.warn(`Login failed: user not found [email: ${normalizedEmail}]`);
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const user = rows[0];
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      logger.warn(`Login failed: password mismatch [userId: ${user.id}, email: ${normalizedEmail}]`);
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Guard: Prevent login if email is not verified yet
    if (user.is_verified === 0) {
      logger.warn(`Login blocked: email not verified [userId: ${user.id}, email: ${user.email}]`);
      return res.status(403).json({
        ok: false,
        code: "EMAIL_NOT_VERIFIED",
        message: "Please verify your email address before logging in. Check your inbox for the activation link.",
        email: user.email
      });
    }

    const tokenUser = { id: user.id, name: user.name, email: user.email };
    const accessToken = generateAccessToken(tokenUser);
    const refreshToken = generateRefreshToken({ id: user.id });

    // Store hashed refresh token in database
    await storeRefreshToken(user.id, refreshToken);

    // Set secure httpOnly cookies
    res.cookie("accessToken", accessToken, getAccessTokenCookieOptions());
    res.cookie("refreshToken", refreshToken, getRefreshTokenCookieOptions());

    logger.info(`User logged in successfully [userId: ${user.id}, email: ${user.email}]`);

    return res.json({
      ok: true,
      message: "Login successful",
      accessToken,
      refreshToken,
      token: accessToken, // for backward compatibility
      user: tokenUser
    });
  } catch (err) {
    logger.error(`Login error [email: ${normalizedEmail}]:`, err);
    if (next) return next(err);
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function verifyEmail(req: Request, res: Response, next?: NextFunction) {
  const token = (req.query.token as string) || req.body?.token;

  if (!token || typeof token !== "string" || !token.trim()) {
    logger.warn("Email verification rejected: token missing in request");
    return res.status(400).json({
      ok: false,
      code: "TOKEN_REQUIRED",
      message: "Verification token is required."
    });
  }

  try {
    const [rows] = await pool.execute<UserRow[]>(
      "SELECT id, email, is_verified, verification_token_expires FROM users WHERE verification_token = ?",
      [token.trim()]
    );

    if (rows.length === 0) {
      logger.warn("Email verification rejected: invalid or unknown token");
      return res.status(400).json({
        ok: false,
        code: "INVALID_TOKEN",
        message: "Invalid or expired verification link. Please request a new one."
      });
    }

    const user = rows[0];

    // Check if token has expired
    if (user.verification_token_expires && new Date(user.verification_token_expires) < new Date()) {
      logger.warn(`Email verification rejected: token expired [userId: ${user.id}, email: ${user.email}]`);
      return res.status(400).json({
        ok: false,
        code: "TOKEN_EXPIRED",
        message: "This verification link has expired. Please request a new verification email.",
        email: user.email
      });
    }

    // Activate user and clear token
    await pool.execute(
      "UPDATE users SET is_verified = 1, verification_token = NULL, verification_token_expires = NULL WHERE id = ?",
      [user.id]
    );

    logger.info(`User email verified successfully [userId: ${user.id}, email: ${user.email}]`);

    return res.json({
      ok: true,
      message: "Email verified successfully! You can now log in to your account.",
      email: user.email
    });
  } catch (err) {
    logger.error("Verify email error:", err);
    if (next) return next(err);
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function resendVerification(req: Request, res: Response, next?: NextFunction) {
  const email = req.body?.email;
  if (!email || typeof email !== "string" || !email.trim()) {
    return res.status(400).json({
      ok: false,
      message: "Please provide a valid email address."
    });
  }

  const normalizedEmail = email.toLowerCase().trim();

  try {
    const [rows] = await pool.execute<UserRow[]>(
      "SELECT id, name, email, is_verified FROM users WHERE email = ?",
      [normalizedEmail]
    );

    if (rows.length === 0) {
      logger.info(`Resend verification requested for non-existent email [email: ${normalizedEmail}]`);
      // Obscure user presence for privacy
      return res.json({
        ok: true,
        message: "If an account with this email exists, a verification link has been sent."
      });
    }

    const user = rows[0];

    if (user.is_verified === 1) {
      logger.info(`Resend verification skipped: user already verified [userId: ${user.id}, email: ${user.email}]`);
      return res.status(400).json({
        ok: false,
        code: "ALREADY_VERIFIED",
        message: "Your email is already verified. You can log in directly."
      });
    }

    const newToken = crypto.randomBytes(32).toString("hex");
    const newExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await pool.execute(
      "UPDATE users SET verification_token = ?, verification_token_expires = ? WHERE id = ?",
      [newToken, newExpires, user.id]
    );

    await sendVerificationEmail({
      to: user.email,
      name: user.name,
      token: newToken
    });

    logger.info(`Resend verification email sent [userId: ${user.id}, email: ${user.email}]`);

    return res.json({
      ok: true,
      message: "A new verification email has been sent. Please check your inbox.",
      email: user.email
    });
  } catch (err) {
    logger.error(`Resend verification error [email: ${normalizedEmail}]:`, err);
    if (next) return next(err);
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function refresh(req: Request, res: Response, next?: NextFunction) {
  // Extract refresh token from httpOnly cookie, request body, or header
  const refreshToken =
    req.cookies?.refreshToken ||
    req.body?.refreshToken ||
    req.header("x-refresh-token");

  if (!refreshToken || typeof refreshToken !== "string") {
    logger.warn("Token refresh rejected: refresh token missing");
    return res.status(400).json({
      message: "Refresh token is required",
      code: "REFRESH_TOKEN_REQUIRED"
    });
  }

  try {
    const result = await rotateRefreshToken(refreshToken.trim());

    // Update secure httpOnly cookies with new tokens
    res.cookie("accessToken", result.accessToken, getAccessTokenCookieOptions());
    res.cookie("refreshToken", result.refreshToken, getRefreshTokenCookieOptions());

    logger.info(`Refresh token rotated successfully [userId: ${result.user.id}, email: ${result.user.email}]`);

    return res.json({
      ok: true,
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      token: result.accessToken, // for backward compatibility
      user: result.user
    });
  } catch (err: any) {
    // If refresh token is expired, invalid, or reused, clear stale cookies
    res.clearCookie("accessToken", getClearCookieOptions());
    res.clearCookie("refreshToken", getClearCookieOptions());

    if (
      err.code === "REFRESH_TOKEN_EXPIRED" ||
      err.code === "INVALID_REFRESH_TOKEN" ||
      err.code === "TOKEN_NOT_FOUND" ||
      err.code === "TOKEN_REUSE_DETECTED" ||
      err.code === "USER_NOT_FOUND"
    ) {
      logger.warn(`Token refresh rejected: ${err.message} [code: ${err.code}]`);
      return res.status(401).json({
        message: err.message,
        code: err.code
      });
    }

    logger.error("Refresh token unexpected error:", err);
    if (next) return next(err);
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function logout(req: Request, res: Response, next?: NextFunction) {
  const refreshToken =
    req.cookies?.refreshToken ||
    req.body?.refreshToken ||
    req.header("x-refresh-token");

  try {
    if (refreshToken && typeof refreshToken === "string") {
      await revokeRefreshToken(refreshToken.trim());
      logger.info("Revoked user refresh token during logout");
    }

    // Clear secure httpOnly cookies
    res.clearCookie("accessToken", getClearCookieOptions());
    res.clearCookie("refreshToken", getClearCookieOptions());

    logger.info("User logged out successfully");

    return res.json({
      ok: true,
      message: "Logged out successfully"
    });
  } catch (err) {
    logger.error("Logout error:", err);
    if (next) return next(err);
    return res.status(500).json({ message: "Internal server error" });
  }
}
