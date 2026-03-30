import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { getStockSummary, getStockTrends, getWarehouseCapacityAlert } from "@/lib/ai/data-fetcher";
import { buildFullContext } from "@/lib/ai/context-builder";
import { sanitizeForAI, truncateContext } from "@/lib/ai/sanitize";
import { AI_MODELS, isAIConfigured } from "@/lib/ai";

// Simple cache untuk menghemat kuota Gemini 2.5 Flash yang ketat (20 req/day)
const chatCache = new Map<string, { response: any; timestamp: number }>();
const CACHE_TTL = 10 * 60 * 1000; // Cache 10 menit

export async function POST(req: NextRequest) {
  try {
    if (!isAIConfigured()) {
      return NextResponse.json({ error: "AI tidak dikonfigurasi" }, { status: 503 });
    }

    // 1. Auth Check
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    if (!token || !process.env.JWT_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let userId: string;
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET) as any;
      userId = decoded.id ?? decoded.userId;
    } catch {
      return NextResponse.json({ error: "Token tidak valid" }, { status: 401 });
    }

    // 2. Parse Request
    const { message, history } = await req.json();

    // 2.1 Check Cache (Key based on userId and last message)
    const cacheKey = `${userId}-${message.trim().toLowerCase()}`;
    const cached = chatCache.get(cacheKey);
    
    if (cached && (Date.now() - cached.timestamp < CACHE_TTL)) {
      return NextResponse.json(cached.response);
    }

    // Ambil keyword pencarian (kata terakhir atau kata benda)
    // Sederhananya, kita kirim seluruh pesan user sebagai filter
    const searchHint = message.length < 50 ? message : undefined;

    // 3. Fetch Context (RAG Concept)
    const [summary, trends, alerts] = await Promise.all([
      getStockSummary(userId, searchHint),
      getStockTrends(userId, 30),
      getWarehouseCapacityAlert(userId),
    ]);

    const rawContext = buildFullContext(summary, trends, alerts);
    const cleanContext = sanitizeForAI(rawContext);
    
    // Batasi konteks maksimal 2500 token untuk menghemat biaya/limit
    const finalContext = truncateContext(cleanContext, 2500); // Increased slightly to accommodate more relevant stock items

    // 4. Setup Gemini
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    const model = genAI.getGenerativeModel({ 
      model: AI_MODELS.FAST,
      systemInstruction: `Anda adalah Warehouse Assistant cerdas. 
      Tugas Anda membantu pengguna mengelola stok, gudang (warehouse), dan produk.
      Gunakan data konteks gudang yang diberikan untuk menjawab pertanyaan.
      Jika data tidak ada di konteks, jawablah berdasarkan pengetahuan umum manajemen logistik namun beri tahu bahwa itu saran umum.
      
      ATURAN FORMATTING DAN AKURASI:
      1. JANGAN gunakan format Markdown seperti bintang-bintang (**) untuk menebalkan teks. Gunakan teks biasa saja.
      2. Gunakan huruf kapital untuk nama Gudang atau Produk agar jelas.
      3. Jika user menanyakan lokasi barang, telusuri DAFTAR DISTRIBUSI STOK dan sebutkan SEMUA gudang yang muncul untuk produk tersebut, lengkap dengan kuantitasnya.
      4. Jika stok suatu barang di bawah 20 unit, ingatkan pengguna bahwa stok tersebut kritis.
      5. Gunakan list dengan tanda strip (-) dan awali setiap item dengan baris baru.`
    });

    // 5. Build Chat History
    const chatHistory = (history || []).map((msg: any) => ({
      role: msg.role === "user" ? "user" : "model",
      parts: [{ text: msg.content }],
    }));

    const chat = model.startChat({
      history: chatHistory,
    });

    // Gabungkan konteks database ke dalam prompt
    const promptWithContext = `
KONTEKS GUDANG REAL-TIME:
${finalContext}

PERTANYAAN USER:
${message}
    `.trim();

    const result = await chat.sendMessage(promptWithContext);
    const response = await result.response;
    const text = response.text();

    const finalResponse = {
      success: true,
      data: {
        id: Date.now().toString(),
        role: "assistant",
        content: text,
        created_at: new Date().toISOString(),
      },
      meta: {
        context_tokens: Math.ceil(finalContext.length / 4),
        model: AI_MODELS.FAST
      }
    };

    // Save to cache
    chatCache.set(cacheKey, { response: finalResponse, timestamp: Date.now() });

    return NextResponse.json(finalResponse);

  } catch (error: any) {
    console.error("[ai][chat] Error:", error);
    
    // Handle Quota Exceeded (429) gracefully
    if (error.message?.includes("429") || error.status === 429) {
      return NextResponse.json({
        success: true,
        is_mock: true,
        data: {
          id: Date.now().toString(),
          role: "assistant",
          content: "Maaf bang, kuota harian AI saya lagi habis nih. 😅 \n\nSaran saya: Cek stok manual dulu di dashboard atau tunggu sampai kuota di-reset (biasanya jam 2 siang WIB).",
          created_at: new Date().toISOString(),
        },
        meta: {
          context_tokens: 0,
          model: "quota-exceeded-fallback"
        }
      });
    }

    const isQuota = error.message?.includes("429") || error.status === 429;
    return NextResponse.json({ 
      error: isQuota ? "Batas kuota AI harian tercapai." : "Gagal memproses pesan AI" 
    }, { status: 500 });
  }
}