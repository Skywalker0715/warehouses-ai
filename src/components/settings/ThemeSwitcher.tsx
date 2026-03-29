"use client"

import { useEffect, useState } from "react"
import { Check, Moon, Sun } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type ThemeMode = "light" | "dark"

const STORAGE_KEY = "warehouse-theme"

export default function ThemeSwitcher() {
  const [theme, setTheme] = useState<ThemeMode>(() => {
    if (typeof window === "undefined") return "light"
    const saved = window.localStorage.getItem(STORAGE_KEY)
    return saved === "dark" ? "dark" : "light"
  })

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark")
    window.localStorage.setItem(STORAGE_KEY, theme)
  }, [theme])

  const applyTheme = (next: ThemeMode) => {
    setTheme(next)
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <Button
        type="button"
        variant="outline"
        className={cn(
          "h-auto items-start justify-start gap-3 rounded-xl border p-4 text-left",
          theme === "light" && "border-blue-600 ring-1 ring-blue-600/20"
        )}
        onClick={() => applyTheme("light")}
      >
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 text-amber-700">
          <Sun className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 text-sm font-semibold">
            Mode Terang
            {theme === "light" ? (
              <Check className="h-4 w-4 text-blue-600" />
            ) : null}
          </div>
          <p className="text-xs text-muted-foreground">
            Tampilan cerah untuk penggunaan sehari-hari.
          </p>
        </div>
      </Button>

      <Button
        type="button"
        variant="outline"
        className={cn(
          "h-auto items-start justify-start gap-3 rounded-xl border p-4 text-left",
          theme === "dark" && "border-blue-600 ring-1 ring-blue-600/20"
        )}
        onClick={() => applyTheme("dark")}
      >
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-800 text-slate-100">
          <Moon className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 text-sm font-semibold">
            Mode Gelap
            {theme === "dark" ? (
              <Check className="h-4 w-4 text-blue-600" />
            ) : null}
          </div>
          <p className="text-xs text-muted-foreground">
            Nyaman untuk penggunaan malam hari.
          </p>
        </div>
      </Button>
    </div>
  )
}
