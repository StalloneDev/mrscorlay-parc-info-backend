import express from "express";
import session from "express-session";
import pgSession from "connect-pg-simple";
import { pool } from "./db.js";
import cors from "cors";
import { registerRoutes } from "./routes.js";

const app = express();

// Configuration des en-têtes de sécurité
app.use((req, res, next) => {
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';"
  );
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

// Configuration de CORS
app.use(cors({
  origin: process.env.NODE_ENV === "production" 
    ? ["https://mrs-parc-info.netlify.app", "https://mrscorlay-parcinfo.vercel.app", "https://mrscorlay-parc-info-frontend.vercel.app"]
    : ["http://localhost:5173", "http://localhost:3000"],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin']
}));

// Configuration de la session
const PostgresqlStore = pgSession(session);
const sessionStore = new PostgresqlStore({
  pool,
  createTableIfMissing: true,
});

app.use(session({
  store: sessionStore,
  secret: process.env.SESSION_SECRET || "your-secret-key",
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    maxAge: 24 * 60 * 60 * 1000, // 24 heures
    domain: process.env.NODE_ENV === "production" ? ".vercel.app" : undefined
  }
}));

app.use(express.json());

// Enregistrement des routes
const server = await registerRoutes(app);

export { app, server }; 