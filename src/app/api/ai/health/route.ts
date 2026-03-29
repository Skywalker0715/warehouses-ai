import { NextRequest, NextResponse } from 'next/server';
import { cookies } from "next/headers";
import jwt from 'jsonwebtoken';
import type { JwtPayload } from "jsonwebtoken";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { getStockSummary } from '@/lib/ai/data-fetcher';
import { buildStockContext } from '@/lib/ai/context-builder';
import { sanitizeForAI, truncateContext, validateContextSize } from '@/lib/ai/sanitize';
import { AI_MODELS } from '@/lib/ai';

/**
 * Diagnostic API Route untuk mengecek integrasi Google Gemini AI.
 * Endpoint ini mengambil data ringkasan stok, membangun konteks, 
 * mensanitasi data, dan meminta ringkasan singkat dari AI.
 */
export async function GET(req: NextRequest) {
  try {
    // 1. Check if GEMINI_API_KEY is set
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ 
        status: 'error', 
        message: 'API key tidak dikonfigurasi' 
      }, { status: 500 });
    }

    // 2. Get authenticated user from JWT
    const cookieStore = await cookies();
    const cookieToken = cookieStore.get("token")?.value;
    const authHeader = req.headers.get("authorization");
    const headerToken = authHeader?.startsWith("Bearer ")
      ? authHeader.split(" ")[1]
      : null;
    const token = cookieToken ?? headerToken;

    if (!token) {
      return NextResponse.json({ message: 'Unauthorized: Token tidak ditemukan' }, { status: 401 });
    }

    let decoded: JwtPayload | string;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET!);
    } catch {
      return NextResponse.json({ message: 'Unauthorized: Token tidak valid' }, { status: 401 });
    }

    if (typeof decoded === "string") {
      return NextResponse.json({ message: 'Unauthorized: Token tidak valid' }, { status: 401 });
    }

    type AuthPayload = JwtPayload & { id?: string; userId?: string };
    const payload = decoded as AuthPayload;
    const userId = payload.id ?? payload.userId;
    if (!userId) {
      return NextResponse.json({ message: 'Unauthorized: User ID tidak ditemukan dalam token' }, { status: 401 });
    }

    // 3. Fetch stock summary
    const summary = await getStockSummary(userId);

    // 4. Build context
    const context = buildStockContext(summary);

    // 5. Sanitize and validate
    const cleanContext = sanitizeForAI(context);
    const truncated = truncateContext(cleanContext);
    
    const { estimatedTokens } = validateContextSize(truncated);

    // 6. Call Gemini API
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: AI_MODELS.FAST
    });

    const prompt = `
You are a warehouse AI assistant.
Answer in Bahasa Indonesia.
Be concise and insightful.

${truncated}

Berikan satu kalimat ringkasan kondisi warehouse ini.
`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    // 7. Return response
    return NextResponse.json({
      status: 'ok',
      model: AI_MODELS.FAST,
      context_tokens: estimatedTokens,
      summary: text.trim(),
      data_preview: {
        total_products: summary.total_products,
        total_warehouses: summary.total_warehouses,
        total_units: summary.total_units
      }
    });

  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Internal Server Error";
    // 8. Error handling
    return NextResponse.json({
      status: 'error',
      message
    }, { status: 500 });
  }
}
