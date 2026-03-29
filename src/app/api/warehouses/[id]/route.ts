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

type WarehouseRow = {
  max_capacity?: number | string | null;
  total_stock?: number | string | null;
  [key: string]: unknown;
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

const withUtilization = (warehouse: WarehouseRow) => {
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
};

export async function GET(_req: Request, context: RouteContext) {
  const userId = await getUserIdFromToken();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;

  const rows = await sql.query(
    `SELECT 
        w.*,
        COALESCE(SUM(s.quantity), 0) AS total_stock
      FROM warehouses w
      LEFT JOIN stock s ON s.warehouse_id = w.id
      WHERE w.id = $1 AND w.user_id = $2 AND w.is_active = true
      GROUP BY w.id
      LIMIT 1`,
    [id, userId]
  );

  if (rows.length === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(
    { success: true, data: withUtilization(rows[0]) },
    { status: 200 }
  );
}

export async function PATCH(req: Request, context: RouteContext) {
  const userId = await getUserIdFromToken();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;

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

  if (capacity !== null && (!Number.isInteger(capacity) || capacity <= 0)) {
    return NextResponse.json(
      { error: "Capacity must be a positive integer" },
      { status: 400 }
    );
  }

  const rows = await sql.query(
    `UPDATE warehouses
      SET
        name = COALESCE($1, name),
        location = $2,
        max_capacity = COALESCE($3, max_capacity),
        type = $4,
        updated_at = now()
      WHERE id = $5 AND user_id = $6 AND is_active = true
      RETURNING *`,
    [name ?? null, location, capacity, type, id, userId]
  );

  if (rows.length === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true, data: rows[0] }, { status: 200 });
}

export async function DELETE(_req: Request, context: RouteContext) {
  const userId = await getUserIdFromToken();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;

  const [stockRow] = await sql.query(
    "SELECT COALESCE(SUM(quantity), 0) AS total_stock FROM stock WHERE warehouse_id = $1",
    [id]
  );

  const totalStock = Number(stockRow?.total_stock ?? 0);

  if (totalStock > 0) {
    return NextResponse.json(
      {
        error:
          "Gudang masih memiliki stok aktif. Kosongkan stok sebelum menghapus gudang.",
      },
      { status: 400 }
    );
  }

  const rows = await sql.query(
    "UPDATE warehouses SET is_active = false, updated_at = now() WHERE id = $1 AND user_id = $2 AND is_active = true RETURNING id",
    [id, userId]
  );

  if (rows.length === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true }, { status: 200 });
}
