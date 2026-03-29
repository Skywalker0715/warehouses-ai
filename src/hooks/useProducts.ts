"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Product } from "@/types";

type DeleteResult = { success: boolean; error?: string };

export function useProducts(initialProducts: Product[] = []) {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");

  const searchRef = useRef(search);
  const categoryRef = useRef(category);
  const skipSearchEffect = useRef(true);
  const skipCategoryEffect = useRef(true);

  useEffect(() => {
    searchRef.current = search;
  }, [search]);

  useEffect(() => {
    categoryRef.current = category;
  }, [category]);

  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (searchRef.current) {
        params.set("search", searchRef.current);
      }
      if (categoryRef.current) {
        params.set("category", categoryRef.current);
      }

      const query = params.toString();
      const res = await fetch(`/api/products${query ? `?${query}` : ""}`);
      const data = await res.json();

      if (!res.ok) {
        setError(data?.error || "Gagal memuat produk.");
        setProducts([]);
        return;
      }

      setProducts(data?.data ?? []);
    } catch {
      setError("Gagal memuat produk.");
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    if (skipSearchEffect.current) {
      skipSearchEffect.current = false;
      return;
    }

    const timeoutId = setTimeout(() => {
      fetchProducts();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [search, fetchProducts]);

  useEffect(() => {
    if (skipCategoryEffect.current) {
      skipCategoryEffect.current = false;
      return;
    }

    fetchProducts();
  }, [category, fetchProducts]);

  const deleteProduct = useCallback(
    async (id: string): Promise<DeleteResult> => {
      try {
        const res = await fetch(`/api/products/${id}`, { method: "DELETE" });
        const data = await res.json();

        if (!res.ok) {
          return {
            success: false,
            error: data?.error || "Gagal menghapus produk.",
          };
        }

        await fetchProducts();
        return { success: true };
      } catch {
        return { success: false, error: "Gagal menghapus produk." };
      }
    },
    [fetchProducts]
  );

  return {
    products,
    isLoading,
    error,
    search,
    category,
    setSearch,
    setCategory,
    deleteProduct,
    refetch: fetchProducts,
  };
}
