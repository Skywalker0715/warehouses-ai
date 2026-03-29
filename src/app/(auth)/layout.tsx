import type { ReactNode } from "react";
import { Warehouse } from "lucide-react";
import { typography } from "@/lib/typography";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen md:grid md:grid-cols-2">
      <div className="relative hidden overflow-hidden md:flex md:items-center md:justify-center bg-gradient-to-br from-blue-600 to-blue-800">
        <div className="pointer-events-none absolute inset-0 opacity-25">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.25)_1px,transparent_1px)] [background-size:24px_24px]" />
        </div>
        <div className="relative z-10 px-10 text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/15 text-white ring-1 ring-white/25">
            <Warehouse className="h-7 w-7" />
          </div>
          <h1 className={`${typography.heading.h1} text-white`}>
            Warehouse AI
          </h1>
          <p className={`${typography.body.default} mt-3 font-medium text-blue-100`}>
            Kelola gudang lebih cerdas dengan AI
          </p>
        </div>
      </div>
      <div className="flex min-h-screen items-center justify-center bg-white px-6 py-12 md:px-12">
        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  );
}
