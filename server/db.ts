import { eq, desc, and } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser,
  users,
  messages,
  trainingData,
  personaSettings,
  InsertMessage,
  InsertTrainingData,
  InsertPersonaSettings,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;

  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};
  const textFields = ["name", "email", "loginMethod"] as const;
  type TextField = (typeof textFields)[number];
  const assignNullable = (field: TextField) => {
    const value = user[field];
    if (value === undefined) return;
    const normalized = value ?? null;
    values[field] = normalized;
    updateSet[field] = normalized;
  };
  textFields.forEach(assignNullable);
  if (user.lastSignedIn !== undefined) {
    values.lastSignedIn = user.lastSignedIn;
    updateSet.lastSignedIn = user.lastSignedIn;
  }
  if (user.role !== undefined) {
    values.role = user.role;
    updateSet.role = user.role;
  } else if (user.openId === ENV.ownerOpenId) {
    values.role = "admin";
    updateSet.role = "admin";
  }
  if (!values.lastSignedIn) values.lastSignedIn = new Date();
  if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();

  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ── Messages ──────────────────────────────────────────────────────────────────

export async function getMessagesByUserId(userId: number, limit = 100) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(messages)
    .where(eq(messages.userId, userId))
    .orderBy(desc(messages.createdAt))
    .limit(limit)
    .then((rows) => rows.reverse());
}

export async function insertMessage(msg: InsertMessage) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(messages).values(msg);
}

export async function clearMessagesByUserId(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(messages).where(eq(messages.userId, userId));
}

// ── Training Data ─────────────────────────────────────────────────────────────

export async function getTrainingDataByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(trainingData)
    .where(eq(trainingData.userId, userId))
    .orderBy(desc(trainingData.createdAt));
}

export async function insertTrainingData(data: InsertTrainingData) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(trainingData).values(data);
  return result;
}

export async function deleteTrainingDataById(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db
    .delete(trainingData)
    .where(and(eq(trainingData.id, id), eq(trainingData.userId, userId)));
}

// ── Persona Settings ──────────────────────────────────────────────────────────

export async function getPersonaByUserId(userId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db
    .select()
    .from(personaSettings)
    .where(eq(personaSettings.userId, userId))
    .limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function upsertPersona(data: InsertPersonaSettings) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db
    .insert(personaSettings)
    .values(data)
    .onDuplicateKeyUpdate({
      set: {
        girlfriendName: data.girlfriendName,
        personality: data.personality,
        memories: data.memories,
        language: data.language,
      },
    });
}
