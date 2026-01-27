import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  // Password को bcrypt से hash करो
  const hashedPassword = await bcrypt.hash("temporaryPasswordye", 10);

  // Check करो कि user पहले से exist करता है या नहीं
  const existingUser = await prisma.user.findUnique({
    where: { email: "admin@johriworks.com" },
  });

  if (existingUser) {
    console.log("Admin user already exists");
    return;
  }

  // Admin user create करो
  const adminUser = await prisma.user.create({
    data: {
      name: "Admin",
      email: "admin@johriworks.com",
      password: hashedPassword,
    },
  });

  console.log("Admin user created successfully:", adminUser);
}

main()
  .catch((e) => console.error("Error creating admin user:", e))
  .finally(() => prisma.$disconnect());

  