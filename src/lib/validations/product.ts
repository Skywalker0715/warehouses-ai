import { z } from "zod";

const priceSchema = z
  .union([z.number(), z.string(), z.null(), z.undefined()])
  .transform((value) => {
    if (value === "" || value === null || value === undefined) {
      return null
    }
    const coerced = Number(value)
    return Number.isNaN(coerced) ? value : coerced
  })
  .refine(
    (value) =>
      value === null ||
      (typeof value === "number" && value > 0 && value <= 999_999_999),
    { message: "Harga harus berupa angka positif" }
  )

export const productSchema = z.object({
  name: z
    .string()
    .min(1, { message: "Nama produk wajib diisi" })
    .min(2, { message: "Nama produk minimal 2 karakter" })
    .max(100, { message: "Nama produk maksimal 100 karakter" }),
  sku: z
    .string()
    .min(1, { message: "SKU wajib diisi" })
    .min(2, { message: "SKU minimal 2 karakter" })
    .max(50)
    .transform((value) => value.toUpperCase()),
  category: z.string().optional(),
  price: priceSchema,
  min_quantity: z
    .union([z.number(), z.string(), z.null(), z.undefined()])
    .transform((value) => {
      if (value === "" || value === null || value === undefined) {
        return 0;
      }
      const coerced = Number(value);
      return Number.isNaN(coerced) ? value : coerced;
    })
    .refine(
      (value) => typeof value === "number" && value >= 0,
      { message: "Minimum stok harus berupa angka 0 atau lebih" }
    ),
  unit: z.string().default("pcs"),
  description: z
    .string()
    .max(500, { message: "Deskripsi maksimal 500 karakter" })
    .optional(),
});

export type ProductFormData = z.infer<typeof productSchema>;
