import express from "express";
import { db } from "../db.js";
import { maintenanceSchedules, insertMaintenanceScheduleSchema } from "../shared/schema.js";
import { eq } from "drizzle-orm";
import { authenticateToken } from "../middleware/auth.js";
import { checkRole } from "../middleware/roles.js";
import { z } from "zod";

const router = express.Router();

// Schéma de validation pour la création d'une maintenance
const createMaintenanceSchema = z.object({
  type: z.enum(["preventive", "corrective", "mise_a_jour"]),
  title: z.string().min(1, "Le titre est requis"),
  description: z.string().min(1, "La description est requise"),
  startDate: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "La date doit être au format YYYY-MM-DD")
    .transform((date) => {
      const [year, month, day] = date.split('-').map(Number);
      return new Date(year, month - 1, day);
    }),
  endDate: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "La date doit être au format YYYY-MM-DD")
    .transform((date) => {
      const [year, month, day] = date.split('-').map(Number);
      return new Date(year, month - 1, day);
    }),
  notes: z.string().nullable().optional(),
}).refine((data) => {
  return data.endDate >= data.startDate;
}, {
  message: "La date de fin doit être égale ou postérieure à la date de début",
  path: ["endDate"],
});

// Get all maintenance schedules
router.get("/", authenticateToken, async (req, res) => {
  try {
    const maintenances = await db.select().from(maintenanceSchedules);
    res.json(maintenances);
  } catch (error) {
    console.error("Error fetching maintenance schedules:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Create a new maintenance schedule
router.post("/", authenticateToken, checkRole(["admin", "technicien"]), async (req, res) => {
  try {
    console.log("Données reçues:", req.body);

    // Valider les données reçues
    const validationResult = createMaintenanceSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      console.error("Erreur de validation:", validationResult.error);
      return res.status(400).json({
        message: "Invalid maintenance schedule data",
        errors: validationResult.error.errors.map(err => ({
          path: err.path.join('.'),
          message: err.message
        }))
      });
    }

    const { type, title, description, startDate, endDate, notes } = validationResult.data;

    // Créer la maintenance
    const [maintenance] = await db.insert(maintenanceSchedules).values({
      type,
      title,
      description,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      status: "planifie",
      notes: notes || null,
      createdBy: req.user?.id as string,
    }).returning();

    console.log("Maintenance créée:", maintenance);
    res.status(201).json(maintenance);
  } catch (error) {
    console.error("Error creating maintenance schedule:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get a specific maintenance schedule
router.get("/:id", authenticateToken, async (req, res) => {
  try {
    const maintenance = await db.select().from(maintenanceSchedules).where(eq(maintenanceSchedules.id, req.params.id));
    if (maintenance.length === 0) {
      return res.status(404).json({ error: "Maintenance schedule not found" });
    }
    res.json(maintenance[0]);
  } catch (error) {
    console.error("Error fetching maintenance schedule:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Update a maintenance schedule
router.put("/:id", authenticateToken, checkRole(["admin", "technicien"]), async (req, res) => {
  try {
    const { type, title, description, startDate, endDate, status, notes } = req.body;
    const maintenance = await db.update(maintenanceSchedules)
      .set({
        type,
        title,
        description,
        startDate: startDate ? new Date(startDate).toISOString() : undefined,
        endDate: endDate ? new Date(endDate).toISOString() : undefined,
        status,
        notes,
        updatedAt: new Date(),
      })
      .where(eq(maintenanceSchedules.id, req.params.id))
      .returning();

    if (maintenance.length === 0) {
      return res.status(404).json({ error: "Maintenance schedule not found" });
    }
    res.json(maintenance[0]);
  } catch (error) {
    console.error("Error updating maintenance schedule:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Delete a maintenance schedule
router.delete("/:id", authenticateToken, checkRole(["admin"]), async (req, res) => {
  try {
    const maintenance = await db.delete(maintenanceSchedules)
      .where(eq(maintenanceSchedules.id, req.params.id))
      .returning();

    if (maintenance.length === 0) {
      return res.status(404).json({ error: "Maintenance schedule not found" });
    }
    res.json({ message: "Maintenance schedule deleted successfully" });
  } catch (error) {
    console.error("Error deleting maintenance schedule:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router; 