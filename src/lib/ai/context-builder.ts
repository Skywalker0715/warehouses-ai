import 'server-only';
import { StockSummary, StockTrend, CapacityAlert } from './data-fetcher';

/**
 * Membangun konteks teks untuk ringkasan stok saat ini.
 */
export function buildStockContext(summary: StockSummary): string {
  let context = `=== RINGKASAN WAREHOUSE ===\n`;
  context += `Total Produk: ${summary.total_products} | Total Gudang: ${summary.total_warehouses} | Total Unit: ${summary.total_units}\n\n`;

  // Daftar Stok
  context += `STOK (SKU | Produk | Gudang | Qty):\n`;
  if (summary.relevant_stock_items.length > 0) { // Use the new name
    summary.relevant_stock_items.forEach(item => { // No slicing here, use all relevant items
      context += `- ${item.sku} | ${item.product_name} | ${item.warehouse_name} | ${item.quantity} ${item.unit}\n`;
    });
  } else {
    context += `Tidak ada data stok yang relevan ditemukan.\n`; // More general message
  }

  // Stok Habis
  context += `\nSTOK HABIS:\n`;
  if (summary.out_of_stock_items.length > 0) {
    const displayItems = summary.out_of_stock_items.slice(0, 5);
    displayItems.forEach(item => {
      context += `- ${item.product_name} (SKU: ${item.sku}) di ${item.warehouse_name}: 0 unit\n`;
    });
  } else {
    context += `Tidak ada stok yang habis.\n`;
  }

  return context.trim();
}

/**
 * Membangun konteks analisis tren pergerakan barang.
 */
export function buildTrendContext(trends: StockTrend[]): string {
  let context = `=== TREN STOK (30 HARI TERAKHIR) ===\n`;
  
  const urgentTrends = trends
    .filter(t => t.days_until_empty !== null)
    .slice(0, 10);

  if (urgentTrends.length > 0) {
    urgentTrends.forEach(t => {
      context += `- ${t.product_name} (SKU: ${t.sku}) di ${t.warehouse_name}: keluar ${t.avg_daily_out} unit/hari, sisa ${t.current_quantity} unit, estimasi habis dalam ${t.days_until_empty} hari\n`;
    });
  } else {
    context += `Tidak ada pergerakan signifikan yang menunjukkan risiko stok habis.\n`;
  }

  return context.trim();
}

/**
 * Membangun konteks untuk peringatan kapasitas gudang.
 */
export function buildCapacityContext(alerts: CapacityAlert[]): string {
  let context = `=== KAPASITAS GUDANG ===\n`;

  if (alerts.length > 0) {
    alerts.forEach(a => {
      const loc = a.location ? ` (${a.location})` : '';
      context += `- ${a.warehouse_name}${loc}: ${a.utilization_percent.toFixed(1)}% terpakai (${a.total_stock}/${a.capacity} unit)\n`;
    });
  } else {
    context += `Semua gudang dalam kapasitas normal.\n`;
  }

  return context.trim();
}

/**
 * Menggabungkan semua data menjadi satu blok teks konteks utuh untuk AI.
 */
export function buildFullContext(
  summary: StockSummary,
  trends: StockTrend[],
  alerts: CapacityAlert[]
): string {
  const now = new Date().toLocaleString('id-ID', { 
    dateStyle: 'full', 
    timeStyle: 'short' 
  });
  
  const separator = '\n----------------------------------------\n';
  
  return [
    `Data berikut adalah kondisi warehouse real-time per ${now}.`,
    buildStockContext(summary),
    buildTrendContext(trends),
    buildCapacityContext(alerts)
  ].join(separator);
}