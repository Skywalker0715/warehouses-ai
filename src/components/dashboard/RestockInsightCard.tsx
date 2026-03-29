"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  Loader2,
  MapPin,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import type { RestockInsight, RestockItem } from "@/types";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { truncateText } from "@/lib/utils";

type FetchState = {
  data: RestockInsight | null;
  error: string | null;
  isLoading: boolean;
  lastRefreshed: Date | null;
};

const PRIORITY_LABEL: Record<
  RestockItem["priority"],
  { label: string; className: string; dot?: string }
> = {
  critical: {
    label: "Kritis",
    className: "border-red-200 bg-red-50 text-red-700",
    dot: "bg-red-500",
  },
  high: {
    label: "Tinggi",
    className: "border-orange-200 bg-orange-50 text-orange-700",
  },
  medium: {
    label: "Sedang",
    className: "border-amber-200 bg-amber-50 text-amber-700",
  },
  low: {
    label: "Rendah",
    className: "border-gray-200 bg-gray-50 text-gray-700",
  },
};

export default function RestockInsightCard() {
  const [state, setState] = useState<FetchState>({
    data: null,
    error: null,
    isLoading: false,
    lastRefreshed: null,
  });
  const [showAll, setShowAll] = useState(false);

  const minutesAgo = useMemo(() => {
    if (!state.lastRefreshed) return null;
    const diffMs = Date.now() - state.lastRefreshed.getTime();
    return Math.max(1, Math.round(diffMs / 60000));
  }, [state.lastRefreshed]);

  const fetchInsights = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const res = await fetch("/api/ai/insights/restock");
      const json = await res.json();

      if (!res.ok || !json?.success) {
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: json?.error ?? "Gagal memuat rekomendasi restock.",
        }));
        return;
      }

      setState({
        data: json.data as RestockInsight,
        isLoading: false,
        error: null,
        lastRefreshed: new Date(),
      });
    } catch {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: "Terjadi kesalahan jaringan. Coba lagi.",
      }));
    }
  }, []);

  useEffect(() => {
    fetchInsights();
  }, [fetchInsights]);

  const recommendations = state.data?.recommendations ?? [];
  const visibleRecommendations = showAll
    ? recommendations
    : recommendations.slice(0, 5);
  const hiddenCount = Math.max(0, recommendations.length - 5);

  return (
    <Card className="rounded-2xl border bg-white shadow-sm">
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-blue-500" />
          <div className="font-semibold text-slate-900">Rekomendasi Restock</div>
        </div>
        <div className="flex items-center gap-2">
          {minutesAgo ? (
            <span className="text-xs text-muted-foreground">
              {minutesAgo} menit lalu
            </span>
          ) : null}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={fetchInsights}
            disabled={state.isLoading}
          >
            {state.isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {state.isLoading ? (
          <div className="space-y-3">
            {[0, 1, 2].map((idx) => (
              <div
                key={idx}
                className="flex items-center justify-between rounded-lg border border-dashed p-3"
              >
                <div className="flex items-center gap-3">
                  <Skeleton className="h-6 w-16" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-44" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                </div>
                <Skeleton className="h-4 w-20" />
              </div>
            ))}
          </div>
        ) : null}

        {!state.isLoading && state.error ? (
          <Alert className="border-red-200 bg-red-50 text-red-700">
            <AlertTitle className="text-red-700">Gagal Memuat Insight</AlertTitle>
            <AlertDescription className="flex flex-col gap-2 text-red-600">
              <span>{state.error}</span>
              <Button
                variant="outline"
                size="sm"
                className="w-fit border-red-200 text-red-700 hover:bg-red-100"
                onClick={fetchInsights}
              >
                Coba lagi
              </Button>
            </AlertDescription>
          </Alert>
        ) : null}

        {!state.isLoading && !state.error && recommendations.length === 0 ? (
          <div className="rounded-xl border border-dashed p-4 text-center">
            <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            </div>
            <div className="font-medium text-slate-900">Semua stok aman</div>
            <p className="mt-1 text-sm text-muted-foreground">
              {state.data?.summary}
            </p>
          </div>
        ) : null}

        {!state.isLoading && !state.error && recommendations.length > 0 ? (
          <div className="space-y-3">
            <p className="text-sm italic text-muted-foreground">
              {state.data?.summary}
            </p>

            {visibleRecommendations.map((item) => {
              const priority = PRIORITY_LABEL[item.priority];
              const lowStock = item.current_quantity <= 10;

              return (
                <div
                  key={`${item.sku}-${item.warehouse_name}`}
                  className="rounded-xl border p-3"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <Badge
                        variant="outline"
                        className={`gap-2 ${priority.className}`}
                      >
                        {priority.dot ? (
                          <span className="relative flex h-2 w-2">
                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
                            <span
                              className={`relative inline-flex h-2 w-2 rounded-full ${priority.dot}`}
                            />
                          </span>
                        ) : null}
                        {priority.label}
                      </Badge>
                      <div>
                        <div className="font-medium text-slate-900">
                          {item.product_name}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {item.sku}
                        </div>
                      </div>
                    </div>

                    <div
                      className={`text-sm font-semibold ${
                        lowStock ? "text-red-600" : "text-slate-900"
                      }`}
                    >
                      {item.current_quantity} {item.unit}
                    </div>
                  </div>

                  <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" />
                      {item.warehouse_name}
                    </span>
                    <span className="text-slate-700">
                      - Reorder {item.suggested_reorder_qty} {item.unit}
                    </span>
                  </div>

                  <div
                    className="mt-2 text-xs italic text-muted-foreground"
                    title={item.reason}
                  >
                    {truncateText(item.reason, 80)}
                  </div>
                </div>
              );
            })}

            {hiddenCount > 0 ? (
              <Button
                variant="ghost"
                size="sm"
                className="w-full"
                onClick={() => setShowAll((prev) => !prev)}
              >
                {showAll
                  ? "Sembunyikan"
                  : `Lihat ${hiddenCount} lainnya`}
              </Button>
            ) : null}
          </div>
        ) : null}
      </CardContent>

      <CardFooter className="flex items-center gap-2 text-xs text-muted-foreground">
        <Sparkles className="h-3.5 w-3.5" />
        Dianalisis oleh AI
      </CardFooter>
    </Card>
  );
}
