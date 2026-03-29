import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { PageContainer } from "@/components/layout/PageContainer"
import { PageHeader } from "@/components/layout/PageHeader"
import { Button } from "@/components/ui/button"
import ProductForm from "@/components/products/ProductForm"

export default function NewProductPage() {
  return (
    <PageContainer>
      <PageHeader
        title="Tambah Produk"
        description="Masukkan detail produk baru ke dalam sistem."
        action={
          <Button variant="ghost" asChild>
            <Link href="/dashboard/products">
              <ArrowLeft className="mr-2 h-4 w-4" /> Kembali
            </Link>
          </Button>
        }
      />
      <div className="mt-6 w-full max-w-4xl pb-10">
        <ProductForm />
      </div>
    </PageContainer>
  )
}
