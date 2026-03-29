/**
 * DESIGN SYSTEM PREVIEW PAGE
 *
 * This page is for development purposes only to visualize the design system.
 * It should be removed or disabled before production deployment.
 */
"use client";

import { PriorityBadge } from "@/components/dashboard/PriorityBadge";
import { StatCard } from "@/components/dashboard/StatCard";
import { PageContainer } from "@/components/layout/PageContainer";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { typography } from "@/lib/typography";
import { Package } from "lucide-react";
import React from "react";

export default function DesignPreviewPage() {
  return (
    <PageContainer>
      <div className="space-y-12 pb-20">
        <PageHeader
          title="Design System Preview"
          description="Visual reference for colors, typography, and components."
        />

        {/* 1. Colors */}
        <section className="space-y-4">
          <h2 className={typography.heading.h2}>1. Colors</h2>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
            <ColorSwatch
              name="Primary"
              className="bg-primary text-primary-foreground"
            />
            <ColorSwatch
              name="Critical"
              className="bg-priority-critical text-priority-critical-foreground"
            />
            <ColorSwatch
              name="High"
              className="bg-priority-high text-priority-high-foreground"
            />
            <ColorSwatch
              name="Medium"
              className="bg-priority-medium text-priority-medium-foreground"
            />
            <ColorSwatch
              name="Low"
              className="bg-priority-low text-priority-low-foreground"
            />
          </div>
        </section>

        {/* 2. Typography */}
        <section className="space-y-4">
          <h2 className={typography.heading.h2}>2. Typography</h2>
          <div className="space-y-4 rounded-lg border p-6">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Headings</p>
              <h1 className={typography.heading.h1}>Heading 1</h1>
              <h2 className={typography.heading.h2}>Heading 2</h2>
              <h3 className={typography.heading.h3}>Heading 3</h3>
            </div>
            <div className="space-y-2 pt-4">
              <p className="text-sm text-muted-foreground">Body & Labels</p>
              <p className={typography.body.default}>
                Body Default: The quick brown fox jumps over the lazy dog.
              </p>
              <p className={typography.body.sm}>
                Body Small: The quick brown fox jumps over the lazy dog.
              </p>
              <p className={typography.body.muted}>
                Body Muted: The quick brown fox jumps over the lazy dog.
              </p>
              <div className="flex gap-4 pt-2">
                <span className={typography.label.default}>Label Default</span>
                <span className={typography.label.sm}>Label Small</span>
              </div>
            </div>
          </div>
        </section>

        {/* 3. Buttons */}
        <section className="space-y-4">
          <h2 className={typography.heading.h2}>3. Buttons</h2>
          <div className="flex flex-wrap gap-4 rounded-lg border p-6">
            <div className="grid gap-4">
              <h4 className="text-sm font-medium">Default Size</h4>
              <div className="flex flex-wrap gap-2">
                <Button variant="default">Default</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="outline">Outline</Button>
                <Button variant="ghost">Ghost</Button>
                <Button variant="destructive">Destructive</Button>
              </div>
            </div>
            <div className="grid gap-4">
              <h4 className="text-sm font-medium">Small Size</h4>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="default">Default</Button>
                <Button size="sm" variant="secondary">Secondary</Button>
                <Button size="sm" variant="outline">Outline</Button>
                <Button size="sm" variant="ghost">Ghost</Button>
                <Button size="sm" variant="destructive">Destructive</Button>
              </div>
            </div>
          </div>
        </section>

        {/* 4. Cards */}
        <section className="space-y-4">
          <h2 className={typography.heading.h2}>4. Cards</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="Total Produk"
              value="248"
              description="di 3 gudang"
              icon={<Package className="h-4 w-4" />}
              trend={{ value: 12, isPositive: true }}
            />
          </div>
        </section>

        {/* 5. Badges */}
        <section className="space-y-4">
          <h2 className={typography.heading.h2}>5. Badges</h2>
          <div className="flex flex-wrap gap-4 rounded-lg border p-6">
            <PriorityBadge priority="critical" />
            <PriorityBadge priority="high" />
            <PriorityBadge priority="medium" />
            <PriorityBadge priority="low" />
          </div>
        </section>

        {/* 6. Shadcn Components */}
        <section className="space-y-4">
          <h2 className={typography.heading.h2}>6. Shadcn Components</h2>
          <div className="grid max-w-md gap-6 rounded-lg border p-6">
            <div className="flex items-center gap-2">
              <Label>Standard Badge:</Label>
              <Badge>New Feature</Badge>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="email">Email Input</Label>
              <Input id="email" placeholder="name@example.com" />
            </div>

            <div className="grid gap-2">
              <Label>Select Option</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="user">User</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </section>
      </div>
    </PageContainer>
  );
}

function ColorSwatch({ name, className }: { name: string; className: string }) {
  return (
    <div
      className={`flex h-24 w-full flex-col items-center justify-center rounded-md border text-sm font-medium shadow-sm ${className}`}
    >
      {name}
    </div>
  );
}