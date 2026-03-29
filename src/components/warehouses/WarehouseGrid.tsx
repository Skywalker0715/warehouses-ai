"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import type { WarehouseWithUtilization } from "@/types"
import WarehouseCard from "@/components/warehouses/WarehouseCard"
import { useToast } from "@/components/ui/use-toast"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

type WarehouseGridProps = {
  initialWarehouses: WarehouseWithUtilization[]
}

export default function WarehouseGrid({ initialWarehouses }: WarehouseGridProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [warehouses, setWarehouses] = useState(initialWarehouses)
  const [typeFilter, setTypeFilter] = useState("")

  const handleEdit = (id: string) => {
    router.push(`/dashboard/warehouses/${id}/edit`)
  }

  const handleDelete = async (id: string, name: string) => {
    try {
      const res = await fetch(`/api/warehouses/${id}`, { method: "DELETE" })
      const data = await res.json().catch(() => ({}))

      if (!res.ok) {
        toast({
          title: "Gagal menghapus gudang",
          description:
            data?.error ??
            `Gudang ${name} tidak dapat dihapus.`,
          variant: "destructive",
        })
        return
      }

      setWarehouses((current) => current.filter((item) => item.id !== id))
      toast({
        title: "Gudang dihapus",
        description: `Gudang ${name} berhasil dihapus.`,
      })
    } catch {
      toast({
        title: "Gagal menghapus gudang",
        description: "Terjadi kesalahan. Silakan coba lagi.",
        variant: "destructive",
      })
    }
  }

  const typeOptions = useMemo(() => {
    const types = warehouses
      .map((warehouse) => warehouse.type?.trim())
      .filter((value): value is string => Boolean(value))
    return Array.from(new Set(types))
  }, [warehouses])

  const filteredWarehouses = useMemo(() => {
    if (!typeFilter) return warehouses
    return warehouses.filter(
      (warehouse) => warehouse.type?.trim() === typeFilter
    )
  }, [warehouses, typeFilter])

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <Select
          value={typeFilter || "all"}
          onValueChange={(value) =>
            setTypeFilter(value === "all" ? "" : value)
          }
        >
          <SelectTrigger className="w-full sm:w-60">
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
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filteredWarehouses.map((warehouse) => (
          <WarehouseCard
            key={warehouse.id}
            warehouse={warehouse}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        ))}
      </div>
    </div>
  )
}
