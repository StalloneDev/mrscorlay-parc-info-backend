import express from "express";
import { storage } from "../storage.js";

const router = express.Router();

router.post("/login", async (req, res) => {
  // TODO: Implement login
});

router.post("/logout", (req, res) => {
  // TODO: Implement logout
});

export default router; 