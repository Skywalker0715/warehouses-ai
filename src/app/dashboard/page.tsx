import jwt from "jsonwebtoken";
import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  AlertTriangle,
  BarChart3,
  Package,
  Sparkles,
  Warehouse,
} from "lucide-react";
import { PageContainer } from "@/components/layout/PageContainer";
import { PageHeader } from "@/components/layout/PageHeader";
import { StatCard } from "@/components/dashboard/StatCard";
import RestockInsightCard from "@/components/dashboard/RestockInsightCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import sql from "@/lib/neon/db";
import { typography } from "@/lib/typography";

type TokenPayload = {
  userId?: string;
};

const toNumber = (value: unknown) => {
  if (value == null) return 0;
  return typeof value === "number" ? value : Number(value);
};

export default async function DashboardPage() {
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

  const [productRow] = await sql.query(
    "SELECT COUNT(*) AS count FROM products WHERE user_id = $1 AND is_active = true",
    [userId]
  );
  const [warehouseRow] = await sql.query(
    "SELECT COUNT(*) AS count FROM warehouses WHERE user_id = $1 AND is_active = true",
    [userId]
  );
  const [lowStockRow] = await sql.query(
    "SELECT COUNT(*) AS count FROM stock s JOIN products p ON p.id = s.product_id WHERE p.user_id = $1 AND p.is_active = true AND s.quantity <= COALESCE(p.min_quantity, 0)",
    [userId]
  );
  const [totalStockRow] = await sql.query(
    "SELECT COALESCE(SUM(s.quantity), 0) AS total FROM stock s JOIN products p ON p.id = s.product_id WHERE p.user_id = $1 AND p.is_active = true",
    [userId]
  );

  const totalProducts = toNumber(productRow?.count);
  const totalWarehouses = toNumber(warehouseRow?.count);
  const lowStock = toNumber(lowStockRow?.count);
  const totalStock = toNumber(totalStockRow?.total);

  return (
    <PageContainer>
      <PageHeader
        title="Dashboard"
        description="Selamat datang kembali. Ini ringkasan warehouse kamu hari ini."
      />

      <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard
          title="Total Produk"
          value={totalProducts}
          description="produk terdaftar"
          icon={<Package className="h-4 w-4" />}
        />
        <StatCard
          title="Total Gudang"
          value={totalWarehouses}
          description="gudang aktif"
          icon={<Warehouse className="h-4 w-4" />}
        />
        <StatCard
          title="Item Stok Rendah"
          value={lowStock}
          description="perlu perhatian"
          icon={<AlertTriangle className="h-4 w-4" />}
        />
        <StatCard
          title="Total Stok"
          value={totalStock}
          description="unit di semua gudang"
          icon={<BarChart3 className="h-4 w-4" />}
        />
      </div>

      <div className="mt-8">
        <RestockInsightCard />
      </div>
    </PageContainer>
  );
}
