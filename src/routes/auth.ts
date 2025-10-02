import express, { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt, { Secret } from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";
import ms, { StringValue } from "ms";

dotenv.config();

const router = express.Router();
const prisma = new PrismaClient();

interface LoginRequest extends Request {
  body: {
    email: string;
    password: string;
  };
}

router.post("/login", async (req: LoginRequest, res: Response) => {
  const { email, password } = req.body;

  try {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const jwtSecret: Secret | undefined = process.env.JWT_SECRET;
    if (!jwtSecret || jwtSecret.trim() === "") {
      console.error("JWT_SECRET is not defined in .env");
      return res.status(500).json({ message: "Server configuration error" });
    }

    const expiresIn: StringValue =
      (process.env.JWT_EXPIRES_IN as StringValue) || "1d";

    const token = jwt.sign(
      { userId: user.id, role: user.role },
      jwtSecret,
      { expiresIn }
    );

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: ms(expiresIn), // converts "1d" into milliseconds
    });

    return res.json({ message: "Login successful" });
  } catch (err) {
    console.error("Auth login error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

router.get("/check", async (req: Request, res: Response) => {
  const token = req.cookies.token;

  if (!token) {
    return res.status(401).json({ message: "Authentication token missing" });
  }

  try {
    const jwtSecret: Secret | undefined = process.env.JWT_SECRET;
    if (!jwtSecret || jwtSecret.trim() === "") {
      console.error("JWT_SECRET is not defined in .env");
      return res.status(500).json({ message: "Server configuration error" });
    }

    const decoded = jwt.verify(token, jwtSecret) as { userId: number; role: string };

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.json({ email: user.email, role: user.role });
  } catch (err) {
    console.error("Auth check error:", err);
    return res.status(401).json({ message: "Invalid or expired token" });
  }
});

router.get("/checkin", async (req: Request, res: Response) => {
  const token = req.cookies.token;

  if (!token) {
    return res.status(401).json({ message: "Authentication token missing" });
  }

  try {
    const jwtSecret: Secret | undefined = process.env.JWT_SECRET;
    if (!jwtSecret || jwtSecret.trim() === "") {
      console.error("JWT_SECRET is not defined in .env");
      return res.status(500).json({ message: "Server configuration error" });
    }

    const decoded = jwt.verify(token, jwtSecret) as { userId: number; role: string };

    return res.json({ userId: decoded.userId, role: decoded.role });
  } catch (err) {
    console.error("Auth check error:", err);
    return res.status(401).json({ message: "Invalid or expired token" });
  }
});


export default router;
