import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import jwt from "jsonwebtoken"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { PageContainer } from "@/components/layout/PageContainer"
import { PageHeader } from "@/components/layout/PageHeader"
import { Button } from "@/components/ui/button"
import WarehouseForm from "@/components/warehouses/WarehouseForm"

type TokenPayload = {
  userId?: string
}

export default async function NewWarehousePage() {
  const cookieStore = await cookies()
  const token = cookieStore.get("token")?.value

  if (!token || !process.env.JWT_SECRET) {
    redirect("/login")
  }

  try {
    jwt.verify(token, process.env.JWT_SECRET) as TokenPayload
  } catch {
    redirect("/login")
  }

  return (
    <PageContainer>
      <PageHeader
        title="Tambah Gudang"
        action={
          <Button variant="ghost" asChild>
            <Link href="/dashboard/warehouses">
              <ArrowLeft className="mr-2 h-4 w-4" /> Kembali
            </Link>
          </Button>
        }
      />
      <div className="mx-auto mt-6 w-full max-w-lg">
        <WarehouseForm />
      </div>
    </PageContainer>
  )
}
