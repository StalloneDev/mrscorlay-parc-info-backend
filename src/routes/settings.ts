import { Router } from "express";
import multer from "multer";
import * as XLSX from "xlsx";
import { db } from "../db.js";
import { employees, equipment, inventory, licenses, maintenanceSchedules, tickets, maintenanceEquipment, maintenanceTechnicians, InsertMaintenanceSchedule } from "../shared/schema.js";
import { eq } from "drizzle-orm";
import { authenticateToken } from "../middleware/auth.js";
import { Request } from "express";

const router = Router();

// Configuration de multer pour le stockage des fichiers
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage: storage });

// Interface pour étendre Request avec le fichier uploadé
interface MulterRequest extends Request {
  file?: Express.Multer.File;
}

// Route pour exporter les données
router.get("/export/:type", authenticateToken, async (req, res) => {
  const { type } = req.params;

  try {
    let data;
    let headers;

    switch (type) {
      case "employees":
        data = await db.select().from(employees);
        headers = ["ID", "Nom", "Email", "Département", "Poste", "Date de création", "Date de mise à jour"];
        break;

      case "equipment":
        data = await db.select().from(equipment);
        headers = ["ID", "Type", "Modèle", "Numéro de série", "Date d'achat", "Statut", "Assigné à", "Date de création", "Date de mise à jour"];
        break;

      case "inventory":
        data = await db.select().from(inventory);
        headers = ["ID", "ID Équipement", "Assigné à", "Localisation", "Dernière vérification", "État", "Date de création", "Date de mise à jour"];
        break;

      case "licenses":
        data = await db.select().from(licenses);
        headers = ["ID", "Nom", "Vendeur", "Type", "Clé de licence", "Utilisateurs max", "Utilisateurs actuels", "Coût", "Date d'expiration", "Date de création", "Date de mise à jour"];
        break;

      case "planning":
        data = await db.select().from(maintenanceSchedules);
        headers = ["ID", "ID Équipement", "Titre", "Date planifiée", "Date de début", "Date de fin", "Type", "Description", "Assigné à", "Statut", "Date de création", "Date de mise à jour"];
        break;

      case "tickets":
        data = await db.select().from(tickets);
        headers = ["ID", "Titre", "Description", "Créé par", "Assigné à", "Statut", "Priorité", "Date de création", "Date de mise à jour"];
        break;

      default:
        return res.status(400).json({ error: "Type de données invalide" });
    }

    // Créer un nouveau classeur Excel
    const workbook = XLSX.utils.book_new();
    
    // Convertir les données en format Excel
    const worksheet = XLSX.utils.json_to_sheet(data, { header: headers });
    
    // Ajouter la feuille au classeur
    XLSX.utils.book_append_sheet(workbook, worksheet, type);
    
    // Générer le fichier Excel
    const excelBuffer = XLSX.write(workbook, { type: "buffer", bookType: "xls" });
    
    // Envoyer le fichier
    res.setHeader("Content-Type", "application/vnd.ms-excel");
    res.setHeader("Content-Disposition", `attachment; filename=${type}-export-${new Date().toISOString()}.xls`);
    res.send(excelBuffer);

  } catch (error) {
    console.error("Erreur lors de l'export:", error);
    res.status(500).json({ error: "Erreur lors de l'export des données" });
  }
});

// Route pour importer les données
router.post("/import", authenticateToken, upload.single("file"), async (req: MulterRequest, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "Aucun fichier n'a été uploadé" });
  }

  const { type } = req.body;

  try {
    // Lire le fichier Excel
    const workbook = XLSX.readFile(req.file.path);
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(worksheet);

    // Traiter les données selon le type
    switch (type) {
      case "employees":
        for (const row of data as any) {
          await db.insert(employees).values({
            id: row.ID || undefined,
            name: row.Nom,
            email: row.Email,
            department: row.Département,
            position: row.Poste,
            createdAt: row["Date de création"] || new Date().toISOString(),
            updatedAt: row["Date de mise à jour"] || new Date().toISOString(),
          });
        }
        break;

      case "equipment":
        for (const row of data as any) {
          await db.insert(equipment).values({
            id: row.ID || undefined,
            type: row.Type,
            model: row.Modèle,
            serialNumber: row["Numéro de série"],
            purchaseDate: row["Date d'achat"],
            status: row.Statut,
            assignedTo: row["Assigné à"] || null,
            createdAt: row["Date de création"] || new Date().toISOString(),
            updatedAt: row["Date de mise à jour"] || new Date().toISOString(),
          });
        }
        break;

      case "inventory":
        for (const row of data as any) {
          await db.insert(inventory).values({
            id: row.ID || undefined,
            equipmentId: row["ID Équipement"],
            assignedTo: row["Assigné à"] || null,
            location: row.Localisation,
            lastChecked: row["Dernière vérification"],
            condition: row.État,
            createdAt: row["Date de création"] || new Date().toISOString(),
            updatedAt: row["Date de mise à jour"] || new Date().toISOString(),
          });
        }
        break;

      case "licenses":
        for (const row of data as any) {
          await db.insert(licenses).values({
            name: row.Nom,
            vendor: row.Vendeur,
            type: row.Type,
            licenseKey: row["Clé de licence"] || null,
            maxUsers: row["Utilisateurs max"] || null,
            currentUsers: row["Utilisateurs actuels"],
            cost: row.Coût || null
          });
        }
        break;

      case "planning":
        for (const row of data as any) {
          const maintenanceData: InsertMaintenanceSchedule = {
            type: (row.Type === "preventive" || row.Type === "corrective" || row.Type === "mise_a_jour") 
              ? row.Type 
              : "preventive",
            title: row.Titre,
            description: row.Description,
            startDate: new Date(row["Date de début"]).toISOString(),
            endDate: new Date(row["Date de fin"]).toISOString(),
            status: (row.Statut === "planifie" || row.Statut === "en_cours" || row.Statut === "termine" || row.Statut === "annule")
              ? row.Statut
              : "planifie",
            notes: row.Notes || null,
            createdBy: row["Créé par"]
          };

          const [maintenance] = await db.insert(maintenanceSchedules)
            .values(maintenanceData)
            .returning({ id: maintenanceSchedules.id });

          // Si un équipement est spécifié, créer la liaison
          if (row["ID Équipement"]) {
            await db.insert(maintenanceEquipment).values({
              maintenanceId: maintenance.id,
              equipmentId: row["ID Équipement"]
            });
          }

          // Si un technicien est assigné, créer la liaison
          if (row["Assigné à"]) {
            await db.insert(maintenanceTechnicians).values({
              maintenanceId: maintenance.id,
              technicianId: row["Assigné à"]
            });
          }
        }
        break;

      case "tickets":
        for (const row of data as any) {
          await db.insert(tickets).values({
            id: row.ID || undefined,
            title: row.Titre,
            description: row.Description,
            createdBy: row["Créé par"],
            assignedTo: row["Assigné à"] || null,
            status: row.Statut,
            priority: row.Priorité,
            createdAt: row["Date de création"] || new Date().toISOString(),
            updatedAt: row["Date de mise à jour"] || new Date().toISOString(),
          });
        }
        break;

      default:
        return res.status(400).json({ error: "Type de données invalide" });
    }

    res.json({ message: "Import réussi" });
  } catch (error) {
    console.error("Erreur lors de l'import:", error);
    res.status(500).json({ error: "Erreur lors de l'import des données" });
  }
});

export default router; 