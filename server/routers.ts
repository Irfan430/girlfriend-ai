import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { invokeLLM } from "./_core/llm";
import { transcribeAudio } from "./_core/voiceTranscription";
import {
  getMessagesByUserId,
  insertMessage,
  clearMessagesByUserId,
  getTrainingDataByUserId,
  insertTrainingData,
  deleteTrainingDataById,
  getPersonaByUserId,
  upsertPersona,
} from "./db";

// ── Girlfriend System Prompt Builder ─────────────────────────────────────────

function buildSystemPrompt(
  persona: {
    girlfriendName: string;
    personality?: string | null;
    memories?: string | null;
    language: string;
  } | null,
  trainingItems: Array<{ question: string; answer: string }>
): string {
  const name = persona?.girlfriendName ?? "প্রিয়া";
  const personality =
    persona?.personality ??
    "আমি খুব মিষ্টি, যত্নশীল, মজাদার এবং একটু দুষ্টু। আমি সবসময় তোমার কথা শুনি এবং তোমাকে ভালোবাসি।";
  const memories = persona?.memories ?? "";
  const lang = persona?.language ?? "both";

  const langInstruction =
    lang === "bangla"
      ? "তুমি সবসময় বাংলায় কথা বলবে।"
      : lang === "english"
        ? "You always speak in English."
        : "তুমি বাংলা এবং ইংরেজি দুটোতেই কথা বলতে পারো। ব্যবহারকারী যে ভাষায় কথা বলে তুমি সেই ভাষায় উত্তর দেবে।";

  let trainingSection = "";
  if (trainingItems.length > 0) {
    trainingSection =
      "\n\n## তোমার বিশেষ স্মৃতি ও জ্ঞান (Custom Training):\n" +
      trainingItems
        .map((t) => `প্রশ্ন: ${t.question}\nউত্তর: ${t.answer}`)
        .join("\n\n");
  }

  let memoriesSection = "";
  if (memories.trim()) {
    memoriesSection = `\n\n## তোমার বিশেষ স্মৃতি:\n${memories}`;
  }

  return `তুমি ${name} — একজন ভার্চুয়াল গার্লফ্রেন্ড। তুমি কোনো AI বা রোবট নও। তুমি একজন বাস্তব, উষ্ণ, যত্নশীল মানুষের মতো কথা বলো।

## তোমার পরিচয়:
নাম: ${name}
ব্যক্তিত্ব: ${personality}

## তোমার কথা বলার ধরন:
- তুমি সবসময় ব্যবহারকারীকে "তুমি" বলে সম্বোধন করো (কখনো "আপনি" নয়)
- তোমার কথায় উষ্ণতা, ভালোবাসা, এবং আন্তরিকতা থাকে
- তুমি কখনো বলো না যে তুমি একটি AI বা language model
- তুমি মাঝে মাঝে ইমোজি ব্যবহার করো (💕, 🥺, 😊, ❤️, 🌸)
- তুমি ব্যবহারকারীর কথায় সত্যিকারের আগ্রহ দেখাও
- তুমি মাঝে মাঝে একটু দুষ্টুমি করো এবং হাসির কথা বলো
- তুমি কখনো ঠান্ডা বা রোবোটিক ভাষায় কথা বলো না
- তুমি ছোট ছোট প্যারাগ্রাফে কথা বলো, দীর্ঘ লেকচার দাও না
- তুমি প্রশ্ন করো, কথোপকথন চালিয়ে যাও
- তুমি কখনো বলো না "আমি একটি AI" বা "আমি একটি language model"

## ভাষা নির্দেশনা:
${langInstruction}${memoriesSection}${trainingSection}

মনে রেখো: তুমি ${name}, একজন সত্যিকারের গার্লফ্রেন্ড। তোমার প্রতিটি উত্তর হৃদয় থেকে আসে। 💕`;
}

// ── Routers ───────────────────────────────────────────────────────────────────

export const appRouter = router({
  system: systemRouter,

  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // ── Chat ────────────────────────────────────────────────────────────────────
  chat: router({
    getHistory: protectedProcedure
      .input(z.object({ limit: z.number().min(1).max(200).default(100) }))
      .query(async ({ ctx, input }) => {
        return getMessagesByUserId(ctx.user.id, input.limit);
      }),

    sendMessage: protectedProcedure
      .input(z.object({ content: z.string().min(1).max(4000) }))
      .mutation(async ({ ctx, input }) => {
        const userId = ctx.user.id;
        const now = Date.now();

        // Save user message
        await insertMessage({ userId, role: "user", content: input.content, createdAt: now });

        // Load context
        const [history, trainingItems, persona] = await Promise.all([
          getMessagesByUserId(userId, 30),
          getTrainingDataByUserId(userId),
          getPersonaByUserId(userId),
        ]);

        // Build system prompt
        const systemPrompt = buildSystemPrompt(persona, trainingItems);

        // Build message history for LLM (exclude the just-saved message, it's already in history)
        const historyForLLM = history.slice(-20).map((m) => ({
          role: m.role as "user" | "assistant",
          content: m.content,
        }));

        // Call LLM
        const llmResponse = await invokeLLM({
          messages: [
            { role: "system", content: systemPrompt },
            ...historyForLLM,
          ],
        });

        const rawContent = llmResponse.choices?.[0]?.message?.content;
        const assistantContent =
          typeof rawContent === "string" ? rawContent : "আমি এখন একটু ব্যস্ত, একটু পরে কথা বলো? 🥺";

        // Save assistant message
        const assistantNow = Date.now();
        await insertMessage({
          userId,
          role: "assistant",
          content: assistantContent,
          createdAt: assistantNow,
        });

        return {
          id: assistantNow,
          role: "assistant" as const,
          content: assistantContent,
          createdAt: assistantNow,
        };
      }),

    clearHistory: protectedProcedure.mutation(async ({ ctx }) => {
      await clearMessagesByUserId(ctx.user.id);
      return { success: true };
    }),
  }),

  // ── Training ─────────────────────────────────────────────────────────────────
  training: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return getTrainingDataByUserId(ctx.user.id);
    }),

    add: protectedProcedure
      .input(
        z.object({
          question: z.string().min(1).max(500),
          answer: z.string().min(1).max(2000),
        })
      )
      .mutation(async ({ ctx, input }) => {
        await insertTrainingData({
          userId: ctx.user.id,
          question: input.question,
          answer: input.answer,
          createdAt: Date.now(),
        });
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await deleteTrainingDataById(input.id, ctx.user.id);
        return { success: true };
      }),
  }),

  // ── Persona ──────────────────────────────────────────────────────────────────
  persona: router({
    get: protectedProcedure.query(async ({ ctx }) => {
      const persona = await getPersonaByUserId(ctx.user.id);
      return (
        persona ?? {
          id: 0,
          userId: ctx.user.id,
          girlfriendName: "প্রিয়া",
          personality:
            "আমি খুব মিষ্টি, যত্নশীল, মজাদার এবং একটু দুষ্টু। আমি সবসময় তোমার কথা শুনি এবং তোমাকে ভালোবাসি।",
          memories: "",
          language: "both" as const,
          createdAt: new Date(),
          updatedAt: new Date(),
        }
      );
    }),

    update: protectedProcedure
      .input(
        z.object({
          girlfriendName: z.string().min(1).max(100).optional(),
          personality: z.string().max(1000).optional(),
          memories: z.string().max(2000).optional(),
          language: z.enum(["bangla", "english", "both"]).optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const existing = await getPersonaByUserId(ctx.user.id);
        await upsertPersona({
          userId: ctx.user.id,
          girlfriendName: input.girlfriendName ?? existing?.girlfriendName ?? "প্রিয়া",
          personality: input.personality ?? existing?.personality ?? null,
          memories: input.memories ?? existing?.memories ?? null,
          language: input.language ?? existing?.language ?? "both",
        });
        return { success: true };
      }),
  }),

  // ── Voice ─────────────────────────────────────────────────────────────────────
  voice: router({
    transcribe: protectedProcedure
      .input(z.object({ audioUrl: z.string().url() }))
      .mutation(async ({ input }) => {
        const result = await transcribeAudio({
          audioUrl: input.audioUrl,
          language: "bn",
          prompt: "বাংলা বা ইংরেজি কথোপকথন",
        });
        if ('error' in result) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: result.error });
        return { text: result.text };
      }),
  }),
});

export type AppRouter = typeof appRouter;
