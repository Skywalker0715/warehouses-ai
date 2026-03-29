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

type RouteContext = {
  params: Promise<{ id: string }>;
};

type ProductUpdateInput = {
  name?: string;
  sku?: string;
  category?: string;
  price?: number | string | null;
  min_quantity?: number | string | null;
  unit?: string;
  description?: string;
};

export async function PATCH(req: Request, context: RouteContext) {
  const userId = await getUserIdFromToken();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  if (!id) {
    return NextResponse.json({ error: "Invalid product id" }, { status: 400 });
  }

  let body: ProductUpdateInput;
  try {
    body = (await req.json()) as ProductUpdateInput;
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
    "SELECT id FROM products WHERE user_id = $1 AND sku = $2 AND id <> $3 LIMIT 1",
    [userId, sku, id]
  );

  if (existing.length > 0) {
    return NextResponse.json(
      { error: "SKU already exists" },
      { status: 409 }
    );
  }

  const rows = await sql.query(
    "UPDATE products SET name = $1, sku = $2, category = $3, price = $4, min_quantity = $5, unit = $6, description = $7, updated_at = now() WHERE id = $8 AND user_id = $9 AND is_active = true RETURNING *",
    [name, sku, category, price, minQuantity, unit, description, id, userId]
  );

  if (rows.length === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ data: rows[0] }, { status: 200 });
}

export async function DELETE(_req: Request, context: RouteContext) {
  const userId = await getUserIdFromToken();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  if (!id) {
    return NextResponse.json({ error: "Invalid product id" }, { status: 400 });
  }

  const existing = await sql.query(
    "SELECT id FROM products WHERE id = $1 AND user_id = $2 LIMIT 1",
    [id, userId]
  );

  if (existing.length === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await sql.query(
    "UPDATE products SET is_active = false, updated_at = now() WHERE id = $1 AND user_id = $2",
    [id, userId]
  );

  return NextResponse.json({ success: true }, { status: 200 });
}
