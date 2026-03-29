import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import sql from "@/lib/neon/db";
import type { Product } from "@/types";
import ProductsTable from "@/components/products/ProductsTable";
import { PageContainer } from "@/components/layout/PageContainer";
import { PageHeader } from "@/components/layout/PageHeader";

type TokenPayload = {
  userId?: string;
};

export default async function ProductsPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  if (!token || !process.env.JWT_SECRET) {
    redirect("/login");
  }

  let payload: TokenPayload | null = null;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET) as TokenPayload;
  } catch {
    redirect("/login");
  }

  const userId = payload?.userId;
  if (!userId) {
    redirect("/login");
  }

  const rows = await sql.query(
    "SELECT * FROM products WHERE user_id = $1 AND is_active = true ORDER BY created_at DESC LIMIT 50",
    [userId]
  );

  const products = rows as Product[];

  return (
    <PageContainer>
      <PageHeader
        title="Produk"
        description="Kelola daftar produk untuk seluruh gudang kamu."
      />
      <ProductsTable initialProducts={products} />
    </PageContainer>
  );
}
