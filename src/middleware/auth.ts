import { Request, Response, NextFunction } from "express";
import { db } from "../db.js";
import { users } from "../shared/schema.js";
import type { User } from "../shared/schema.js";

// Définir l'interface CustomUser qui étend User sans le mot de passe
interface CustomUser extends Omit<User, 'password'> {}

// Étendre le type User de Passport avec notre type CustomUser
declare global {
  namespace Express {
    interface User extends CustomUser {}
  }
}

export const authenticateToken = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Non authentifié" });
    }

    const user = await db.query.users.findFirst({
      where: (users, { eq }) => eq(users.id, req.session.userId as string)
    });

    if (!user) {
      return res.status(401).json({ message: "Utilisateur non trouvé" });
    }

    // On omet le mot de passe avant d'assigner l'utilisateur à req.user
    const { password, ...userWithoutPassword } = user;
    req.user = userWithoutPassword as CustomUser;
    next();
  } catch (error) {
    console.error("Auth error:", error);
    res.status(500).json({ message: "Erreur d'authentification" });
  }
}; 