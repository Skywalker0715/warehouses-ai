"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import type { Warehouse } from "@/types"
import { useToast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"

type WarehouseFormProps = {
  warehouse?: Warehouse
}

const warehouseSchema = z.object({
  name: z
    .string()
    .min(1, { message: "Nama gudang wajib diisi" })
    .min(2, { message: "Nama gudang wajib diisi" })
    .max(100),
  location: z.string().max(200).optional(),
  type: z.string().max(100).optional(),
  max_capacity: z
    .coerce
    .number()
    .int()
    .min(1, { message: "Kapasitas harus berupa angka positif" }),
})

type WarehouseFormInput = z.input<typeof warehouseSchema>
type WarehouseFormOutput = z.output<typeof warehouseSchema>

const LIST_ROUTE = "/dashboard/warehouses"

export default function WarehouseForm({ warehouse }: WarehouseFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [serverError, setServerError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<WarehouseFormInput, unknown, WarehouseFormOutput>({
    resolver: zodResolver(warehouseSchema),
    defaultValues: {
      name: warehouse?.name ?? "",
      location: warehouse?.location ?? "",
      type: warehouse?.type ?? "",
      max_capacity: warehouse?.max_capacity ?? 1,
    },
  })

  const handleSubmit = async (values: WarehouseFormOutput) => {
    setServerError(null)
    setIsSubmitting(true)

    try {
      const res = await fetch(
        warehouse ? `/api/warehouses/${warehouse.id}` : "/api/warehouses",
        {
          method: warehouse ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(values),
        }
      )

      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        const message = data?.error ?? "Terjadi kesalahan. Silakan coba lagi."
        setServerError(message)
        toast({
          title: "Gagal menyimpan",
          description: message,
          variant: "destructive",
        })
        return
      }

      toast({
        title: warehouse ? "Perubahan tersimpan" : "Gudang ditambahkan",
        description: warehouse
          ? "Gudang berhasil diperbarui."
          : "Gudang baru berhasil ditambahkan.",
      })
      router.push(LIST_ROUTE)
    } catch {
      setServerError("Terjadi kesalahan. Silakan coba lagi.")
      toast({
        title: "Gagal menyimpan",
        description: "Terjadi kesalahan. Silakan coba lagi.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card className="max-w-lg">
      <CardHeader>
        <CardTitle>
          {warehouse ? "Edit Gudang" : "Tambah Gudang"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-5"
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nama Gudang</FormLabel>
                  <FormControl>
                    <Input placeholder="Nama gudang" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Lokasi</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Jl. Raya No. 1, Jakarta Utara"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="max_capacity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Maksimal Kapasitas (unit)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      value={
                        typeof field.value === "number" ||
                        typeof field.value === "string"
                          ? field.value
                          : ""
                      }
                      onChange={(event) =>
                        field.onChange(event.target.value)
                      }
                    />
                  </FormControl>
                  <p className="text-xs text-muted-foreground">
                    Jumlah maksimum unit yang bisa disimpan
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipe Gudang</FormLabel>
                  <FormControl>
                    <Input placeholder="Cold storage, umum, dll." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {serverError ? (
              <p className="text-sm text-red-600">{serverError}</p>
            ) : null}

            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="ghost"
                onClick={() => router.push(LIST_ROUTE)}
              >
                Batal
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting
                  ? "Menyimpan..."
                  : warehouse
                  ? "Simpan Perubahan"
                  : "Tambah Gudang"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
