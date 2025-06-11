import express from "express";
import session from "express-session";
import pgSession from "connect-pg-simple";
import { pool } from "./db.js";
import { registerRoutes } from "./routes.js";

const app = express();

// Configuration de CORS - doit être le premier middleware
const isProduction = process.env.NODE_ENV === "production";
const allowedOrigins = isProduction
  ? [
      "https://mrs-parc-info.netlify.app",
      "https://mrscorlay-parcinfo.vercel.app",
      "https://mrscorlay-parc-info-frontend.vercel.app",
      "https://mrscorlay-parc-info.vercel.app"
    ]
  : ["http://localhost:5173"];

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

// Middleware pour logger les requêtes
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`, {
    cookies: req.cookies,
    session: req.session,
    headers: req.headers,
    body: req.body
  });
  next();
});

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