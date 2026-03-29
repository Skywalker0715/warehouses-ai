"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  SlidersHorizontal,
} from "lucide-react";
import type { StockWithDetails } from "@/types";
import { formatNumber } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";

type StockUpdateType = "in" | "out" | "adjustment";

type StockUpdatePayload = {
  quantity_change: number;
  type: StockUpdateType;
  notes?: string;
};

type StockUpdateModalProps = {
  stock: StockWithDetails | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (
    stockId: string,
    payload: StockUpdatePayload
  ) => Promise<{ success: boolean; error?: string }>;
};

const TYPE_OPTIONS: Array<{
  value: StockUpdateType;
  label: string;
  icon: React.ReactNode;
  activeClass: string;
  inactiveClass: string;
}> = [
  {
    value: "in",
    label: "Stok Masuk",
    icon: <ArrowDownToLine className="h-4 w-4" />,
    activeClass: "bg-emerald-600 text-white",
    inactiveClass: "border border-emerald-200 text-emerald-700",
  },
  {
    value: "out",
    label: "Stok Keluar",
    icon: <ArrowUpFromLine className="h-4 w-4" />,
    activeClass: "bg-red-600 text-white",
    inactiveClass: "border border-red-200 text-red-700",
  },
  {
    value: "adjustment",
    label: "Adjustment",
    icon: <SlidersHorizontal className="h-4 w-4" />,
    activeClass: "bg-blue-600 text-white",
    inactiveClass: "border border-blue-200 text-blue-700",
  },
];

export default function StockUpdateModal({
  stock,
  isOpen,
  onClose,
  onUpdate,
}: StockUpdateModalProps) {
  const { toast } = useToast();
  const [type, setType] = useState<StockUpdateType>("in");
  const [quantity, setQuantity] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen || !stock) return;
    setType("in");
    setQuantity("");
    setNotes("");
    setError(null);
  }, [isOpen, stock?.id]);

  const currentQuantity = stock?.quantity ?? 0;
  const quantityNumber = Number(quantity);
  const quantityValid =
    Number.isInteger(quantityNumber) && quantityNumber > 0;

  const preview = useMemo(() => {
    if (!stock || !quantityValid) {
      return null;
    }

    if (type === "adjustment") {
      return {
        text: `Stok: ${formatNumber(currentQuantity)} -> ${formatNumber(
          quantityNumber
        )} unit`,
        value: quantityNumber,
        isZero: quantityNumber === 0,
      };
    }

    const next =
      type === "in"
        ? currentQuantity + quantityNumber
        : currentQuantity - quantityNumber;

    return {
      text:
        type === "in"
          ? `Stok: ${formatNumber(
              currentQuantity
            )} -> ${formatNumber(currentQuantity)} + ${formatNumber(
              quantityNumber
            )} = ${formatNumber(next)} unit`
          : `Stok: ${formatNumber(
              currentQuantity
            )} -> ${formatNumber(currentQuantity)} - ${formatNumber(
              quantityNumber
            )} = ${formatNumber(next)} unit`,
      value: next,
      isZero: next === 0,
    };
  }, [stock, quantityValid, type, quantityNumber, currentQuantity]);

  if (!isOpen || !stock) {
    return null;
  }

  const label =
    type === "in"
      ? "Jumlah Masuk"
      : type === "out"
        ? "Jumlah Keluar"
        : "Jumlah Akhir";

  const handleSubmit = async () => {
    setError(null);

    if (!quantityValid) {
      setError("Jumlah harus berupa angka positif.");
      return;
    }

    const change =
      type === "adjustment"
        ? quantityNumber - currentQuantity
        : type === "out"
          ? -quantityNumber
          : quantityNumber;

    setIsSubmitting(true);
    const result = await onUpdate(stock.id, {
      quantity_change: change,
      type,
      notes: notes.trim() ? notes.trim() : undefined,
    });
    setIsSubmitting(false);

    if (!result.success) {
      setError(result.error ?? "Terjadi kesalahan. Silakan coba lagi.");
      toast({
        title: "Gagal memperbarui stok",
        description: result.error ?? "Terjadi kesalahan. Silakan coba lagi.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Stok berhasil diperbarui",
      description: `${stock.product.name} - ${stock.warehouse.name}`,
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => (open ? null : onClose())}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            Update Stok - {stock.product.name}
          </DialogTitle>
        </DialogHeader>

        <div className="rounded-lg border bg-muted/20 p-3 text-sm">
          <div className="font-medium">{stock.warehouse.name}</div>
          <div className="text-muted-foreground">
            Stok saat ini:{" "}
            <span className="font-semibold text-foreground">
              {formatNumber(currentQuantity)} {stock.product.unit}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          {TYPE_OPTIONS.map((option) => {
            const active = option.value === type;
            return (
              <Button
                key={option.value}
                type="button"
                variant="outline"
                className={`justify-start gap-2 ${
                  active ? option.activeClass : option.inactiveClass
                }`}
                onClick={() => setType(option.value)}
              >
                {option.icon}
                {option.label}
              </Button>
            );
          })}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">{label}</label>
          <Input
            type="number"
            min={1}
            value={quantity}
            onChange={(event) => setQuantity(event.target.value)}
          />
          {type === "adjustment" ? (
            <p className="text-xs text-muted-foreground">
              Masukkan jumlah stok yang seharusnya ada
            </p>
          ) : null}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Catatan</label>
          <Textarea
            placeholder="Catatan (opsional)"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
          />
        </div>

        {preview ? (
          <div className="rounded-lg border bg-muted/30 px-3 py-2 text-sm">
            <span className={preview.isZero ? "text-red-600" : ""}>
              {preview.text}
            </span>
          </div>
        ) : null}

        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        <div className="space-y-2">
          <Button
            className="w-full"
            disabled={isSubmitting}
            onClick={handleSubmit}
          >
            {isSubmitting ? "Menyimpan..." : "Simpan Perubahan"}
          </Button>
          <Button
            variant="ghost"
            className="w-full"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Batal
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}