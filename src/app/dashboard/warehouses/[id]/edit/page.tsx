import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import jwt from "jsonwebtoken"
import { cookies } from "next/headers"
import { notFound, redirect } from "next/navigation"
import sql from "@/lib/neon/db"
import type { Warehouse } from "@/types"
import { PageContainer } from "@/components/layout/PageContainer"
import { PageHeader } from "@/components/layout/PageHeader"
import { Button } from "@/components/ui/button"
import WarehouseForm from "@/components/warehouses/WarehouseForm"

type PageProps = {
  params: Promise<{ id: string }>
}

type TokenPayload = {
  userId?: string
}

export default async function EditWarehousePage({ params }: PageProps) {
  const { id } = await params
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
    "SELECT * FROM warehouses WHERE id = $1 AND user_id = $2 AND is_active = true LIMIT 1",
    [id, userId]
  )

  const warehouse = rows[0] as Warehouse | undefined

  if (!warehouse) {
    notFound()
  }

  return (
    <PageContainer>
      <PageHeader
        title="Edit Gudang"
        description={`Memperbarui data untuk ${warehouse.name}`}
        action={
          <Button variant="ghost" asChild>
            <Link href="/dashboard/warehouses">
              <ArrowLeft className="mr-2 h-4 w-4" /> Kembali
            </Link>
          </Button>
        }
      />
      <div className="mx-auto mt-6 w-full max-w-lg">
        <WarehouseForm warehouse={warehouse} />
      </div>
    </PageContainer>
  )
}
