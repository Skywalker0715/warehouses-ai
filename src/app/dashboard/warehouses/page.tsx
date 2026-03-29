import jwt from "jsonwebtoken"
import Link from "next/link"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { Warehouse as WarehouseIcon } from "lucide-react"
import sql from "@/lib/neon/db"
import type { WarehouseWithUtilization } from "@/types"
import { formatNumber } from "@/lib/utils"
import { typography } from "@/lib/typography"
import { PageContainer } from "@/components/layout/PageContainer"
import { PageHeader } from "@/components/layout/PageHeader"
import { Button } from "@/components/ui/button"
import WarehouseGrid from "@/components/warehouses/WarehouseGrid"

type TokenPayload = {
  userId?: string
}

const toNumber = (value: unknown) => {
  if (value == null) return 0
  return typeof value === "number" ? value : Number(value)
}

export default async function WarehousesPage() {
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
  )

  const warehouses: WarehouseWithUtilization[] = rows.map((warehouse) => {
    const capacity = toNumber(warehouse.max_capacity ?? 0)
    const totalStock = toNumber(warehouse.total_stock ?? 0)
    const utilization =
      capacity > 0 ? Math.min((totalStock / capacity) * 100, 100) : 0

    return {
      ...warehouse,
      total_stock: totalStock,
      utilization_percent: Number.isFinite(utilization)
        ? Number(utilization.toFixed(2))
        : 0,
    } as WarehouseWithUtilization
  })

  const totalCapacity = warehouses.reduce(
    (sum, warehouse) => sum + toNumber(warehouse.max_capacity ?? 0),
    0
  )
  const averageUtilization = warehouses.length
    ? Math.round(
        warehouses.reduce(
          (sum, warehouse) => sum + warehouse.utilization_percent,
          0
        ) / warehouses.length
      )
    : 0

  return (
    <PageContainer>
      <PageHeader
        title="Gudang"
        description="Kelola gudang dan pantau kapasitas penyimpanan."
        action={
          <Button asChild>
            <Link href="/dashboard/warehouses/new">Tambah Gudang</Link>
          </Button>
        }
      />

      <div className="mt-6 flex flex-wrap gap-3">
        <div className="rounded-full border bg-white px-4 py-2 text-sm text-muted-foreground">
          Total Gudang{" "}
          <span className="font-semibold text-slate-900">
            {warehouses.length}
          </span>
        </div>
        <div className="rounded-full border bg-white px-4 py-2 text-sm text-muted-foreground">
          Total Kapasitas{" "}
          <span className="font-semibold text-slate-900">
            {formatNumber(totalCapacity)}
          </span>
        </div>
        <div className="rounded-full border bg-white px-4 py-2 text-sm text-muted-foreground">
          Rata-rata Utilisasi{" "}
          <span className="font-semibold text-slate-900">
            {averageUtilization}%
          </span>
        </div>
      </div>

      {warehouses.length === 0 ? (
        <div className="mt-10 rounded-2xl border bg-white px-6 py-16 text-center">
          <WarehouseIcon className="mx-auto h-10 w-10 text-muted-foreground" />
          <h3 className={`mt-3 ${typography.heading.h3}`}>Belum ada gudang</h3>
          <p className={`mt-1 ${typography.body.muted}`}>
            Tambahkan gudang pertama untuk mulai melacak stok.
          </p>
          <Button asChild className="mt-4">
            <Link href="/dashboard/warehouses/new">
              Tambah Gudang Pertama
            </Link>
          </Button>
        </div>
      ) : (
        <div className="mt-6">
          <WarehouseGrid initialWarehouses={warehouses} />
        </div>
      )}
    </PageContainer>
  )
}
