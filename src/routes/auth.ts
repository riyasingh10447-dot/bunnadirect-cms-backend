import express, { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt, { Secret } from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";
import ms, { StringValue } from "ms";
import { authenticateJWT, AuthRequest } from "../middleware/auth";
import crypto from "crypto";
import nodemailer from "nodemailer";
dotenv.config();

const router = express.Router();
const prisma = new PrismaClient();

interface LoginRequest extends Request {
  body: {
    email: string;
    password: string;
  };
}
{/*--og
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
*/}

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
      maxAge: ms(expiresIn),
    });

    // ✅ Only force password change for editors
    const forceChangePassword = user.role === "editor" && user.mustChangePassword;

    return res.json({ 
      message: "Login successful", 
      role: user.role,
      mustChangePassword: forceChangePassword
    });
  } catch (err) {
    console.error("Auth login error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});



router.post("/change-password", authenticateJWT, async (req: AuthRequest, res: Response) => {
  const { oldPassword, newPassword } = req.body;

  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId }, // ✅ now TypeScript knows about req.user
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isMatch = await bcrypt.compare(oldPassword, user.password_hash);
    if (!isMatch) {
      return res.status(400).json({ message: "Old password is incorrect" });
    }

    const newPasswordHash = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password_hash: newPasswordHash,
        mustChangePassword: false,
      },
    });

    return res.json({ message: "Password updated successfully" });
  } catch (err) {
    console.error("Change password error:", err);
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

router.post("/logout", (req: Request, res: Response) => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  });
  return res.json({ message: "Logged out successfully" });
});

// ✅ Reset Password Route (for forgot password email link)
router.post("/reset-password", async (req: Request, res: Response) => {
  const { token, newPassword } = req.body;

  if (!token || !newPassword)
    return res.status(400).json({ message: "Token and new password are required" });

  try {
    const user = await prisma.user.findFirst({
      where: {
        resetToken: token,
        resetTokenExpiry: { gt: new Date() },
      },
    });

    if (!user) return res.status(400).json({ message: "Invalid or expired token" });

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password_hash: hashedPassword,
        resetToken: null,
        resetTokenExpiry: null,
      },
    });

    return res.json({ message: "Password reset successful" });
  } catch (error) {
    console.error("Reset password error:", error);
    return res.status(500).json({ message: "Server error" });
  }
});

// inside routes/auth.ts

router.post("/forgot-password", async (req: Request, res: Response) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: "Email is required" });
  }

  try {
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenExpiry = Date.now() + 3600000; // 1 hour

    await prisma.user.update({
      where: { email },
      data: {
        resetToken,
        resetTokenExpiry: new Date(resetTokenExpiry),
      },
    });

    // Send email with reset link
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const resetUrl = `${process.env.FRONTEND_URL}/change-password?token=${resetToken}`;

    const mailOptions = {
      from: process.env.SMTP_USER,
      to: email,
      subject: "Password Reset Request",
      html: `
        <p>You requested a password reset</p>
        <p>Click this link to reset your password:</p>
        <a href="${resetUrl}">${resetUrl}</a>
        <p>This link will expire in 1 hour.</p>
      `,
    };

    await transporter.sendMail(mailOptions);

    return res.json({ message: "Password reset link has been sent to your email." });
  } catch (error) {
    console.error("Forgot password error:", error);
    return res.status(500).json({ message: "Server error" });
  }
});
export default router;
