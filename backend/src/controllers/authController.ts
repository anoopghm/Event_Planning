import { NextFunction, Request, Response } from "express";
import bcrypt from "bcryptjs";
import pool from "../models/db";
import { ResultSetHeader, RowDataPacket } from "mysql2";
import {
  generateAccessToken,
  generateRefreshToken,
  storeRefreshToken,
  rotateRefreshToken,
  revokeRefreshToken
} from "../utils/jwt";

interface UserRow extends RowDataPacket {
  id: number;
  name: string;
  email: string;
  password: string;
}

export async function register(req: Request, res: Response, next?: NextFunction) {
  const { name, email, password } = req.body;
  const normalizedEmail = email.toLowerCase().trim();

  try {
    const [rows] = await pool.execute<UserRow[]>("SELECT id FROM users WHERE email = ?", [normalizedEmail]);
    if (rows.length > 0) {
      return res.status(409).json({ message: "An account with this email already exists" });
    }

    const hashed = await bcrypt.hash(password, 10);
    const [result] = await pool.execute<ResultSetHeader>(
      "INSERT INTO users (name, email, password) VALUES (?, ?, ?)",
      [name.trim(), normalizedEmail, hashed]
    );

    return res.status(201).json({
      ok: true,
      message: "Account created successfully",
      user: {
        id: result.insertId,
        name: name.trim(),
        email: normalizedEmail
      }
    });
  } catch (err) {
    console.error("Registration error:", err);
    if (next) return next(err);
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function login(req: Request, res: Response, next?: NextFunction) {
  const { email, password } = req.body;
  const normalizedEmail = email.toLowerCase().trim();

  try {
    const [rows] = await pool.execute<UserRow[]>(
      "SELECT id, password, name, email FROM users WHERE email = ?",
      [normalizedEmail]
    );

    if (rows.length === 0) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const user = rows[0];
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const tokenUser = { id: user.id, name: user.name, email: user.email };
    const accessToken = generateAccessToken(tokenUser);
    const refreshToken = generateRefreshToken({ id: user.id });

    // Store hashed refresh token in database
    await storeRefreshToken(user.id, refreshToken);

    return res.json({
      ok: true,
      message: "Login successful",
      accessToken,
      refreshToken,
      token: accessToken, // for backward compatibility
      user: tokenUser
    });
  } catch (err) {
    console.error("Login error:", err);
    if (next) return next(err);
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function refresh(req: Request, res: Response, next?: NextFunction) {
  const refreshToken = req.body?.refreshToken || req.header("x-refresh-token");

  if (!refreshToken || typeof refreshToken !== "string") {
    return res.status(400).json({
      message: "Refresh token is required",
      code: "REFRESH_TOKEN_REQUIRED"
    });
  }

  try {
    const result = await rotateRefreshToken(refreshToken.trim());

    return res.json({
      ok: true,
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      token: result.accessToken, // for backward compatibility
      user: result.user
    });
  } catch (err: any) {
    if (
      err.code === "REFRESH_TOKEN_EXPIRED" ||
      err.code === "INVALID_REFRESH_TOKEN" ||
      err.code === "TOKEN_NOT_FOUND" ||
      err.code === "TOKEN_REUSE_DETECTED" ||
      err.code === "USER_NOT_FOUND"
    ) {
      return res.status(401).json({
        message: err.message,
        code: err.code
      });
    }

    console.error("Refresh token error:", err);
    if (next) return next(err);
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function logout(req: Request, res: Response, next?: NextFunction) {
  const refreshToken = req.body?.refreshToken || req.header("x-refresh-token");

  try {
    if (refreshToken && typeof refreshToken === "string") {
      await revokeRefreshToken(refreshToken.trim());
    }

    return res.json({
      ok: true,
      message: "Logged out successfully"
    });
  } catch (err) {
    console.error("Logout error:", err);
    if (next) return next(err);
    return res.status(500).json({ message: "Internal server error" });
  }
}
