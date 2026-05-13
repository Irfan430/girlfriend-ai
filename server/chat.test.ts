import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock the db module
vi.mock("./db", () => ({
  getMessagesByUserId: vi.fn().mockResolvedValue([]),
  insertMessage: vi.fn().mockResolvedValue(undefined),
  clearMessagesByUserId: vi.fn().mockResolvedValue(undefined),
  getTrainingDataByUserId: vi.fn().mockResolvedValue([]),
  insertTrainingData: vi.fn().mockResolvedValue(undefined),
  deleteTrainingDataById: vi.fn().mockResolvedValue(undefined),
  getPersonaByUserId: vi.fn().mockResolvedValue(null),
  upsertPersona: vi.fn().mockResolvedValue(undefined),
}));

// Mock the LLM
vi.mock("./_core/llm", () => ({
  invokeLLM: vi.fn().mockResolvedValue({
    choices: [{ message: { content: "আমি ভালো আছি! তুমি কেমন আছো? 💕" } }],
  }),
}));

// Mock voice transcription
vi.mock("./_core/voiceTranscription", () => ({
  transcribeAudio: vi.fn().mockResolvedValue({ text: "হ্যালো প্রিয়া" }),
}));

function createAuthContext(): TrpcContext {
  return {
    user: {
      id: 1,
      openId: "test-user-123",
      email: "test@example.com",
      name: "Test User",
      loginMethod: "manus",
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

describe("chat router", () => {
  it("getHistory returns empty array for new user", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.chat.getHistory({ limit: 50 });
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(0);
  });

  it("sendMessage calls LLM and returns assistant response", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.chat.sendMessage({ content: "হ্যালো!" });
    expect(result.role).toBe("assistant");
    expect(typeof result.content).toBe("string");
    expect(result.content.length).toBeGreaterThan(0);
  });

  it("clearHistory returns success", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.chat.clearHistory();
    expect(result.success).toBe(true);
  });
});

describe("training router", () => {
  it("list returns empty array for new user", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.training.list();
    expect(Array.isArray(result)).toBe(true);
  });

  it("add training data returns success", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.training.add({
      question: "আমার প্রিয় রং কী?",
      answer: "তোমার প্রিয় রং নীল",
    });
    expect(result.success).toBe(true);
  });

  it("delete training data returns success", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.training.delete({ id: 1 });
    expect(result.success).toBe(true);
  });
});

describe("persona router", () => {
  it("get returns default persona when none exists", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.persona.get();
    expect(result.girlfriendName).toBe("প্রিয়া");
    expect(result.language).toBe("both");
  });

  it("update persona returns success", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.persona.update({
      girlfriendName: "মিষ্টি",
      language: "bangla",
    });
    expect(result.success).toBe(true);
  });
});
