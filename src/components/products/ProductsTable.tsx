"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  Package,
  Pencil,
  Plus,
  Search,
  SearchX,
  Trash2,
} from "lucide-react";
import type { Product } from "@/types";
import { useProducts } from "@/hooks/useProducts";
import { useToast } from "@/components/ui/use-toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import TableSkeleton from "@/components/products/TableSkeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatRupiah } from "@/lib/utils";
import { typography } from "@/lib/typography";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type ProductsTableProps = {
  initialProducts: Product[];
};

type ProductRow = Product;

const CATEGORY_OPTIONS = [
  { label: "Semua Kategori", value: "all" },
  { label: "Makanan", value: "Makanan" },
  { label: "Minuman", value: "Minuman" },
  { label: "Kebersihan", value: "Kebersihan" },
  { label: "Snack", value: "Snack" },
  { label: "Lainnya", value: "Lainnya" },
];

export default function ProductsTable({ initialProducts }: ProductsTableProps) {
  const router = useRouter();
  const { toast } = useToast();
  const {
    products,
    isLoading,
    error,
    search,
    category,
    setSearch,
    setCategory,
    deleteProduct,
  } = useProducts(initialProducts);
  const [productToDelete, setProductToDelete] = useState<ProductRow | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const rows = products as ProductRow[];
  const hasFilters = Boolean(search.trim() || category.trim());

  const handleDelete = useCallback(
    async (product: ProductRow) => {
      const result = await deleteProduct(product.id);
      if (!result.success) {
        toast({
          title: "Gagal menghapus produk",
          description: result.error || "Gagal menghapus produk.",
          variant: "destructive",
        });
        return;
      }
      toast({
        title: "Produk dihapus",
        description: `Produk ${product.name} berhasil dihapus.`,
      });
    },
    [deleteProduct, toast]
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Cari nama atau SKU produk..."
            className="pl-9"
          />
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
          <Select
            value={category || "all"}
            onValueChange={(value) =>
              setCategory(value === "all" ? "" : value)
            }
          >
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Semua Kategori" />
            </SelectTrigger>
            <SelectContent>
              {CATEGORY_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            className="bg-blue-600 text-white hover:bg-blue-700"
            onClick={() => router.push("/dashboard/products/new")}
          >
            <Plus className="h-4 w-4" />
            Tambah Produk
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="rounded-lg border bg-white">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produk</TableHead>
                <TableHead className="hidden sm:table-cell">Kategori</TableHead>
                <TableHead className="hidden sm:table-cell">Harga</TableHead>
                <TableHead>Unit</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableSkeleton />
          </Table>
        </div>
      ) : rows.length === 0 ? (
        <div className="rounded-lg border bg-white px-6 py-16 text-center">
          {hasFilters ? (
            <div className="flex flex-col items-center gap-3">
              <SearchX className="h-10 w-10 text-muted-foreground" />
              <div>
                <h3 className={typography.heading.h3}>Produk tidak ditemukan</h3>
                <p className={typography.body.muted}>
                  Coba ubah kata kunci pencarian atau reset filter.
                </p>
              </div>
              <Button
                variant="outline"
                onClick={() => {
                  setSearch("");
                  setCategory("");
                }}
              >
                Reset Filter
              </Button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <Package className="h-10 w-10 text-muted-foreground" />
              <div>
                <h3 className={typography.heading.h3}>Belum ada produk</h3>
                <p className={typography.body.muted}>
                  Mulai tambahkan produk untuk melacak stok di gudang kamu.
                </p>
              </div>
                <Button onClick={() => router.push("/dashboard/products/new")}>
                Tambah Produk Pertama
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div className="rounded-lg border bg-white">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produk</TableHead>
                <TableHead className="hidden sm:table-cell">Kategori</TableHead>
                <TableHead className="hidden sm:table-cell">Harga</TableHead>
                <TableHead>Unit</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((product) => {
                const isActive = product.is_active ?? true;
                return (
                  <TableRow key={product.id}>
                    <TableCell>
                      <div className="font-medium text-slate-900">
                        {product.name}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {product.sku}
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      {product.category ? (
                        <Badge variant="outline">{product.category}</Badge>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      {product.price !== null && product.price !== undefined ? (
                        formatRupiah(
                          typeof product.price === "string"
                            ? Number(product.price)
                            : product.price
                        )
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {product.unit ? (
                        product.unit
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {isActive ? (
                        <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
                          Aktif
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="text-muted-foreground"
                        >
                          Nonaktif
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() =>
                            router.push(
                              `/dashboard/products/${product.id}/edit`
                            )
                          }
                          aria-label="Edit produk"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-red-600 hover:text-red-700"
                          onClick={() => {
                            setProductToDelete(product);
                            setIsDeleteOpen(true);
                          }}
                          aria-label="Hapus produk"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          {error ? (
            <div className="flex items-center gap-2 border-t px-4 py-3 text-sm text-amber-700">
              <AlertTriangle className="h-4 w-4" />
              {error}
            </div>
          ) : null}
        </div>
      )}

      <AlertDialog
        open={isDeleteOpen}
        onOpenChange={(open) => {
          setIsDeleteOpen(open);
          if (!open) setProductToDelete(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus produk?</AlertDialogTitle>
            <AlertDialogDescription>
              {productToDelete
                ? `Hapus produk ${productToDelete.name}? Stok produk ini juga akan dihapus.`
                : "Produk ini akan dihapus."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={async () => {
                if (productToDelete) {
                  await handleDelete(productToDelete);
                }
                setIsDeleteOpen(false);
                setProductToDelete(null);
              }}
            >
              Hapus Produk
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
