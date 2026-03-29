"use client";

import { useMemo, useState } from "react";
import { useStock } from "@/hooks/useStock";
import type { StockWithDetails, Warehouse } from "@/types";
import { Package, Search } from "lucide-react";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import StockUpdateModal from "@/components/stock/StockUpdateModal";
import { typography } from "@/lib/typography";

type StockTableProps = {
  initialStocks: StockWithDetails[];
  warehouses: Warehouse[];
};

const warehouseLabel = (warehouseId: string, warehouses: Warehouse[]) => {
  if (!warehouseId) return "semua gudang";
  const match = warehouses.find((w) => w.id === warehouseId);
  return match?.name ?? "gudang terpilih";
};

const statusBadge = (quantity: number) => {
  if (quantity === 0) {
    return { label: "Habis", className: "bg-red-100 text-red-700" };
  }
  if (quantity <= 10) {
    return { label: "Kritis", className: "bg-orange-100 text-orange-700" };
  }
  if (quantity <= 50) {
    return { label: "Rendah", className: "bg-amber-100 text-amber-700" };
  }
  return { label: "Normal", className: "bg-emerald-100 text-emerald-700" };
};

export default function StockTable({
  initialStocks,
  warehouses,
}: StockTableProps) {
  const {
    stocks,
    isLoading,
    error,
    warehouseFilter,
    setWarehouseFilter,
    updateStock,
  } = useStock(initialStocks);
  const [selectedStock, setSelectedStock] = useState<StockWithDetails | null>(
    null
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");

  const typeOptions = useMemo(() => {
    const types = warehouses
      .map((warehouse) => warehouse.type?.trim())
      .filter((value): value is string => Boolean(value));
    return Array.from(new Set(types));
  }, [warehouses]);

  const categoryOptions = useMemo(() => {
    const categories = stocks
      .map((stock) => stock.product.category?.trim())
      .filter((value): value is string => Boolean(value));
    return Array.from(new Set(categories));
  }, [stocks]);

  const filteredStocks = useMemo(() => {
    const query = search.trim().toLowerCase();
    return stocks.filter((item) => {
      if (typeFilter) {
        const warehouseType = item.warehouse.type?.trim() ?? "";
        if (warehouseType !== typeFilter) return false;
      }

      if (categoryFilter) {
        const category = item.product.category?.trim() ?? "";
        if (category !== categoryFilter) return false;
      }

      if (!query) return true;
      const name = item.product.name?.toLowerCase() ?? "";
      const sku = item.product.sku?.toLowerCase() ?? "";
      return name.includes(query) || sku.includes(query);
    });
  }, [stocks, search, typeFilter, categoryFilter]);

  const showWarehouseColumn = !warehouseFilter;

  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-[260px_200px_200px_1fr] md:items-center">
        <Select
          value={warehouseFilter || "all"}
          onValueChange={(value) =>
            setWarehouseFilter(value === "all" ? "" : value)
          }
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Semua Gudang" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Gudang</SelectItem>
            {warehouses.map((warehouse) => (
              <SelectItem key={warehouse.id} value={warehouse.id}>
                {warehouse.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={typeFilter || "all"}
          onValueChange={(value) =>
            setTypeFilter(value === "all" ? "" : value)
          }
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Semua Tipe Gudang" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Tipe Gudang</SelectItem>
            {typeOptions.map((type) => (
              <SelectItem key={type} value={type}>
                {type}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={categoryFilter || "all"}
          onValueChange={(value) =>
            setCategoryFilter(value === "all" ? "" : value)
          }
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Semua Kategori" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Kategori</SelectItem>
            {categoryOptions.map((category) => (
              <SelectItem key={category} value={category}>
                {category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="relative w-full">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Cari nama atau SKU produk..."
            className="pl-9"
          />
        </div>
      </div>

      <p className="text-sm text-muted-foreground">
        Menampilkan {filteredStocks.length} produk di{" "}
        {warehouseLabel(warehouseFilter, warehouses)}
      </p>

      {isLoading ? (
        <div className="rounded-lg border bg-white">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produk</TableHead>
                {showWarehouseColumn ? (
                  <TableHead>Gudang</TableHead>
                ) : null}
                <TableHead>Stok</TableHead>
                <TableHead>Status stok</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: 5 }).map((_, index) => (
                <TableRow key={index}>
                  <TableCell>
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-40" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </TableCell>
                  {showWarehouseColumn ? (
                    <TableCell>
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-24" />
                      </div>
                    </TableCell>
                  ) : null}
                  <TableCell>
                    <Skeleton className="h-4 w-16" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-20" />
                  </TableCell>
                  <TableCell className="text-right">
                    <Skeleton className="ml-auto h-8 w-24" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : filteredStocks.length === 0 ? (
        <div className="rounded-lg border bg-white px-6 py-16 text-center">
          <Package className="mx-auto h-10 w-10 text-muted-foreground" />
          <h3 className={`mt-3 ${typography.heading.h3}`}>
            Belum ada data stok
          </h3>
        </div>
      ) : (
        <div className="rounded-lg border bg-white">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produk</TableHead>
                {showWarehouseColumn ? (
                  <TableHead>Gudang</TableHead>
                ) : null}
                <TableHead>Stok</TableHead>
                <TableHead>Status stok</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStocks.map((stock) => {
                const quantity = Number(stock.quantity ?? 0);
                const stockClass =
                  quantity <= 10
                    ? "text-red-600"
                    : quantity <= 50
                      ? "text-amber-600"
                      : "text-slate-900";
                const badge = statusBadge(quantity);

                return (
                  <TableRow key={stock.id}>
                    <TableCell>
                      <div className="font-medium text-slate-900">
                        {stock.product.name}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {stock.product.sku}
                      </div>
                    </TableCell>
                    {showWarehouseColumn ? (
                      <TableCell>
                        <div className="font-medium text-slate-900">
                          {stock.warehouse.name}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {stock.warehouse.location || "-"}
                        </div>
                      </TableCell>
                    ) : null}
                    <TableCell>
                      <div className={`font-mono font-semibold ${stockClass}`}>
                        {quantity} {stock.product.unit}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={badge.className}>{badge.label}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedStock(stock);
                          setIsModalOpen(true);
                        }}
                      >
                        Update Stok
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          {error ? (
            <div className="border-t px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          ) : null}
        </div>
      )}

      <StockUpdateModal
        stock={selectedStock}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onUpdate={updateStock}
      />
    </div>
  );
}
