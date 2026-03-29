import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { getStockSummary, getStockTrends, getWarehouseCapacityAlert } from "@/lib/ai/data-fetcher";
import { buildFullContext } from "@/lib/ai/context-builder";
import { sanitizeForAI, validateContextSize, truncateContext } from "@/lib/ai/sanitize";
import { AI_MODELS, isAIConfigured } from "@/lib/ai";

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

    // 3. Fetch Context (RAG Concept)
    // Kita ambil ringkasan saja, bukan ribuan baris row database
    const [summary, trends, alerts] = await Promise.all([
      getStockSummary(userId),
      getStockTrends(userId, 30),
      getWarehouseCapacityAlert(userId),
    ]);

    const rawContext = buildFullContext(summary, trends, alerts);
    const cleanContext = sanitizeForAI(rawContext);
    
    // Hemat token: pastikan context tidak melebihi limit
    const finalContext = truncateContext(cleanContext, 2000); 

    // 4. Setup Gemini
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    const model = genAI.getGenerativeModel({ 
      model: AI_MODELS.FAST,
      systemInstruction: `Anda adalah Warehouse Assistant cerdas. 
      Tugas Anda membantu pengguna mengelola stok, gudang (warehouse), dan produk.
      Gunakan data konteks gudang yang diberikan untuk menjawab pertanyaan.
      Jika data tidak ada di konteks, jawablah berdasarkan pengetahuan umum manajemen logistik namun beri tahu bahwa itu saran umum.
      Gunakan Bahasa Indonesia yang profesional dan ringkas.
      Jangan berikan informasi sensitif seperti password atau secret key.`
    });

    // 5. Build Chat History for Gemini
    const chatHistory = history.map((msg: any) => ({
      role: msg.role === "user" ? "user" : "model",
      parts: [{ text: msg.content }],
    }));

    const chat = model.startChat({
      history: chatHistory,
    });

    // Kirim pesan dengan konteks tambahan di awal (untuk efisiensi)
    const promptWithContext = `
KONTEKS GUDANG SAAT INI:
${finalContext}

PERTANYAAN USER:
${message}
    `;

    const result = await chat.sendMessage(promptWithContext);
    const response = await result.response;
    const text = response.text();

    return NextResponse.json({
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
    });

  } catch (error: any) {
    console.error("[ai][chat] Error:", error);
    const isQuota = error.message?.includes("429");
    return NextResponse.json({ 
      error: isQuota ? "Batas kuota AI tercapai. Coba lagi nanti." : "Gagal memproses pesan AI" 
    }, { status: 500 });
  }
}