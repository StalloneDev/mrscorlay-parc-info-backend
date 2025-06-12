import { Router } from "express";
import multer from "multer";
import * as XLSX from "xlsx";
import { db } from "../db.js";
import { employees, equipment, inventory, licenses, maintenanceSchedules, tickets, maintenanceEquipment, maintenanceTechnicians, InsertMaintenanceSchedule } from "../shared/schema.js";
import { eq } from "drizzle-orm";
import { authenticateToken } from "../middleware/auth.js";
import { Request } from "express";
import { users } from "../shared/schema.js";

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
    // Définir les en-têtes et les données selon le type
    let headers: string[] = [];
    let data: any[] = [];

    // Récupérer les données de référence une seule fois
    const employeeNames = await db.select().from(employees);
    const employeeMap = new Map(employeeNames.map(emp => [emp.id, `${emp.name} ${emp.position}`]));
    const equipmentData = await db.select().from(equipment);
    const equipmentMap = new Map(equipmentData.map(eq => [eq.id, eq.model]));
    const userData = await db.select().from(users);
    const userMap = new Map(userData.map(user => [user.id, `${user.firstName} ${user.lastName} ${user.email}`]));

    switch (type) {
      case "employees":
        headers = ["ID", "Nom", "Prénom", "Email", "Téléphone", "Poste", "Département"];
        data = await db.select().from(employees);
        break;

      case "equipment":
        headers = ["ID", "Nom", "Type", "Numéro de série", "Statut", "Date d'acquisition", "Assigné à"];
        const equipmentData = await db.select().from(equipment);
        data = equipmentData.map(item => ({
          ...item,
          "Assigné à": item.assignedTo ? userMap.get(item.assignedTo) || "Non assigné" : "Non assigné"
        }));
        break;

      case "inventory":
        headers = ["ID", "Équipement", "Emplacement", "Dernière vérification", "État", "Assigné à"];
        const inventoryData = await db.select().from(inventory);
        data = inventoryData.map(item => ({
          ...item,
          "Équipement": item.equipmentId ? equipmentMap.get(item.equipmentId) || "Inconnu" : "Inconnu",
          "Assigné à": item.assignedTo ? userMap.get(item.assignedTo) || "Non assigné" : "Non assigné"
        }));
        break;

      case "licenses":
        headers = ["ID", "Nom", "Vendeur", "Type", "Clé de licence", "Utilisateurs max", "Utilisateurs actuels", "Coût"];
        data = await db.select().from(licenses);
        break;

      case "maintenanceSchedules":
        headers = ["ID", "Type", "Titre", "Description", "Date de début", "Date de fin", "Statut", "Notes", "Créé par"];
        const maintenanceData = await db.select().from(maintenanceSchedules);
        data = maintenanceData.map(item => ({
          ...item,
          "Créé par": item.createdBy ? userMap.get(item.createdBy) || "Inconnu" : "Inconnu"
        }));
        break;

      case "tickets":
        headers = ["ID", "Titre", "Description", "Priorité", "Statut", "Créé par", "Assigné à", "Date de création"];
        const ticketsData = await db.select().from(tickets);
        data = ticketsData.map(item => ({
          ...item,
          "Créé par": item.createdBy ? userMap.get(item.createdBy) || "Inconnu" : "Inconnu",
          "Assigné à": item.assignedTo ? userMap.get(item.assignedTo) || "Non assigné" : "Non assigné"
        }));
        break;

      default:
        return res.status(400).json({ error: "Type de données invalide" });
    }

    // Créer un nouveau classeur Excel
    const workbook = XLSX.utils.book_new();
    
    const worksheet = XLSX.utils.aoa_to_sheet([headers]);
    worksheet['!cols'] = headers.map(() => ({ wch: 25 }));

    // Ajouter une ligne d'exemple vide
    const emptyRow = headers.map(() => "");
    XLSX.utils.sheet_add_aoa(worksheet, [emptyRow], { origin: -1 });
    
    // Ajuster la largeur des colonnes
    const colWidths = headers.map(() => ({ wch: 25 }));
    worksheet['!cols'] = colWidths;
    
    // Ajouter la feuille au classeur
    XLSX.utils.book_append_sheet(workbook, worksheet, type);
    
    // Générer le fichier Excel
    const excelBuffer = XLSX.write(workbook, {
      type: "buffer",
      bookType: "xlsx",
      cellStyles: true
    });
    
    // Envoyer le fichier
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename=${type}-export-${new Date().toISOString()}.xlsx`);
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

// Route pour générer un modèle Excel
router.get("/template/:type", async (req, res) => {
  const { type } = req.params;

  try {
    // Définir les en-têtes selon le type
    let headers: string[] = [];
    let data: any[] = [];

    switch (type) {
      case "equipment":
        headers = ["ID", "Nom", "Type", "Numéro de série", "Statut", "Date d'acquisition", "Assigné à"];
        data = [{
          ID: "",
          Nom: "",
          Type: "ordinateur", // Valeur par défaut
          "Numéro de série": "",
          Statut: "en service", // Valeur par défaut
          "Date d'acquisition": "",
          "Assigné à": ""
        }];
        break;

      case "inventory":
        headers = ["ID", "Équipement", "Emplacement", "Dernière vérification", "État", "Assigné à"];
        data = [{
          ID: "",
          Équipement: "",
          Emplacement: "",
          "Dernière vérification": "",
          État: "fonctionnel", // Valeur par défaut
          "Assigné à": ""
        }];
        break;

      case "tickets":
        headers = ["ID", "Titre", "Description", "Priorité", "Statut", "Créé par", "Assigné à", "Date de création"];
        data = [{
          ID: "",
          Titre: "",
          Description: "",
          Priorité: "moyenne", // Valeur par défaut
          Statut: "ouvert", // Valeur par défaut
          "Créé par": "",
          "Assigné à": "",
          "Date de création": ""
        }];
        break;

      default:
        return res.status(400).json({ error: "Type de données invalide" });
    }

    // Créer un nouveau classeur Excel
    const workbook = XLSX.utils.book_new();
    
    // Convertir les données en format Excel avec des options de formatage
    const worksheet = XLSX.utils.json_to_sheet(data, { 
      header: headers,
      skipHeader: true,
      dateNF: 'dd/mm/yyyy'
    });

    // Ajouter les en-têtes manuellement
    XLSX.utils.sheet_add_aoa(worksheet, [headers], { origin: 'A1' });

    // Ajuster la largeur des colonnes
    const colWidths = headers.map(() => ({ wch: 25 }));
    worksheet['!cols'] = colWidths;

    // Ajouter la feuille au classeur
    XLSX.utils.book_append_sheet(workbook, worksheet, type);
    
    // Générer le fichier Excel
    const excelBuffer = XLSX.write(workbook, { 
      type: "buffer", 
      bookType: "xlsx",
      cellStyles: true
    });
    
    // Envoyer le fichier
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename=${type}-template.xlsx`);
    res.send(excelBuffer);
  } catch (error) {
    console.error("Erreur lors de la génération du modèle:", error);
    res.status(500).json({ error: "Erreur lors de la génération du modèle" });
  }
});

export default router; 