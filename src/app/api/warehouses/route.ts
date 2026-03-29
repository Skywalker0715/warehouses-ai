import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import sql from "@/lib/neon/db";

type TokenPayload = {
  userId?: string;
};

type WarehouseInput = {
  name?: string;
  location?: string;
  max_capacity?: number | string;
  type?: string;
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

export async function GET() {
  const userId = await getUserIdFromToken();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rows = await sql.query(
    `SELECT 
        w.*,
        COALESCE(SUM(s.quantity), 0) AS total_stock
      FROM warehouses w
      LEFT JOIN stock s ON s.warehouse_id = w.id
      WHERE w.user_id = $1 AND w.is_active = true
      GROUP BY w.id
      ORDER BY w.created_at ASC`,
    [userId]
  );

  const data = rows.map((warehouse) => {
    const capacity = Number(warehouse.max_capacity ?? 0);
    const totalStock = Number(warehouse.total_stock ?? 0);
    const utilization =
      capacity > 0 ? Math.min((totalStock / capacity) * 100, 100) : 0;

    return {
      ...warehouse,
      total_stock: totalStock,
      utilization_percent: Number.isFinite(utilization)
        ? Number(utilization.toFixed(2))
        : 0,
    };
  });

  return NextResponse.json({ success: true, data }, { status: 200 });
}

export async function POST(req: Request) {
  const userId = await getUserIdFromToken();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: WarehouseInput;
  try {
    body = (await req.json()) as WarehouseInput;
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON payload" },
      { status: 400 }
    );
  }

  const name = body.name?.trim();
  const location = body.location?.trim() || null;
  const type = body.type?.trim() || null;
  const capacity =
    body.max_capacity === "" ||
    body.max_capacity === undefined ||
    body.max_capacity === null
      ? null
      : Number(body.max_capacity);

  if (!name) {
    return NextResponse.json(
      { error: "Name is required" },
      { status: 400 }
    );
  }

  if (!capacity || !Number.isInteger(capacity) || capacity <= 0) {
    return NextResponse.json(
      { error: "Capacity must be a positive integer" },
      { status: 400 }
    );
  }

  const rows = await sql.query(
    "INSERT INTO warehouses (user_id, name, location, max_capacity, type, is_active) VALUES ($1, $2, $3, $4, $5, true) RETURNING *",
    [userId, name, location, capacity, type]
  );

  // Setelah gudang dibuat, siapkan stok 0 untuk semua produk aktif user ini.
  try {
    const newWarehouse = rows[0];
    if (newWarehouse?.id) {
      const products = await sql.query(
        "SELECT id FROM products WHERE user_id = $1 AND is_active = true",
        [userId]
      );

      for (const product of products) {
        await sql.query(
          "INSERT INTO stock (product_id, warehouse_id, quantity) VALUES ($1, $2, 0) ON CONFLICT (product_id, warehouse_id) DO NOTHING",
          [product.id, newWarehouse.id]
        );
      }
    }
  } catch {
    // jangan gagalkan pembuatan gudang kalau stok init gagal
  }

  return NextResponse.json({ success: true, data: rows[0] }, { status: 201 });
}
