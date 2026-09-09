import { NextFunction, Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import pool from "../models/db";
import { ResultSetHeader, RowDataPacket } from "mysql2";

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
  const jwtSecret = process.env.JWT_SECRET;

  if (!jwtSecret) {
    console.error("JWT_SECRET is not configured in environment variables");
    return res.status(500).json({ message: "Server authentication is not configured" });
  }

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

    const token = jwt.sign(
      { id: user.id, name: user.name, email: user.email },
      jwtSecret,
      { expiresIn: "7d" }
    );

    return res.json({
      ok: true,
      message: "Login successful",
      token,
      user: { id: user.id, name: user.name, email: user.email }
    });
  } catch (err) {
    console.error("Login error:", err);
    if (next) return next(err);
    return res.status(500).json({ message: "Internal server error" });
  }
}
