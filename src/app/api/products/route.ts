import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import sql from "@/lib/neon/db";

type TokenPayload = {
  userId?: string;
};

type ProductInput = {
  name?: string;
  sku?: string;
  category?: string;
  price?: number | string | null;
  min_quantity?: number | string | null;
  unit?: string;
  description?: string;
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
  const userId = await getUserIdFromToken();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search")?.trim();
  const category = searchParams.get("category")?.trim();

  const params: Array<string | boolean> = [userId];
  let query =
    "SELECT * FROM products WHERE user_id = $1 AND is_active = true";

  if (search) {
    params.push(`%${search}%`);
    const idx = params.length;
    query += ` AND (name ILIKE $${idx} OR sku ILIKE $${idx})`;
  }

  if (category) {
    params.push(category);
    const idx = params.length;
    query += ` AND category = $${idx}`;
  }

  query += " ORDER BY created_at DESC";

  const rows = await sql.query(query, params);

  return NextResponse.json({ data: rows }, { status: 200 });
}

export async function POST(req: Request) {
  const userId = await getUserIdFromToken();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: ProductInput;
  try {
    body = (await req.json()) as ProductInput;
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON payload" },
      { status: 400 }
    );
  }

  const name = body.name?.trim();
  const sku = body.sku?.trim();
  const category = body.category?.trim() || null;
  const unit = body.unit?.trim() || "pcs";
  const description = body.description?.trim() || null;
  const price =
    body.price === "" || body.price === null || body.price === undefined
      ? null
      : Number(body.price);
  const minQuantity =
    body.min_quantity === "" ||
    body.min_quantity === null ||
    body.min_quantity === undefined
      ? 0
      : Number(body.min_quantity);

  if (!name || !sku) {
    return NextResponse.json(
      { error: "Name and SKU are required" },
      { status: 400 }
    );
  }

  if (price !== null && Number.isNaN(price)) {
    return NextResponse.json(
      { error: "Invalid price value" },
      { status: 400 }
    );
  }

  if (!Number.isFinite(minQuantity) || minQuantity < 0) {
    return NextResponse.json(
      { error: "Invalid min_quantity value" },
      { status: 400 }
    );
  }

  const existing = await sql.query(
    "SELECT id FROM products WHERE user_id = $1 AND sku = $2 LIMIT 1",
    [userId, sku]
  );

  if (existing.length > 0) {
    return NextResponse.json(
      { error: "SKU already exists" },
      { status: 409 }
    );
  }

  try {
    const rows = await sql.query(
      "INSERT INTO products (user_id, name, sku, category, price, min_quantity, unit, description, is_active) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true) RETURNING *",
      [userId, name, sku, category, price, minQuantity, unit, description]
    );

    const newProduct = rows[0];

    try {
      const warehouseRows = await sql.query(
        "SELECT id FROM warehouses WHERE user_id = $1 AND is_active = true",
        [userId]
      );

      for (const warehouse of warehouseRows) {
        await sql.query(
          "INSERT INTO stock (product_id, warehouse_id, quantity) VALUES ($1, $2, 0) ON CONFLICT (product_id, warehouse_id) DO NOTHING",
          [newProduct.id, warehouse.id]
        );
      }
    } catch {
      // Do not block product creation if stock initialization fails
    }

    return NextResponse.json({ data: newProduct }, { status: 201 });
  } catch (error) {
    const err = error as { code?: string };
    if (err?.code === "23505") {
      return NextResponse.json(
        { error: "SKU already exists" },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
