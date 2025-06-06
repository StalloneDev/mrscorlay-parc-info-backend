import { Request, Response, NextFunction } from "express";

export const checkRole = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Non authentifié" });
      }

      if (!allowedRoles.includes(req.user.role)) {
        return res.status(403).json({ message: "Accès non autorisé" });
      }

      next();
    } catch (error) {
      console.error("Role check error:", error);
      res.status(500).json({ message: "Erreur lors de la vérification des droits" });
    }
  };
}; 