import jwt from "jsonwebtoken"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import sql from "@/lib/neon/db"
import type { StockWithDetails, Warehouse } from "@/types"
import { PageContainer } from "@/components/layout/PageContainer"
import { PageHeader } from "@/components/layout/PageHeader"
import StockTable from "@/components/stock/StockTable"

type TokenPayload = {
  userId?: string
}

const toNumber = (value: unknown) => {
  if (value == null) return 0
  return typeof value === "number" ? value : Number(value)
}

export default async function StockPage() {
  const cookieStore = await cookies()
  const token = cookieStore.get("token")?.value

  if (!token || !process.env.JWT_SECRET) {
    redirect("/login")
  }

  let payload: TokenPayload | null = null
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET) as TokenPayload
  } catch {
    redirect("/login")
  }

  const userId = payload?.userId
  if (!userId) {
    redirect("/login")
  }

  const stockRows = await sql.query(
    `SELECT 
        stock.*,
        products.name AS product_name,
        products.sku,
        products.unit,
        products.category AS product_category,
        products.user_id AS product_user_id,
        warehouses.name AS warehouse_name,
        warehouses.location,
        warehouses.user_id AS warehouse_user_id,
        warehouses.type AS warehouse_type
      FROM stock
      JOIN products ON stock.product_id = products.id
      JOIN warehouses ON stock.warehouse_id = warehouses.id
      WHERE products.user_id = $1
        AND products.is_active = true
        AND warehouses.is_active = true
      ORDER BY products.name ASC`,
    [userId]
  )

  const stocks: StockWithDetails[] = stockRows.map((row) => ({
    id: row.id,
    product_id: row.product_id,
    warehouse_id: row.warehouse_id,
    quantity: toNumber(row.quantity),
    updated_at: row.updated_at,
    product: {
      id: row.product_id,
      user_id: row.product_user_id,
      name: row.product_name,
      sku: row.sku,
      category: row.product_category ?? row.category ?? null,
      price: row.price ?? null,
      created_at: row.created_at,
      unit: row.unit,
    },
    warehouse: {
      id: row.warehouse_id,
      user_id: row.warehouse_user_id ?? row.product_user_id,
      name: row.warehouse_name,
      location: row.location ?? null,
      max_capacity: row.max_capacity ?? 0,
      type: row.warehouse_type ?? null,
      created_at: row.created_at,
    },
  }))

  const warehouseRows = await sql.query(
    "SELECT id, name, type FROM warehouses WHERE user_id = $1 AND is_active = true ORDER BY created_at ASC",
    [userId]
  )
  const warehouses = warehouseRows as Warehouse[]

  const totalSku = new Set(stocks.map((stock) => stock.product_id)).size
  const totalUnit = stocks.reduce((sum, stock) => sum + stock.quantity, 0)
  const stokKritis = stocks.filter((stock) => stock.quantity <= 10).length
  const stokHabis = stocks.filter((stock) => stock.quantity === 0).length

  return (
    <PageContainer>
      <PageHeader
        title="Manajemen Stok"
        description="Pantau dan update stok produk di setiap gudang."
      />

      <div className="mt-6 flex flex-wrap gap-3">
        <div className="rounded-full border bg-white px-4 py-2 text-sm text-muted-foreground">
          Total SKU{" "}
          <span className="font-semibold text-slate-900">{totalSku}</span>
        </div>
        <div className="rounded-full border bg-white px-4 py-2 text-sm text-muted-foreground">
          Total Unit{" "}
          <span className="font-semibold text-slate-900">{totalUnit}</span>
        </div>
        <div className="rounded-full border bg-white px-4 py-2 text-sm text-muted-foreground">
          Stok Kritis{" "}
          <span className="font-semibold text-slate-900">{stokKritis}</span>
        </div>
        <div className="rounded-full border bg-white px-4 py-2 text-sm text-muted-foreground">
          Stok Habis{" "}
          <span className="font-semibold text-slate-900">{stokHabis}</span>
        </div>
      </div>

      <div className="mt-6">
        <StockTable initialStocks={stocks} warehouses={warehouses} />
      </div>
    </PageContainer>
  )
}
