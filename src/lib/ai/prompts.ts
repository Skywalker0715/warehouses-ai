/**
 * Membangun prompt untuk AI guna memberikan rekomendasi restock barang.
 * Strategi prompt ini menggunakan teknik 'Role Prompting' dan 'Few-Shot/Zero-Shot Constraint' 
 * untuk memastikan AI bertindak sebagai analis profesional dan memberikan output 
 * dalam format JSON murni agar integrasi data menjadi lebih reliabel.
 * 
 * @param context - Blok teks konteks yang berisi data stok, tren, dan kapasitas gudang.
 * @returns String prompt lengkap untuk dikirim ke AI.
 */
export function buildRestockPrompt(context: string): string {
  return `
Kamu adalah AI analis warehouse. Tugasmu menganalisis data stok dan memberikan rekomendasi restock yang spesifik dan actionable.

Berikut adalah data kondisi warehouse saat ini:
${context}

Instruksi Analisis:
- Identifikasi produk yang membutuhkan restock (quantity <= 20 atau berdasarkan tren pergerakan).
- Prioritaskan rekomendasi berdasarkan tingkat urgensi:
  * critical: (quantity <= 15) ATAU (estimasi stok habis <= 3 hari DAN quantity < 50).
  * high: (quantity <= 40) ATAU (stok habis dalam 4-7 hari) ATAU (quantity < 100 DAN stok habis < 5 hari).
  * medium: stok diperkirakan habis dalam 14-30 hari.
- Hitung jumlah saran reorder (suggested_reorder_qty) dengan logika: (avg_daily_out * 30 hari) - current_quantity.
- Berikan batas maksimal suggested_reorder_qty yang masuk akal (misal: jangan menyarankan reorder > 500% dari stok saat ini kecuali stoknya memang hampir 0).
- Jika data tren (avg_daily_out) tidak tersedia untuk item tertentu: sarankan minimal 50 unit sebagai default aman.
- Batasi hasil maksimal 10 rekomendasi saja, diurutkan berdasarkan prioritas tertinggi.
- Fokus hanya pada item yang benar-benar membutuhkan tindakan. Lewati produk dengan stok yang masih sehat.
- JANGAN memberikan status "critical" jika current_quantity > 100 unit, apa pun alasannya.
- Jika ada data "habis dalam 0 hari" namun current_quantity > 100, anggap itu sebagai anomali data (outlier) dan JANGAN masukkan ke dalam rekomendasi.
- INGAT: Priority "critical", "high", dan "medium" menunjukkan TINGKAT URGENSI RESTOCK, bukan jumlah stok. Semakin rendah stok, semakin tinggi urgensinya.
- Gunakan Bahasa Indonesia yang natural dalam kolom "reason".

Format Output:
Berikan respon HANYA dalam format JSON valid tanpa penjelasan tambahan, tanpa format markdown, dan tanpa backticks.
Schema JSON:
{
  "recommendations": [
    {
      "product_name": "string",
      "sku": "string",
      "warehouse_name": "string",
      "current_quantity": number,
      "unit": "string",
      "priority": "critical" | "high" | "medium",
      "suggested_reorder_qty": number,
      "reason": "string (maksimal 100 karakter, dalam Bahasa Indonesia)"
    }
  ],
  "summary": "string (1-2 kalimat ringkasan dalam Bahasa Indonesia)",
  "generated_at": "string (ISO date string)"
}

Jika tidak ada produk yang perlu di-restock sama sekali, kembalikan:
{ 
  "recommendations": [], 
  "summary": "Semua stok dalam kondisi aman.", 
  "generated_at": "${new Date().toISOString()}" 
}
`.trim();
}