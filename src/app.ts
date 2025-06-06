import express from "express";
import session from "express-session";
import pgSession from "connect-pg-simple";
import { pool } from "./db.js";
import cors from "cors";
import { registerRoutes } from "./routes.js";

const app = express();

// Configuration de CORS
app.use(cors({
  origin: process.env.NODE_ENV === "production" 
    ? ["https://mrs-parc-info.netlify.app", "https://mrs-parc-info-frontend.netlify.app", "https://mrscorlay-parcinfo.vercel.app"]
    : "http://localhost:5173",
  credentials: true
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
    maxAge: 24 * 60 * 60 * 1000 // 24 heures
  }
}));

app.use(express.json());

// Enregistrement des routes
const server = await registerRoutes(app);

export { app, server }; 