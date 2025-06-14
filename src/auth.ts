import express from "express";
import bcrypt from "bcrypt";
import session from "express-session";
import connectPg from "connect-pg-simple";
import type { Express, RequestHandler } from "express";
import { storage } from "./storage.js";

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: true,
    ttl: sessionTtl,
    tableName: "sessions",
  });

  const isProduction = process.env.NODE_ENV === "production";

  return session({
    secret: process.env.SESSION_SECRET || "parc-info-secret-key",
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    proxy: isProduction,
    cookie: {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "none" : "lax",
      maxAge: sessionTtl,
      path: "/",
      domain: isProduction ? "mrscorlay-parc-info-backend.vercel.app" : undefined
    },
  });
}

export async function setupAuth(app: Express) {
  // Trust first proxy in production
  if (process.env.NODE_ENV === "production") {
    app.set("trust proxy", 1);
  }
  
  // Ajouter des logs pour le débogage
  app.use((req, res, next) => {
    console.log('Auth middleware:', {
      method: req.method,
      path: req.path,
      session: req.session,
      cookies: req.cookies,
      headers: req.headers
    });
    next();
  });

  app.use(getSession());
}

export const isAuthenticated: RequestHandler = async (req, res, next) => {
  if (!req.session?.userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const user = await storage.getUser(req.session.userId);
    if (!user || !user.isActive) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    req.currentUser = user;
    next();
  } catch (error) {
    console.error("Error checking authentication:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const hasRole = (allowedRoles: string[]): RequestHandler => {
  return async (req, res, next) => {
    if (!req.session?.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      const user = await storage.getUser(req.session.userId);
      
      if (!user || !user.isActive) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      if (!allowedRoles.includes(user.role)) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      req.currentUser = user;
      next();
    } catch (error) {
      console.error("Error checking user role:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  };
};

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// Extend Express Request interface
declare global {
  namespace Express {
    interface Request {
      currentUser?: any;
    }
  }
}

declare module "express-session" {
  interface SessionData {
    userId: string;
  }
}