import express from "express";
import cors from "cors";
import session from "express-session";
import pgSession from "connect-pg-simple";
import { pool } from "./db.js";
import { registerRoutes } from "./routes.js";
import { getSession } from "./auth.js";

const app = express();

// Configuration CORS
const corsOptions = {
  origin: process.env.NODE_ENV === "production"
    ? ["https://mrscorlay-parcinfo.vercel.app"]
    : ["http://localhost:5173"],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "Accept"],
  exposedHeaders: ["Set-Cookie"],
};

app.use(cors(corsOptions));

// Configuration de la session
app.use(getSession());

// Middleware pour parser le JSON
app.use(express.json());

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

// Enregistrement des routes
const server = await registerRoutes(app);

export { app, server }; 