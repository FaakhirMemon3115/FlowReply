// src/modules/auth/auth.service.ts
import { RegisterInput, LoginInput } from "./validation/auth.schema";
import { getPrisma } from "../../utils/prisma";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";

const prisma = getPrisma();

const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || "access_secret";
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "refresh_secret";

export const registerUser = async (input: RegisterInput) => {
  const existingUser = await prisma.user.findUnique({
    where: { email: input.email }
  });

  if (existingUser) {
    throw new Error("User with this email already exists");
  }

  const passwordHash = await bcrypt.hash(input.password, 10);
  const user = await prisma.user.create({
    data: {
      email: input.email,
      passwordHash
    }
  });

  // Automatically create a default business for the user
  const business = await prisma.business.create({
    data: {
      name: `${input.email.split("@")[0]}'s Business`,
      settings: {
        create: {}
      }
    }
  });

  // Create default Owner role for this business
  const role = await prisma.role.create({
    data: {
      name: "Owner",
      businessId: business.id
    }
  });

  // Associate user with business as Owner role
  await prisma.businessMember.create({
    data: {
      userId: user.id,
      businessId: business.id,
      roleId: role.id
    }
  });

  const { accessToken, refreshToken } = generateTokens(user.id);

  // Save refresh token to DB
  await prisma.userSession.create({
    data: {
      userId: user.id,
      refreshToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
    }
  });

  return {
    user: { id: user.id, email: user.email },
    business: { id: business.id, name: business.name },
    accessToken,
    refreshToken
  };
};

export const loginUser = async (input: LoginInput) => {
  const user = await prisma.user.findUnique({
    where: { email: input.email },
    include: {
      businessMembers: {
        include: {
          business: true
        }
      }
    }
  });

  if (!user) {
    throw new Error("Invalid email or password");
  }

  const isPasswordValid = await bcrypt.compare(input.password, user.passwordHash);
  if (!isPasswordValid) {
    throw new Error("Invalid email or password");
  }

  const { accessToken, refreshToken } = generateTokens(user.id);

  // Save refresh token to DB
  await prisma.userSession.create({
    data: {
      userId: user.id,
      refreshToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    }
  });

  const business = user.businessMembers[0]?.business || null;

  return {
    user: { id: user.id, email: user.email },
    business,
    accessToken,
    refreshToken
  };
};

export const refreshAccessToken = async (token: string) => {
  if (!token) {
    throw new Error("Refresh token required");
  }

  const session = await prisma.userSession.findUnique({
    where: { refreshToken: token }
  });

  if (!session || session.expiresAt < new Date()) {
    throw new Error("Invalid or expired session");
  }

  try {
    jwt.verify(token, JWT_REFRESH_SECRET);
  } catch (err) {
    throw new Error("Invalid refresh token signature");
  }

  const { accessToken, refreshToken: newRefreshToken } = generateTokens(session.userId);

  // Update session with new refresh token
  await prisma.userSession.update({
    where: { id: session.id },
    data: {
      refreshToken: newRefreshToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    }
  });

  return {
    accessToken,
    refreshToken: newRefreshToken
  };
};

export const logoutUser = async (token: string) => {
  if (!token) return;
  await prisma.userSession.deleteMany({
    where: { refreshToken: token }
  });
};

const generateTokens = (userId: string) => {
  const accessToken = jwt.sign({ userId, type: "access" }, JWT_ACCESS_SECRET, { expiresIn: "15m" });
  const refreshToken = jwt.sign({ userId, type: "refresh", jti: crypto.randomUUID() }, JWT_REFRESH_SECRET, { expiresIn: "7d" });
  return { accessToken, refreshToken };
};
