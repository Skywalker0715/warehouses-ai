import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import type { JwtPayload } from "jsonwebtoken";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { getStockSummary, getStockTrends } from "@/lib/ai/data-fetcher";
import { buildStockContext, buildTrendContext } from "@/lib/ai/context-builder";
import {
  sanitizeForAI,
  truncateContext,
  validateContextSize,
} from "@/lib/ai/sanitize";
import { buildRestockPrompt } from "@/lib/ai/prompts";
import { AI_MODELS, isAIConfigured } from "@/lib/ai";

type AuthPayload = JwtPayload & { id?: string; userId?: string };

// Cache sederhana untuk menyimpan hasil AI per user (berlaku selama server running)
const aiCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 15 * 60 * 1000; // Simpan selama 15 menit

export async function GET(req: NextRequest) {
  try {
    if (!isAIConfigured()) {
      return NextResponse.json(
        { error: "AI tidak dikonfigurasi", configured: false },
        { status: 503 }
      );
    }

    const cookieStore = await cookies();
    const cookieToken = cookieStore.get("token")?.value;
    const authHeader = req.headers.get("authorization");
    const headerToken = authHeader?.startsWith("Bearer ")
      ? authHeader.split(" ")[1]
      : null;
    const token = cookieToken ?? headerToken;

    if (!token || !process.env.JWT_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let decoded: JwtPayload | string;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (typeof decoded === "string") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = decoded as AuthPayload;
    const userId = payload.id ?? payload.userId;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 1. Cek apakah ada data di cache untuk user ini
    const cacheKey = `restock-${userId}`;
    const cached = aiCache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return NextResponse.json(cached.data);
    }

    const summary = await getStockSummary(userId);
    const trends = await getStockTrends(userId, 30);

    const stockCtx = buildStockContext(summary);
    const trendCtx = buildTrendContext(trends);
    const fullContext = `${stockCtx}\n\n${trendCtx}`;

    const cleanContext = sanitizeForAI(fullContext);
    const { isValid, estimatedTokens } = validateContextSize(cleanContext);
    const finalContext = isValid ? cleanContext : truncateContext(cleanContext);

    const prompt = buildRestockPrompt(finalContext);

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    const model = genAI.getGenerativeModel({ model: AI_MODELS.FAST });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const usage = response.usageMetadata;
    const text = response.text();

    const cleaned = text
      .replace(/```json/gi, "")
      .replace(/```/g, "")
      .trim();

    let parsed: unknown;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      return NextResponse.json(
        { error: "AI menghasilkan format yang tidak valid" },
        { status: 500 }
      );
    }

    const data = parsed as { recommendations?: unknown };
    if (!Array.isArray(data.recommendations)) {
      return NextResponse.json(
        { error: "AI menghasilkan format yang tidak valid" },
        { status: 500 }
      );
    }

    const responseData = {
      success: true,
      data,
      meta: {
        model: AI_MODELS.FAST,
        context_tokens: estimatedTokens,
        input_tokens: usage?.promptTokenCount ?? 0,
        output_tokens: usage?.candidatesTokenCount ?? 0,
      },
    };

    // 2. Simpan ke cache sebelum mengirim response
    aiCache.set(cacheKey, { data: responseData, timestamp: Date.now() });

    return NextResponse.json(responseData);
  } catch (error: unknown) {
    // Cek apakah error karena limit kuota (429)
    const isQuotaExceeded = error instanceof Error && error.message.includes("429");

    if (isQuotaExceeded) {
      console.warn("[ai] Kuota harian habis, mengirim data mock untuk development.");
      return NextResponse.json({
        success: true,
        is_mock: true,
        data: {
          recommendations: [
            {
              product_name: "Contoh Produk (Quota Limit)",
              sku: "MOCK-001",
              warehouse_name: "Gudang Utama",
              current_quantity: 0,
              unit: "pcs",
              priority: "critical",
              suggested_reorder_qty: 50,
              reason: "Kuota API habis. Ini adalah data contoh agar UI tidak kosong."
            }
          ],
          summary: "Anda telah mencapai batas kuota harian Gemini API. Menggunakan data simulasi."
        },
        meta: { model: "mock-mode", context_tokens: 0, input_tokens: 0, output_tokens: 0 }
      });
    }

    const message =
      error && typeof error === "object" && "message" in error
        ? String((error as { message?: unknown }).message)
        : "AI service tidak tersedia";

    console.error("[ai][insights][restock] error:", error);

    return NextResponse.json(
      {
        error: process.env.NODE_ENV === "production"
          ? "AI service tidak tersedia"
          : message,
      },
      { status: 500 }
    );
  }
}
