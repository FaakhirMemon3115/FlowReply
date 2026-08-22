// src/modules/auth/auth.controller.ts
import { Request, Response, NextFunction } from "express";
import { registerUser, loginUser, refreshAccessToken, logoutUser } from "./auth.service";
import { validateRegister, validateLogin } from "./validation/auth.schema";

export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = validateRegister(req.body);
    const result = await registerUser(parsed);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = validateLogin(req.body);
    const result = await loginUser(parsed);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

export const refreshToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { refreshToken } = req.body;
    const result = await refreshAccessToken(refreshToken);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

export const logout = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { refreshToken } = req.body;
    await logoutUser(refreshToken);
    res.sendStatus(204);
  } catch (err) {
    next(err);
  }
};
