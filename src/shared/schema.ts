import { pgTable, text, serial, integer, boolean, timestamp, varchar, uuid, jsonb, index, date } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table (mandatory for auth)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// Users table for local authentication
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: varchar("email").unique().notNull(),
  password: varchar("password").notNull(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  role: varchar("role").notNull().default("utilisateur"), // "admin", "technicien", "utilisateur"
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Employees table
export const employees = pgTable("employees", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  department: text("department").notNull(),
  position: text("position").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Equipment table
export const equipment = pgTable("equipment", {
  id: uuid("id").primaryKey().defaultRandom(),
  type: text("type", { enum: ["ordinateur", "serveur", "périphérique"] }).notNull(),
  model: text("model").notNull(),
  serialNumber: text("serial_number").notNull().unique(),
  purchaseDate: timestamp("purchase_date").notNull(),
  status: text("status", { enum: ["en service", "en maintenance", "hors service"] }).notNull().default("en service"),
  assignedTo: uuid("assigned_to").references(() => employees.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Equipment history table
export const equipmentHistory = pgTable("equipment_history", {
  id: uuid("id").primaryKey().defaultRandom(),
  equipmentId: uuid("equipment_id").references(() => equipment.id).notNull(),
  updatedBy: uuid("updated_by").references(() => users.id).notNull(),
  changes: text("changes").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Tickets table
export const tickets = pgTable("tickets", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  createdBy: uuid("created_by").references(() => users.id).notNull(),
  assignedTo: uuid("assigned_to").references(() => users.id),
  status: text("status", { enum: ["ouvert", "assigné", "en cours", "résolu", "clôturé"] }).notNull().default("ouvert"),
  priority: text("priority", { enum: ["basse", "moyenne", "haute"] }).notNull().default("moyenne"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Inventory table
export const inventory = pgTable("inventory", {
  id: uuid("id").primaryKey().defaultRandom(),
  equipmentId: uuid("equipment_id").references(() => equipment.id).notNull(),
  assignedTo: uuid("assigned_to").references(() => employees.id),
  location: text("location").notNull(),
  lastChecked: timestamp("last_checked").defaultNow(),
  condition: text("condition", { enum: ["fonctionnel", "défectueux"] }).notNull().default("fonctionnel"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Licenses table
export const licenses = pgTable("licenses", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  vendor: text("vendor").notNull(),
  type: text("type").notNull(), // Microsoft, Adobe, Antivirus, etc.
  licenseKey: text("license_key"),
  maxUsers: integer("max_users"),
  currentUsers: integer("current_users").default(0),
  cost: integer("cost"), // in cents
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Table pour l'historique des activités
export const activities = pgTable("activities", {
  id: uuid("id").primaryKey().defaultRandom(),
  type: text("type").notNull(), // "equipment_added", "equipment_maintenance", "equipment_updated", etc.
  title: text("title").notNull(),
  description: text("description").notNull(),
  status: text("status").notNull(),
  entityId: uuid("entity_id").notNull(), // ID de l'équipement, ticket, etc.
  entityType: text("entity_type").notNull(), // "equipment", "ticket", "license", etc.
  createdAt: timestamp("created_at").defaultNow(),
});

// Table des alertes
export const alerts = pgTable("alerts", {
  id: uuid("id").primaryKey().defaultRandom(),
  type: text("type", { enum: ["licence", "securite", "maintenance", "systeme"] }).notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  priority: text("priority", { enum: ["haute", "moyenne", "basse"] }).notNull(),
  status: text("status", { enum: ["nouvelle", "en_cours", "resolue"] }).notNull().default("nouvelle"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  createdBy: uuid("created_by").references(() => users.id),
  assignedTo: uuid("assigned_to").references(() => users.id),
  entityId: uuid("entity_id"), // ID de l'équipement, licence, etc. concerné
  entityType: text("entity_type"), // "equipment", "license", etc.
});

// Table des plannings de maintenance
export const maintenanceSchedules = pgTable("maintenance_schedules", {
  id: uuid("id").primaryKey().defaultRandom(),
  type: text("type", { enum: ["preventive", "corrective", "mise_a_jour"] }).notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  status: text("status", { enum: ["planifie", "en_cours", "termine", "annule"] }).notNull().default("planifie"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  createdBy: uuid("created_by").references(() => users.id),
});

// Table de liaison entre maintenance et techniciens
export const maintenanceTechnicians = pgTable("maintenance_technicians", {
  id: uuid("id").primaryKey().defaultRandom(),
  maintenanceId: uuid("maintenance_id").references(() => maintenanceSchedules.id).notNull(),
  technicianId: uuid("technician_id").references(() => users.id).notNull(),
  assignedAt: timestamp("assigned_at").defaultNow(),
});

// Table de liaison entre maintenance et équipements
export const maintenanceEquipment = pgTable("maintenance_equipment", {
  id: uuid("id").primaryKey().defaultRandom(),
  maintenanceId: uuid("maintenance_id").references(() => maintenanceSchedules.id).notNull(),
  equipmentId: uuid("equipment_id").references(() => equipment.id).notNull(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  createdTickets: many(tickets, { relationName: "created_tickets" }),
  assignedTickets: many(tickets, { relationName: "assigned_tickets" }),
  equipmentHistory: many(equipmentHistory),
}));

export const employeesRelations = relations(employees, ({ many }) => ({
  assignedEquipment: many(equipment),
  inventoryItems: many(inventory),
}));

export const equipmentRelations = relations(equipment, ({ one, many }) => ({
  assignedEmployee: one(employees, {
    fields: [equipment.assignedTo],
    references: [employees.id],
  }),
  history: many(equipmentHistory),
  inventoryItem: one(inventory),
}));

export const equipmentHistoryRelations = relations(equipmentHistory, ({ one }) => ({
  equipment: one(equipment, {
    fields: [equipmentHistory.equipmentId],
    references: [equipment.id],
  }),
  updatedBy: one(users, {
    fields: [equipmentHistory.updatedBy],
    references: [users.id],
  }),
}));

export const ticketsRelations = relations(tickets, ({ one }) => ({
  creator: one(users, {
    fields: [tickets.createdBy],
    references: [users.id],
    relationName: "created_tickets",
  }),
  assignee: one(users, {
    fields: [tickets.assignedTo],
    references: [users.id],
    relationName: "assigned_tickets",
  }),
}));

export const inventoryRelations = relations(inventory, ({ one }) => ({
  equipment: one(equipment, {
    fields: [inventory.equipmentId],
    references: [equipment.id],
  }),
  assignedEmployee: one(employees, {
    fields: [inventory.assignedTo],
    references: [employees.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertEmployeeSchema = createInsertSchema(employees).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertEquipmentSchema = z.object({
  type: z.enum(["ordinateur", "serveur", "périphérique"]),
  model: z.string().min(1, "Le modèle est requis"),
  serialNumber: z.string().min(1, "Le numéro de série est requis"),
  purchaseDate: z.string().transform((date) => new Date(date)),
  status: z.enum(["en service", "en maintenance", "hors service"]).default("en service"),
  assignedTo: z.string().nullable().optional(),
});

export const insertTicketSchema = createInsertSchema(tickets).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Schéma de validation pour la création d'inventaire
const baseInventorySchema = {
  equipmentId: z.string().uuid("L'ID de l'équipement doit être un UUID valide"),
  assignedTo: z.string().uuid("L'ID de l'employé doit être un UUID valide").nullable().optional(),
  location: z.string().min(1, "La localisation est requise"),
  condition: z.enum(["fonctionnel", "défectueux"]).default("fonctionnel"),
};

export const insertInventorySchema = z.object(baseInventorySchema);

export const updateInventorySchema = z.object(baseInventorySchema).partial();

export const insertLicenseSchema = z.object({
  name: z.string().min(1, "Le nom est requis"),
  vendor: z.string().min(1, "Le fournisseur est requis"),
  type: z.string().min(1, "Le type est requis"),
  licenseKey: z.string().nullable(),
  maxUsers: z.number().nullable(),
  currentUsers: z.number().default(0),
  cost: z.number().nullable(),
});

export const insertActivitySchema = createInsertSchema(activities).omit({
  id: true,
  createdAt: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type UpsertUser = typeof users.$inferInsert;

export type Employee = typeof employees.$inferSelect;
export type InsertEmployee = z.infer<typeof insertEmployeeSchema>;

export type Equipment = typeof equipment.$inferSelect;
export type InsertEquipment = z.infer<typeof insertEquipmentSchema>;

export type EquipmentHistory = typeof equipmentHistory.$inferSelect;

export type Ticket = typeof tickets.$inferSelect;
export type InsertTicket = z.infer<typeof insertTicketSchema>;

export type Inventory = typeof inventory.$inferSelect;
export type InsertInventory = z.infer<typeof insertInventorySchema>;

export type License = typeof licenses.$inferSelect;
export type InsertLicense = z.infer<typeof insertLicenseSchema>;

export type Activity = typeof activities.$inferSelect;
export type InsertActivity = z.infer<typeof insertActivitySchema>;

// Relations pour les alertes
export const alertsRelations = relations(alerts, ({ one }) => ({
  creator: one(users, {
    fields: [alerts.createdBy],
    references: [users.id],
  }),
  assignee: one(users, {
    fields: [alerts.assignedTo],
    references: [users.id],
  }),
}));

// Relations pour les maintenances
export const maintenanceSchedulesRelations = relations(maintenanceSchedules, ({ one, many }) => ({
  creator: one(users, {
    fields: [maintenanceSchedules.createdBy],
    references: [users.id],
  }),
  technicians: many(maintenanceTechnicians),
  equipment: many(maintenanceEquipment),
}));

// Schémas de validation
export const insertAlertSchema = createInsertSchema(alerts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertMaintenanceScheduleSchema = createInsertSchema(maintenanceSchedules).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Types
export type Alert = typeof alerts.$inferSelect;
export type InsertAlert = z.infer<typeof insertAlertSchema>;

export type MaintenanceSchedule = typeof maintenanceSchedules.$inferSelect;
export type InsertMaintenanceSchedule = z.infer<typeof insertMaintenanceScheduleSchema>;

// Mise à jour de l'interface IStorage
export interface IStorage {
  // ... existing methods ...

  // Alerts
  getAlert(id: string): Promise<Alert | undefined>;
  createAlert(alert: InsertAlert): Promise<Alert>;
  updateAlert(id: string, alert: Partial<InsertAlert>): Promise<Alert>;
  deleteAlert(id: string): Promise<void>;
  getAllAlerts(): Promise<Alert[]>;
  getAlertsByType(type: string): Promise<Alert[]>;
  getAlertsByStatus(status: string): Promise<Alert[]>;
  getAlertsByPriority(priority: string): Promise<Alert[]>;

  // Maintenance Schedules
  getMaintenanceSchedule(id: string): Promise<MaintenanceSchedule | undefined>;
  createMaintenanceSchedule(schedule: InsertMaintenanceSchedule): Promise<MaintenanceSchedule>;
  updateMaintenanceSchedule(id: string, schedule: Partial<InsertMaintenanceSchedule>): Promise<MaintenanceSchedule>;
  deleteMaintenanceSchedule(id: string): Promise<void>;
  getAllMaintenanceSchedules(): Promise<MaintenanceSchedule[]>;
  getUpcomingMaintenances(days: number): Promise<MaintenanceSchedule[]>;
  assignTechnicianToMaintenance(maintenanceId: string, technicianId: string): Promise<void>;
  removeTechnicianFromMaintenance(maintenanceId: string, technicianId: string): Promise<void>;
  addEquipmentToMaintenance(maintenanceId: string, equipmentId: string): Promise<void>;
  removeEquipmentFromMaintenance(maintenanceId: string, equipmentId: string): Promise<void>;
}

// Cette interface est déjà définie via le type inféré de la table maintenanceSchedules
