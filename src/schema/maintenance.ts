import { sql } from "drizzle-orm";
import { 
  sqliteTable, 
  text, 
  integer,
  primaryKey 
} from "drizzle-orm/sqlite-core";

export const maintenanceSchedules = sqliteTable("maintenance_schedules", {
  id: text("id").primaryKey(),
  type: text("type", { enum: ["preventive", "corrective", "mise_a_jour"] }).notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  startDate: text("start_date").notNull(),
  endDate: text("end_date").notNull(),
  status: text("status", { enum: ["planifie", "en_cours", "termine"] }).notNull().default("planifie"),
  notes: text("notes"),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").default(sql`CURRENT_TIMESTAMP`),
  createdBy: text("created_by").notNull(),
}); 