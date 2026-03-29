"use client";

import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import UserMenu from "@/components/layout/UserMenu";

type HeaderProps = {
  user: { email: string; id: string };
  onMobileMenuToggle: () => void;
};

export default function Header({ user, onMobileMenuToggle }: HeaderProps) {
  return (
    <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 shadow-sm md:px-6">
      <div className="flex items-center gap-3">
        <Button
          type="button"
          variant="ghost"
          className="md:hidden"
          onClick={onMobileMenuToggle}
          aria-label="Toggle menu"
        >
          <Menu className="h-5 w-5" />
        </Button>

        <span className="text-base font-semibold text-slate-900 md:hidden">
          Warehouse AI
        </span>
      </div>

      <div className="flex items-center gap-2 md:gap-4">
        <div className="hidden items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 md:flex">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          AI Ready
        </div>
        <UserMenu user={user} />
      </div>
    </header>
  );
}
