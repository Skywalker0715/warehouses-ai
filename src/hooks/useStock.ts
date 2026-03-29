"use client";

import { useCallback, useEffect, useState } from "react";
import type { StockWithDetails } from "@/types";

type UpdatePayload = {
  quantity_change: number;
  type: "in" | "out" | "adjustment";
  notes?: string;
};

type UpdateResult = { success: boolean; error?: string };

type RawStockRow = {
  id: string;
  product_id: string;
  warehouse_id: string;
  quantity: number;
  updated_at: string;
  product?: StockWithDetails["product"];
  warehouse?: StockWithDetails["warehouse"];
  product_user_id?: string;
  user_id?: string;
  product_name?: string;
  sku?: string;
  product_category?: string | null;
  category?: string | null;
  price?: number | null;
  created_at?: string;
  unit?: string | null;
  warehouse_user_id?: string;
  warehouse_name?: string;
  location?: string | null;
  max_capacity?: number | null;
  warehouse_type?: string | null;
};

export function useStock(initialStocks: StockWithDetails[] = []) {
  const normalizeRows = useCallback((rows: RawStockRow[]): StockWithDetails[] => {
    return rows.map((row) => {
      if (row.product && row.warehouse) return row as StockWithDetails;
      return {
        id: row.id,
        product_id: row.product_id,
        warehouse_id: row.warehouse_id,
        quantity: row.quantity,
        updated_at: row.updated_at,
        product: {
          id: row.product_id,
          user_id: row.product_user_id ?? row.user_id ?? "",
          name: row.product_name ?? "",
          sku: row.sku ?? "",
          category: row.product_category ?? row.category ?? null,
          price: row.price ?? null,
          created_at: row.created_at ?? "",
          unit: row.unit ?? null,
        },
        warehouse: {
          id: row.warehouse_id,
          user_id: row.warehouse_user_id ?? row.user_id ?? "",
          name: row.warehouse_name ?? "",
          location: row.location ?? null,
          max_capacity: row.max_capacity ?? 0,
          type: row.warehouse_type ?? null,
          created_at: row.created_at ?? "",
        },
      } satisfies StockWithDetails;
    });
  }, []);

  const [stocks, setStocks] = useState<StockWithDetails[]>(() =>
    normalizeRows(initialStocks)
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warehouseFilter, setWarehouseFilter] = useState("");

  const fetchStock = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (warehouseFilter) {
        params.set("warehouse_id", warehouseFilter);
      }

      const query = params.toString();
      const res = await fetch(`/api/stock${query ? `?${query}` : ""}`);
      const data = await res.json();

      if (!res.ok) {
        setError(data?.error || "Gagal memuat stok.");
        setStocks([]);
        return;
      }

      const rows = (data?.data ?? []) as RawStockRow[];
      setStocks(normalizeRows(rows));
    } catch {
      setError("Gagal memuat stok.");
      setStocks([]);
    } finally {
      setIsLoading(false);
    }
  }, [warehouseFilter, normalizeRows]);

  useEffect(() => {
    fetchStock();
  }, [fetchStock]);

  const updateStock = useCallback(
    async (stockId: string, payload: UpdatePayload): Promise<UpdateResult> => {
      try {
        const res = await fetch(`/api/stock/${stockId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();

        if (!res.ok) {
          return {
            success: false,
            error: data?.error || "Gagal memperbarui stok.",
          };
        }

        await fetchStock();
        return { success: true };
      } catch {
        return { success: false, error: "Gagal memperbarui stok." };
      }
    },
    [fetchStock]
  );

  const handleSetWarehouseFilter = useCallback((warehouseId: string) => {
    setWarehouseFilter(warehouseId);
  }, []);

  return {
    stocks,
    isLoading,
    error,
    warehouseFilter,
    setWarehouseFilter: handleSetWarehouseFilter,
    updateStock,
    refetch: fetchStock,
  };
}
