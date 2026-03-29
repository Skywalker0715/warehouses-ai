import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import sql from "@/lib/neon/db";

type TokenPayload = {
  userId?: string;
};

type StockUpdateInput = {
  quantity_change: number;
  type: "in" | "out" | "adjustment";
  notes?: string;
};

type RouteContext = {
  params: Promise<{ id: string }>;
};

const getUserIdFromToken = async () => {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  if (!token || !process.env.JWT_SECRET) {
    return null;
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET) as TokenPayload;
    return payload.userId ?? null;
  } catch {
    return null;
  }
};

export async function PATCH(req: Request, context: RouteContext) {
  try {
    const userId = await getUserIdFromToken();

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await context.params;

    let body: StockUpdateInput;
    try {
      body = (await req.json()) as StockUpdateInput;
    } catch {
      return NextResponse.json(
        { success: false, error: "Invalid JSON payload" },
        { status: 400 }
      );
    }

    const quantityChange = Number(body.quantity_change);
    const type = body.type;
    const notes = body.notes?.trim() || null;

    if (!Number.isFinite(quantityChange)) {
      return NextResponse.json(
        { success: false, error: "Invalid quantity_change" },
        { status: 400 }
      );
    }

    if (type !== "in" && type !== "out" && type !== "adjustment") {
      return NextResponse.json(
        { success: false, error: "Invalid type" },
        { status: 400 }
      );
    }

    const rows = await sql.query(
      `SELECT 
          stock.*,
          products.user_id AS product_user_id
        FROM stock
        JOIN products ON stock.product_id = products.id
        WHERE stock.id = $1 AND products.user_id = $2
        LIMIT 1`,
      [id, userId]
    );

    if (rows.length === 0) {
      return NextResponse.json(
        { success: false, error: "Not found" },
        { status: 404 }
      );
    }

    const stock = rows[0];
    const currentQuantity = Number(stock.quantity ?? 0);
    const newQuantity = currentQuantity + quantityChange;

    if (newQuantity < 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Stok tidak cukup. Stok saat ini: ${currentQuantity} unit.`,
        },
        { status: 400 }
      );
    }

    const updatedRows = await sql.query(
      "UPDATE stock SET quantity = $1 WHERE id = $2 RETURNING *",
      [newQuantity, id]
    );

    const updatedStock = updatedRows[0];

    let historyEntry = null;
    try {
      const historyRows = await sql.query(
        `INSERT INTO stock_history (
            product_id,
            warehouse_id,
            quantity_change,
            quantity_after,
            transaction_type,
            notes
          ) VALUES ($1, $2, $3, $4, $5, $6)
          RETURNING *`,
        [
          stock.product_id,
          stock.warehouse_id,
          quantityChange,
          newQuantity,
          type,
          notes,
        ]
      );
      historyEntry = historyRows[0] ?? null;
    } catch {
      // jangan gagalkan update stok kalau history gagal
      historyEntry = null;
    }

    return NextResponse.json(
      { success: true, data: { stock: updatedStock, history_entry: historyEntry } },
      { status: 200 }
    );
  } catch {
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
