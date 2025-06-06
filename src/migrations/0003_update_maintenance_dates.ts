import { sql } from "drizzle-orm";
import { pgTable, date, timestamp } from "drizzle-orm/pg-core";

export async function up(db: any): Promise<void> {
  await db.run(sql`
    ALTER TABLE maintenance_schedules 
    ALTER COLUMN start_date TYPE date USING start_date::date,
    ALTER COLUMN end_date TYPE date USING end_date::date;
  `);
}

export async function down(db: any): Promise<void> {
  await db.run(sql`
    ALTER TABLE maintenance_schedules 
    ALTER COLUMN start_date TYPE timestamp USING start_date::timestamp,
    ALTER COLUMN end_date TYPE timestamp USING end_date::timestamp;
  `);
} 