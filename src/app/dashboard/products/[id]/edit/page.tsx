import jwt from "jsonwebtoken"
import Link from "next/link"
import { cookies } from "next/headers"
import { notFound } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import sql from "@/lib/neon/db"
import type { Product } from "@/types"
import { PageContainer } from "@/components/layout/PageContainer"
import { PageHeader } from "@/components/layout/PageHeader"
import { Button } from "@/components/ui/button"
import ProductForm from "@/components/products/ProductForm"

type PageProps = {
  params: Promise<{ id: string }>
}

type TokenPayload = {
  userId?: string
}

export default async function EditProductPage({ params }: PageProps) {
  const { id } = await params
  const cookieStore = await cookies()
  const token = cookieStore.get("token")?.value

  if (!token || !process.env.JWT_SECRET) {
    notFound()
  }

  let payload: TokenPayload | null = null
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET) as TokenPayload
  } catch {
    notFound()
  }

  const userId = payload?.userId
  if (!userId) {
    notFound()
  }

  const rows = await sql.query(
    "SELECT * FROM products WHERE id = $1 AND user_id = $2 AND is_active = true LIMIT 1",
    [id, userId]
  )

  const product = rows[0] as Product | undefined

  if (!product) {
    notFound()
  }

  return (
    <PageContainer>
      <PageHeader
        title="Edit Produk"
        description={`Memperbarui informasi untuk ${product.name}`}
        action={
          <Button variant="ghost" asChild>
            <Link href="/dashboard/products">
              <ArrowLeft className="mr-2 h-4 w-4" /> Kembali
            </Link>
          </Button>
        }
      />
      <div className="mt-6 w-full max-w-4xl pb-10">
        <ProductForm product={product} />
      </div>
    </PageContainer>
  )
}
