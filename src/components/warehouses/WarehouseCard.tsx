"use client"

import { useState } from "react"
import {
  Warehouse as WarehouseIcon,
  MapPin,
  Package,
  Pencil,
  Trash2,
  MoreVertical,
} from "lucide-react"
import type { WarehouseWithUtilization } from "@/types"
import { getUtilizationStatus } from "@/types"
import { formatNumber } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

type WarehouseCardProps = {
  warehouse: WarehouseWithUtilization
  onEdit: (id: string) => void
  onDelete: (id: string, name: string) => void
}

const STATUS_LABEL: Record<
  ReturnType<typeof getUtilizationStatus>,
  { label: string; color: string; badge: string; bar: string }
> = {
  safe: {
    label: "Aman",
    color: "text-green-600",
    badge: "bg-green-100 text-green-700",
    bar: "[&_[data-slot=progress-indicator]]:bg-green-500",
  },
  warning: {
    label: "Perhatian",
    color: "text-amber-600",
    badge: "bg-amber-100 text-amber-700",
    bar: "[&_[data-slot=progress-indicator]]:bg-amber-500",
  },
  danger: {
    label: "Hampir Penuh",
    color: "text-orange-600",
    badge: "bg-orange-100 text-orange-700",
    bar: "[&_[data-slot=progress-indicator]]:bg-orange-500",
  },
  critical: {
    label: "Kritis",
    color: "text-red-600",
    badge: "bg-red-100 text-red-700",
    bar: "[&_[data-slot=progress-indicator]]:bg-red-500",
  },
}

export default function WarehouseCard({
  warehouse,
  onEdit,
  onDelete,
}: WarehouseCardProps) {
  const status = getUtilizationStatus(warehouse.utilization_percent)
  const statusMeta = STATUS_LABEL[status]
  const typeLabel = warehouse.type?.trim()
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const capacity = Number(
    (warehouse as unknown as { capacity?: number }).capacity ??
      warehouse.max_capacity ??
      0
  )

  const handleDelete = () => {
    onDelete(warehouse.id, warehouse.name)
  }

  return (
    <Card className="rounded-2xl bg-white shadow-sm transition-shadow hover:shadow-md">
      <CardHeader className="space-y-2">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-blue-50 p-2 text-blue-600">
              <WarehouseIcon className="h-5 w-5" />
            </div>
            <div>
              <div className="text-base font-semibold text-slate-900">
                {warehouse.name}
              </div>
              {warehouse.location ? (
                <Badge
                  variant="outline"
                  className="mt-2 flex w-fit items-center gap-1 text-xs"
                >
                  <MapPin className="h-3 w-3" />
                  {warehouse.location}
                </Badge>
              ) : null}
              {typeLabel ? (
                <Badge
                  variant="outline"
                  className="mt-2 flex w-fit items-center gap-1 border-blue-100 bg-blue-50 text-xs text-blue-700"
                >
                  {typeLabel}
                </Badge>
              ) : null}
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Menu gudang">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                className="cursor-pointer"
                onSelect={() => onEdit(warehouse.id)}
              >
                <Pencil className="h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                className="cursor-pointer text-red-600"
                onSelect={() => setIsDeleteOpen(true)}
              >
                <Trash2 className="h-4 w-4" />
                Hapus
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Package className="h-4 w-4" />
            <div>
              <div className="text-xs uppercase tracking-wide">Total Stok</div>
              <div className="text-sm font-semibold text-slate-900">
                {formatNumber(warehouse.total_stock)} unit
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <WarehouseIcon className="h-4 w-4" />
            <div>
              <div className="text-xs uppercase tracking-wide">Kapasitas</div>
              <div className="text-sm font-semibold text-slate-900">
                {formatNumber(capacity)} unit
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Kapasitas Terpakai</span>
            <span className={`font-semibold ${statusMeta.color}`}>
              {warehouse.utilization_percent}%
            </span>
          </div>
          <Progress
            value={warehouse.utilization_percent}
            className={statusMeta.bar}
          />
          <Badge className={statusMeta.badge}>{statusMeta.label}</Badge>
        </div>
      </CardContent>

      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus gudang?</AlertDialogTitle>
            <AlertDialogDescription>
              {`Hapus gudang ${warehouse.name}? Gudang hanya bisa dihapus jika tidak ada stok aktif.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => {
                handleDelete()
                setIsDeleteOpen(false)
              }}
            >
              Hapus Gudang
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  )
}
