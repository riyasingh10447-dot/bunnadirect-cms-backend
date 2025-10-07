import express, { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import nodemailer from "nodemailer";
import { authenticateJWT } from "../middleware/auth";
import { authorizeRoles } from "../middleware/role";

const router = express.Router();
const prisma = new PrismaClient();

async function sendCredentials(email: string, password: string) {
 const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});


  const mailOptions = {
    from: `"Admin" <${process.env.SMTP_USER}>`,
    to: email,
    subject: "Your Account Credentials",
    html: `
      <h2>CMS Credentials</h2>
      <p>Your account has been created successfully.Please find the credentials below</p>
      <p><b>Email:</b> ${email}</p>
      <p><b>Password:</b> ${password}</p>
      <p>Please change your password after first login.</p>
    `,
  };

  await transporter.sendMail(mailOptions);
}

router.post("/", authenticateJWT, authorizeRoles("admin"), async (req: Request, res: Response) => {
  const { email, password, role } = req.body;

  try {
    // 🔍 Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const password_hash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: { email, password_hash, role },
    });

    // Send email with credentials
    await sendCredentials(email, password);

    res.status(201).json({ message: "User created successfully", user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

{/*--og
router.post("/", authenticateJWT, authorizeRoles("admin"), async (req: Request, res: Response) => {
  const { email, password, role } = req.body;

  try {
    const password_hash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: { email, password_hash, role },
    });

    // Send email with credentials
    await sendCredentials(email, password);

    res.status(201).json({ message: "User created successfully", user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});
*/}
router.get("/", authenticateJWT, authorizeRoles("admin"), async (_req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
{/*import express, { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import { authenticateJWT } from "../middleware/auth";
import { authorizeRoles } from "../middleware/role";

const router = express.Router();
const prisma = new PrismaClient();

router.post("/", authenticateJWT, authorizeRoles("admin"), async (req: Request, res: Response) => {
  const { email, password, role } = req.body;

  try {
    const password_hash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: { email, password_hash, role },
    });

    res.status(201).json({ message: "User created successfully", user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

router.get(
  "/",
  authenticateJWT,
  authorizeRoles("admin"),
  async (_req: Request, res: Response) => {
    try {
      const users = await prisma.user.findMany({
        select: {
          id: true,
          email: true,
          role: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
      });

      res.json(users);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Server error" });
    }
  }
);
export default router;
*/}