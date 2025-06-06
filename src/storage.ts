import {
  users,
  employees,
  equipment,
  equipmentHistory,
  tickets,
  inventory,
  licenses,
  activities,
  alerts,
  maintenanceSchedules,
  maintenanceTechnicians,
  maintenanceEquipment,
  type User,
  type Employee,
  type Equipment,
  type EquipmentHistory,
  type Ticket,
  type Inventory,
  type License,
  type Activity,
  type InsertUser,
  type UpsertUser,
  type InsertEmployee,
  type InsertEquipment,
  type InsertTicket,
  type InsertInventory,
  type InsertLicense,
  type InsertActivity,
  type InsertAlert,
  type MaintenanceSchedule,
  type InsertMaintenanceSchedule,
  type Alert,
} from "./shared/schema.js";
import { db } from "./db.js";
import { eq, desc, count, sql, and, or, gte, lte, not, asc } from "drizzle-orm";

export interface IStorage {
  // Users - local authentication
  getUser(id: string): Promise<User | undefined>;
  authenticateUser(email: string, password: string): Promise<User | null>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, user: Partial<InsertUser>): Promise<User>;
  deleteUser(id: string): Promise<void>;
  getAllUsers(): Promise<User[]>;
  upsertUser(user: UpsertUser): Promise<User>;

  // Employees
  getEmployee(id: string): Promise<Employee | undefined>;
  getEmployeeByEmail(email: string): Promise<Employee | undefined>;
  createEmployee(employee: InsertEmployee): Promise<Employee>;
  updateEmployee(id: string, employee: Partial<InsertEmployee>): Promise<Employee>;
  deleteEmployee(id: string): Promise<void>;
  getAllEmployees(): Promise<Employee[]>;

  // Equipment
  getEquipment(id: string): Promise<Equipment | undefined>;
  createEquipment(equipment: InsertEquipment): Promise<Equipment>;
  updateEquipment(id: string, equipment: Partial<InsertEquipment>): Promise<Equipment>;
  deleteEquipment(id: string): Promise<void>;
  getAllEquipment(): Promise<Equipment[]>;
  getEquipmentByEmployee(employeeId: string): Promise<Equipment[]>;
  
  // Equipment History
  addEquipmentHistory(history: Omit<EquipmentHistory, 'id' | 'createdAt'>): Promise<EquipmentHistory>;
  getEquipmentHistory(equipmentId: string): Promise<EquipmentHistory[]>;

  // Tickets
  getTicket(id: string): Promise<Ticket | undefined>;
  createTicket(ticket: InsertTicket): Promise<Ticket>;
  updateTicket(id: string, ticket: Partial<InsertTicket>): Promise<Ticket>;
  deleteTicket(id: string): Promise<void>;
  getAllTickets(): Promise<Ticket[]>;
  getTicketsByUser(userId: string): Promise<Ticket[]>;
  getTicketsByAssignee(assigneeId: string): Promise<Ticket[]>;

  // Inventory
  getInventoryItem(id: string): Promise<Inventory | undefined>;
  createInventoryItem(item: InsertInventory): Promise<Inventory>;
  updateInventoryItem(id: string, item: Partial<InsertInventory>): Promise<Inventory>;
  deleteInventoryItem(id: string): Promise<void>;
  getAllInventory(): Promise<Inventory[]>;

  // Licenses
  getLicense(id: string): Promise<License | undefined>;
  createLicense(license: InsertLicense): Promise<License>;
  updateLicense(id: string, license: Partial<InsertLicense>): Promise<License>;
  deleteLicense(id: string): Promise<void>;
  getAllLicenses(): Promise<License[]>;
  getExpiringLicenses(days: number): Promise<License[]>;

  // Activities
  getRecentActivities(limit: number): Promise<Activity[]>;
  createActivity(activity: InsertActivity): Promise<Activity>;

  // Dashboard Statistics
  getDashboardStats(): Promise<{
    totalEquipment: number;
    openTickets: number;
    activeUsers: number;
    expiringLicenses: number;
    equipmentByStatus: { status: string; count: number }[];
    ticketsByDay: { date: string; created: number; resolved: number }[];
    recentActivities: Activity[];
    alerts: Alert[];
    upcomingMaintenances: MaintenanceSchedule[];
  }>;

  // Alerts
  getAlert(id: string): Promise<Alert | undefined>;
  createAlert(alert: InsertAlert): Promise<Alert>;
  updateAlert(id: string, alert: Partial<InsertAlert>): Promise<Alert>;
  deleteAlert(id: string): Promise<void>;
  getAllAlerts(): Promise<Alert[]>;
  getAlertsByType(type: "licence" | "securite" | "maintenance" | "systeme"): Promise<Alert[]>;
  getAlertsByStatus(status: "nouvelle" | "en_cours" | "resolue"): Promise<Alert[]>;
  getAlertsByPriority(priority: "haute" | "moyenne" | "basse"): Promise<Alert[]>;

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

export class DatabaseStorage implements IStorage {
  // Users
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async authenticateUser(email: string, password: string): Promise<User | null> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    if (!user) return null;
    
    const bcrypt = await import('bcrypt');
    const isValid = await bcrypt.compare(password, user.password);
    return isValid ? user : null;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(user: InsertUser): Promise<User> {
    const [newUser] = await db.insert(users).values(user).returning();
    return newUser;
  }

  async updateUser(id: string, user: Partial<InsertUser>): Promise<User> {
    const [updatedUser] = await db
      .update(users)
      .set({ ...user, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return updatedUser;
  }

  async deleteUser(id: string): Promise<void> {
    await db.delete(users).where(eq(users.id, id));
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(desc(users.createdAt));
  }

  async upsertUser(user: UpsertUser): Promise<User> {
    const existingUser = await this.getUser(user.id as string);
    
    if (existingUser) {
      // Mise à jour de l'utilisateur existant
      const [updatedUser] = await db
        .update(users)
        .set({
          email: user.email,
          firstName: user.firstName || null,
          lastName: user.lastName || null,
          updatedAt: new Date()
        })
        .where(eq(users.id, user.id as string))
        .returning();
      return updatedUser;
    } else {
      // Création d'un nouvel utilisateur
      const [newUser] = await db
        .insert(users)
        .values({
          id: user.id,
          email: user.email,
          firstName: user.firstName || null,
          lastName: user.lastName || null,
          role: "utilisateur", // Rôle par défaut
          password: "", // Pas de mot de passe pour l'auth externe
          isActive: true
        })
        .returning();
      return newUser;
    }
  }

  // Employees
  async getEmployee(id: string): Promise<Employee | undefined> {
    const [employee] = await db.select().from(employees).where(eq(employees.id, id));
    return employee || undefined;
  }

  async getEmployeeByEmail(email: string): Promise<Employee | undefined> {
    const [employee] = await db.select().from(employees).where(eq(employees.email, email));
    return employee || undefined;
  }

  async createEmployee(employee: InsertEmployee): Promise<Employee> {
    const [newEmployee] = await db.insert(employees).values(employee).returning();
    return newEmployee;
  }

  async updateEmployee(id: string, employee: Partial<InsertEmployee>): Promise<Employee> {
    const [updatedEmployee] = await db
      .update(employees)
      .set({ ...employee, updatedAt: new Date() })
      .where(eq(employees.id, id))
      .returning();
    return updatedEmployee;
  }

  async deleteEmployee(id: string): Promise<void> {
    await db.delete(employees).where(eq(employees.id, id));
  }

  async getAllEmployees(): Promise<Employee[]> {
    return await db.select().from(employees).orderBy(desc(employees.createdAt));
  }

  // Equipment
  async getEquipment(id: string): Promise<Equipment | undefined> {
    const [equipmentItem] = await db.select().from(equipment).where(eq(equipment.id, id));
    return equipmentItem || undefined;
  }

  async createEquipment(equipmentData: InsertEquipment): Promise<Equipment> {
    const [newEquipment] = await db.insert(equipment).values(equipmentData).returning();
    
    // Créer une activité pour l'ajout d'équipement
    await this.createActivity({
      type: "equipment_added",
      title: `${equipmentData.model} ajouté`,
      description: `Nouvel équipement de type ${equipmentData.type}`,
      status: "Nouveau",
      entityId: newEquipment.id,
      entityType: "equipment"
    });

    return newEquipment;
  }

  async updateEquipment(id: string, equipmentData: Partial<InsertEquipment>): Promise<Equipment> {
    const [updatedEquipment] = await db
      .update(equipment)
      .set({ ...equipmentData, updatedAt: new Date() })
      .where(eq(equipment.id, id))
      .returning();

    // Créer une activité pour la mise à jour d'équipement
    await this.createActivity({
      type: "equipment_updated",
      title: `${updatedEquipment.model} mis à jour`,
      description: "Spécifications modifiées",
      status: "Modifié",
      entityId: updatedEquipment.id,
      entityType: "equipment"
    });

    return updatedEquipment;
  }

  async deleteEquipment(id: string): Promise<void> {
    await db.delete(equipment).where(eq(equipment.id, id));
  }

  async getAllEquipment(): Promise<Equipment[]> {
    return await db.select().from(equipment).orderBy(desc(equipment.createdAt));
  }

  async getEquipmentByEmployee(employeeId: string): Promise<Equipment[]> {
    return await db.select().from(equipment).where(eq(equipment.assignedTo, employeeId));
  }

  // Equipment History
  async addEquipmentHistory(history: Omit<EquipmentHistory, 'id' | 'createdAt'>): Promise<EquipmentHistory> {
    const [newHistory] = await db.insert(equipmentHistory).values(history).returning();
    return newHistory;
  }

  async getEquipmentHistory(equipmentId: string): Promise<EquipmentHistory[]> {
    return await db
      .select()
      .from(equipmentHistory)
      .where(eq(equipmentHistory.equipmentId, equipmentId))
      .orderBy(desc(equipmentHistory.createdAt));
  }

  // Tickets
  async getTicket(id: string): Promise<Ticket | undefined> {
    const [ticket] = await db.select().from(tickets).where(eq(tickets.id, id));
    return ticket || undefined;
  }

  async createTicket(ticket: InsertTicket): Promise<Ticket> {
    const [newTicket] = await db.insert(tickets).values(ticket).returning();
    return newTicket;
  }

  async updateTicket(id: string, ticket: Partial<InsertTicket>): Promise<Ticket> {
    const [updatedTicket] = await db
      .update(tickets)
      .set({ ...ticket, updatedAt: new Date() })
      .where(eq(tickets.id, id))
      .returning();
    return updatedTicket;
  }

  async deleteTicket(id: string): Promise<void> {
    await db.delete(tickets).where(eq(tickets.id, id));
  }

  async getAllTickets(): Promise<Ticket[]> {
    return await db.select().from(tickets).orderBy(desc(tickets.createdAt));
  }

  async getTicketsByUser(userId: string): Promise<Ticket[]> {
    return await db.select().from(tickets).where(eq(tickets.createdBy, userId));
  }

  async getTicketsByAssignee(assigneeId: string): Promise<Ticket[]> {
    return await db.select().from(tickets).where(eq(tickets.assignedTo, assigneeId));
  }

  // Inventory
  async getInventoryItem(id: string): Promise<Inventory | undefined> {
    const [item] = await db.select().from(inventory).where(eq(inventory.id, id));
    return item || undefined;
  }

  async createInventoryItem(item: InsertInventory): Promise<Inventory> {
    const [newItem] = await db.insert(inventory).values(item).returning();
    return newItem;
  }

  async updateInventoryItem(id: string, item: Partial<InsertInventory>): Promise<Inventory> {
    const [updatedItem] = await db
      .update(inventory)
      .set({ ...item, updatedAt: new Date() })
      .where(eq(inventory.id, id))
      .returning();
    return updatedItem;
  }

  async deleteInventoryItem(id: string): Promise<void> {
    await db.delete(inventory).where(eq(inventory.id, id));
  }

  async getAllInventory(): Promise<Inventory[]> {
    return await db.select().from(inventory).orderBy(desc(inventory.createdAt));
  }

  // Licenses
  async getLicense(id: string): Promise<License | undefined> {
    const [license] = await db.select().from(licenses).where(eq(licenses.id, id));
    return license || undefined;
  }

  async createLicense(license: InsertLicense): Promise<License> {
    const [newLicense] = await db.insert(licenses).values(license).returning();
    return newLicense;
  }

  async updateLicense(id: string, license: Partial<InsertLicense>): Promise<License> {
    const [updatedLicense] = await db
      .update(licenses)
      .set({ ...license, updatedAt: new Date() })
      .where(eq(licenses.id, id))
      .returning();
    return updatedLicense;
  }

  async deleteLicense(id: string): Promise<void> {
    await db.delete(licenses).where(eq(licenses.id, id));
  }

  async getAllLicenses(): Promise<License[]> {
    return await db.select().from(licenses).orderBy(desc(licenses.createdAt));
  }

  async getExpiringLicenses(days: number): Promise<License[]> {
    // Retourner un tableau vide puisque nous n'avons plus de dates d'expiration
    return [];
  }

  // Activities
  async getRecentActivities(limit: number = 10): Promise<Activity[]> {
    return await db
      .select()
      .from(activities)
      .orderBy(desc(activities.createdAt))
      .limit(limit);
  }

  async createActivity(activity: InsertActivity): Promise<Activity> {
    const [newActivity] = await db.insert(activities).values(activity).returning();
    return newActivity;
  }

  // Dashboard Statistics
  async getDashboardStats(): Promise<{
    totalEquipment: number;
    openTickets: number;
    activeUsers: number;
    expiringLicenses: number;
    equipmentByStatus: { status: string; count: number }[];
    ticketsByDay: { date: string; created: number; resolved: number }[];
    recentActivities: Activity[];
    alerts: Alert[];
    upcomingMaintenances: MaintenanceSchedule[];
  }> {
    // Total equipment
    const [totalEquipmentResult] = await db.select({ count: count() }).from(equipment);
    const totalEquipment = totalEquipmentResult.count;

    // Open tickets
    const [openTicketsResult] = await db
      .select({ count: count() })
      .from(tickets)
      .where(or(eq(tickets.status, "ouvert"), eq(tickets.status, "assigné"), eq(tickets.status, "en cours")));
    const openTickets = openTicketsResult.count;

    // Active users
    const [activeUsersResult] = await db.select({ count: count() }).from(users);
    const activeUsers = activeUsersResult.count;

    // Expiring licenses (toujours 0 puisque nous n'avons plus de dates d'expiration)
    const expiringLicenses = 0;

    // Equipment by status
    const equipmentByStatus = await db
      .select({
        status: equipment.status,
        count: count(),
      })
      .from(equipment)
      .groupBy(equipment.status);

    // Tickets by day (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const createdTickets = await db
      .select({
        date: sql<string>`DATE(${tickets.createdAt})`,
        count: count(),
      })
      .from(tickets)
      .where(sql`${tickets.createdAt} >= ${sevenDaysAgo}`)
      .groupBy(sql`DATE(${tickets.createdAt})`);

    const resolvedTickets = await db
      .select({
        date: sql<string>`DATE(${tickets.updatedAt})`,
        count: count(),
      })
      .from(tickets)
      .where(
        and(
          eq(tickets.status, "résolu"),
          sql`${tickets.updatedAt} >= ${sevenDaysAgo}`
        )
      )
      .groupBy(sql`DATE(${tickets.updatedAt})`);

    // Combine ticket data by day
    const ticketsByDay = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const created = createdTickets.find(t => t.date === dateStr)?.count || 0;
      const resolved = resolvedTickets.find(t => t.date === dateStr)?.count || 0;
      
      ticketsByDay.push({
        date: dateStr,
        created: Number(created),
        resolved: Number(resolved),
      });
    }

    // Récupérer les alertes actives
    const activeAlerts = await db
      .select()
      .from(alerts)
      .where(not(eq(alerts.status, "resolue")))
      .orderBy(desc(alerts.createdAt))
      .limit(5);

    // Récupérer les maintenances à venir (7 prochains jours)
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 7);

    const upcomingMaintenances = await db
      .select()
      .from(maintenanceSchedules)
      .where(
        and(
          gte(maintenanceSchedules.startDate, new Date().toISOString()),
          lte(maintenanceSchedules.startDate, futureDate.toISOString()),
          not(eq(maintenanceSchedules.status, "annule"))
        )
      )
      .orderBy(asc(maintenanceSchedules.startDate))
      .limit(3);

    // Récupérer les activités récentes
    const recentActivities = await this.getRecentActivities(5);

    return {
      totalEquipment,
      openTickets,
      activeUsers,
      expiringLicenses,
      equipmentByStatus: equipmentByStatus.map(item => ({
        status: item.status,
        count: Number(item.count),
      })),
      ticketsByDay,
      recentActivities,
      alerts: activeAlerts,
      upcomingMaintenances,
    };
  }

  // Alerts
  async getAlert(id: string): Promise<Alert | undefined> {
    const [alert] = await db.select().from(alerts).where(eq(alerts.id, id));
    return alert;
  }

  async createAlert(alert: InsertAlert): Promise<Alert> {
    const [newAlert] = await db.insert(alerts).values(alert).returning();
    return newAlert;
  }

  async updateAlert(id: string, alert: Partial<InsertAlert>): Promise<Alert> {
    const [updatedAlert] = await db
      .update(alerts)
      .set({ ...alert, updatedAt: new Date() })
      .where(eq(alerts.id, id))
      .returning();
    return updatedAlert;
  }

  async deleteAlert(id: string): Promise<void> {
    await db.delete(alerts).where(eq(alerts.id, id));
  }

  async getAllAlerts(): Promise<Alert[]> {
    return await db.select().from(alerts).orderBy(desc(alerts.createdAt));
  }

  async getAlertsByType(type: "licence" | "securite" | "maintenance" | "systeme"): Promise<Alert[]> {
    return await db
      .select()
      .from(alerts)
      .where(eq(alerts.type, type as any))
      .orderBy(desc(alerts.createdAt));
  }

  async getAlertsByStatus(status: "nouvelle" | "en_cours" | "resolue"): Promise<Alert[]> {
    return await db
      .select()
      .from(alerts)
      .where(eq(alerts.status, status as any))
      .orderBy(desc(alerts.createdAt));
  }

  async getAlertsByPriority(priority: "haute" | "moyenne" | "basse"): Promise<Alert[]> {
    return await db
      .select()
      .from(alerts)
      .where(eq(alerts.priority, priority as any))
      .orderBy(desc(alerts.createdAt));
  }

  // Maintenance Schedules
  async getMaintenanceSchedule(id: string): Promise<MaintenanceSchedule | undefined> {
    const [schedule] = await db.select().from(maintenanceSchedules).where(eq(maintenanceSchedules.id, id));
    return schedule;
  }

  async createMaintenanceSchedule(schedule: InsertMaintenanceSchedule): Promise<MaintenanceSchedule> {
    const [newSchedule] = await db.insert(maintenanceSchedules).values(schedule).returning();
    return newSchedule;
  }

  async updateMaintenanceSchedule(id: string, schedule: Partial<InsertMaintenanceSchedule>): Promise<MaintenanceSchedule> {
    const [updatedSchedule] = await db
      .update(maintenanceSchedules)
      .set({ ...schedule, updatedAt: new Date() })
      .where(eq(maintenanceSchedules.id, id))
      .returning();
    return updatedSchedule;
  }

  async deleteMaintenanceSchedule(id: string): Promise<void> {
    // Supprimer d'abord les relations
    await db.delete(maintenanceTechnicians).where(eq(maintenanceTechnicians.maintenanceId, id));
    await db.delete(maintenanceEquipment).where(eq(maintenanceEquipment.maintenanceId, id));
    // Puis supprimer la maintenance
    await db.delete(maintenanceSchedules).where(eq(maintenanceSchedules.id, id));
  }

  async getAllMaintenanceSchedules(): Promise<MaintenanceSchedule[]> {
    return await db.select().from(maintenanceSchedules).orderBy(desc(maintenanceSchedules.startDate));
  }

  async getUpcomingMaintenances(days: number): Promise<MaintenanceSchedule[]> {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);

    return await db
      .select()
      .from(maintenanceSchedules)
      .where(
        and(
          gte(maintenanceSchedules.startDate, new Date().toISOString()),
          lte(maintenanceSchedules.startDate, futureDate.toISOString()),
          not(eq(maintenanceSchedules.status, "annule"))
        )
      )
      .orderBy(asc(maintenanceSchedules.startDate));
  }

  async assignTechnicianToMaintenance(maintenanceId: string, technicianId: string): Promise<void> {
    await db.insert(maintenanceTechnicians).values({
      maintenanceId,
      technicianId,
    });
  }

  async removeTechnicianFromMaintenance(maintenanceId: string, technicianId: string): Promise<void> {
    await db
      .delete(maintenanceTechnicians)
      .where(
        and(
          eq(maintenanceTechnicians.maintenanceId, maintenanceId),
          eq(maintenanceTechnicians.technicianId, technicianId)
        )
      );
  }

  async addEquipmentToMaintenance(maintenanceId: string, equipmentId: string): Promise<void> {
    await db.insert(maintenanceEquipment).values({
      maintenanceId,
      equipmentId,
    });
  }

  async removeEquipmentFromMaintenance(maintenanceId: string, equipmentId: string): Promise<void> {
    await db
      .delete(maintenanceEquipment)
      .where(
        and(
          eq(maintenanceEquipment.maintenanceId, maintenanceId),
          eq(maintenanceEquipment.equipmentId, equipmentId)
        )
      );
  }
}

export const storage = new DatabaseStorage();
