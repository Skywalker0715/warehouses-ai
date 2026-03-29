import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import sql from "@/lib/neon/db";

type TokenPayload = {
  userId?: string;
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

export async function GET(req: Request) {
  try {
    const userId = await getUserIdFromToken();

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const warehouseId = searchParams.get("warehouse_id")?.trim();
    const productId = searchParams.get("product_id")?.trim();

    const params: Array<string> = [userId];
    let query = `
      SELECT 
        stock.id,
        stock.quantity,
        stock.product_id,
        stock.warehouse_id,
        products.name AS product_name,
        products.sku,
        products.unit,
        products.category AS product_category,
        products.user_id AS product_user_id,
        warehouses.name AS warehouse_name,
        warehouses.location,
        warehouses.type AS warehouse_type
      FROM stock
      JOIN products ON stock.product_id = products.id
      JOIN warehouses ON stock.warehouse_id = warehouses.id
      WHERE products.user_id = $1
        AND products.is_active = true
        AND warehouses.is_active = true
    `;

    if (warehouseId) {
      params.push(warehouseId);
      query += ` AND stock.warehouse_id = $${params.length}`;
    }

    if (productId) {
      params.push(productId);
      query += ` AND stock.product_id = $${params.length}`;
    }

    query += " ORDER BY products.name ASC";

    const rows = await sql.query(query, params);

    return NextResponse.json({ success: true, data: rows }, { status: 200 });
  } catch {
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
