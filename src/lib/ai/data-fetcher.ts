import 'server-only';
import sql from "@/lib/neon/db";

export interface StockSummary {
  total_products: number;
  total_warehouses: number;
  total_units: number;
  relevant_stock_items: { // Renamed from low_stock_items
    product_name: string;
    sku: string;
    warehouse_name: string;
    quantity: number;
    unit: string;
  }[];
  out_of_stock_items: {
    product_name: string;
    sku: string;
    warehouse_name: string;
    quantity: number;
    unit: string;
  }[];
  warehouse_utilization: {
    warehouse_name: string;
    capacity: number;
    total_stock: number;
    utilization_percent: number;
  }[];
}

export interface StockTrend {
  product_name: string;
  sku: string;
  warehouse_name: string;
  total_in: number;
  total_out: number;
  current_quantity: number;
  avg_daily_out: number;
  days_until_empty: number | null;
}

export interface CapacityAlert {
  warehouse_name: string;
  location: string | null;
  capacity: number;
  total_stock: number;
  utilization_percent: number;
}

/**
 * Fetches a high-level summary of stock, including low-stock alerts and warehouse usage.
 * Provides critical context for AI to understand the current state of the inventory.
 */
export async function getStockSummary(userId: string, searchTerm?: string): Promise<StockSummary> {
  const summaryQuery = `
    SELECT 
      (SELECT COUNT(*)::int FROM products WHERE user_id = $1 AND is_active = true) as total_products,
      (SELECT COUNT(*)::int FROM warehouses WHERE user_id = $1 AND is_active = true) as total_warehouses,
      (SELECT COALESCE(SUM(s.quantity), 0)::int
       FROM stock s
       JOIN products p ON s.product_id = p.id
       JOIN warehouses w ON s.warehouse_id = w.id
       WHERE p.user_id = $1 AND w.user_id = $1
      ) as total_units
  `;

  // Jika ada searchTerm, cari yang relevan. Jika tidak, ambil yang stok paling sedikit.
  const searchFilter = searchTerm ? `AND (p.name ILIKE $2 OR p.sku ILIKE $2)` : `AND s.quantity <= 25`;
  const itemsQuery = `
    SELECT p.name as product_name, p.sku, w.name as warehouse_name, s.quantity, p.unit
    FROM stock s
    JOIN products p ON s.product_id = p.id
    JOIN warehouses w ON s.warehouse_id = w.id
    WHERE p.user_id = $1 AND w.user_id = $1 ${searchFilter}
    ORDER BY s.quantity ASC
    LIMIT 200
  `;

  const utilizationQuery = `
    SELECT 
      w.name as warehouse_name, 
      w.capacity,
      COALESCE(SUM(s.quantity), 0)::int as total_stock,
      CASE 
        WHEN w.capacity > 0 THEN LEAST((COALESCE(SUM(s.quantity), 0)::float / w.capacity) * 100, 100)
        ELSE 0 
      END as utilization_percent
    FROM warehouses w
    LEFT JOIN stock s ON w.id = s.warehouse_id
    WHERE w.user_id = $1 AND w.is_active = true
    GROUP BY w.id, w.name, w.capacity
  `;

  const queryParams = [userId];
  if (searchTerm) queryParams.push(`%${searchTerm}%`);

  const [summaryRes, itemsRes, utilizationRes] = await Promise.all([
    sql.query(summaryQuery, [userId]),
    sql.query(itemsQuery, queryParams),
    sql.query(utilizationQuery, [userId]),
  ]);

  const summary = summaryRes[0] ?? {
    total_products: 0,
    total_warehouses: 0,
    total_units: 0,
  };
  const allItems = itemsRes as StockSummary['relevant_stock_items'];

  return {
    total_products: summary.total_products || 0,
    total_warehouses: summary.total_warehouses || 0,
    total_units: summary.total_units || 0,
    relevant_stock_items: allItems.filter(i => i.quantity > 0), // Hanya yang ada isinya
    out_of_stock_items: allItems.filter(i => i.quantity === 0).slice(0, 15), // Kumpulkan yang benar-benar habis
    warehouse_utilization: utilizationRes as StockSummary['warehouse_utilization'],
  };
}

/**
 * Analyzes stock history to identify trends and predict replenishment needs.
 * 
 * @param userId - Owner of the data
 * @param days - Rolling window for trend analysis
 */
export async function getStockTrends(userId: string, days: number = 30): Promise<StockTrend[]> {
  const query = `
    WITH movement AS (
      SELECT 
        product_id, 
        warehouse_id,
        SUM(CASE WHEN transaction_type = 'in' THEN quantity_change ELSE 0 END)::int as total_in,
        SUM(CASE WHEN transaction_type = 'out' THEN ABS(quantity_change) ELSE 0 END)::int as total_out
      FROM stock_history sh
      JOIN products p ON sh.product_id = p.id
      JOIN warehouses w ON sh.warehouse_id = w.id
      WHERE p.user_id = $1 AND w.user_id = $1
        AND sh.created_at >= NOW() - ($2::text || ' days')::interval
      GROUP BY product_id, warehouse_id
    )
    SELECT 
      p.name as product_name,
      p.sku,
      w.name as warehouse_name,
      m.total_in,
      m.total_out,
      s.quantity as current_quantity,
      (m.total_out::float / $2::int) as avg_daily_out,
      CASE 
        WHEN (m.total_out::float / $2::int) > 0 THEN (s.quantity / (m.total_out::float / $2::int))
        ELSE NULL 
      END as days_until_empty
    FROM movement m
    JOIN products p ON m.product_id = p.id
    JOIN warehouses w ON m.warehouse_id = w.id
    JOIN stock s ON m.product_id = s.product_id AND m.warehouse_id = s.warehouse_id
    WHERE m.total_in > 0 OR m.total_out > 0
    ORDER BY days_until_empty ASC NULLS LAST
    LIMIT 30
  `;

  try {
    const result = await sql.query(query, [userId, days]);

    return result.map(row => {
      const avgDailyOut = Number(row.avg_daily_out ?? 0);
      const daysUntilEmpty = Number(row.days_until_empty ?? NaN);

      return {
        ...(row as StockTrend),
        avg_daily_out: Number.isFinite(avgDailyOut)
          ? parseFloat(avgDailyOut.toFixed(2))
          : 0,
        days_until_empty: Number.isFinite(daysUntilEmpty)
          ? Math.floor(daysUntilEmpty)
          : null,
      };
    });
  } catch (error: unknown) {
    const message =
      error && typeof error === "object" && "message" in error
        ? String((error as { message?: unknown }).message).toLowerCase()
        : "";
    const code =
      error && typeof error === "object" && "code" in error
        ? String((error as { code?: unknown }).code)
        : "";

    // Jika tabel history belum ada, jangan gagalkan insight
    if (code === "42P01" || message.includes('relation "stock_history" does not exist')) {
      return [];
    }

    throw error;
  }
}

/**
 * Returns warehouses that are approaching or exceeding their storage capacity.
 */
export async function getWarehouseCapacityAlert(userId: string): Promise<CapacityAlert[]> {
  const query = `
    SELECT 
      warehouse_name,
      location,
      capacity,
      total_stock,
      utilization_percent
    FROM (
      SELECT 
        w.name as warehouse_name,
        w.location,
        w.capacity,
        COALESCE(SUM(s.quantity), 0)::int as total_stock,
        CASE 
          WHEN w.capacity > 0 THEN (COALESCE(SUM(s.quantity), 0)::float / w.capacity) * 100
          ELSE 0 
        END as utilization_percent
      FROM warehouses w
      LEFT JOIN stock s ON w.id = s.warehouse_id
      WHERE w.user_id = $1 AND w.is_active = true
      GROUP BY w.id, w.name, w.location, w.capacity
    ) as subquery
    WHERE utilization_percent > 75
    ORDER BY utilization_percent DESC
  `;

  const result = await sql.query(query, [userId]);
  return result as CapacityAlert[];
}
