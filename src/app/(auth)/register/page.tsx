"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type FormState = {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
};

type FormErrors = Partial<Record<keyof FormState, string>>;

const initialState: FormState = {
  name: "",
  email: "",
  password: "",
  confirmPassword: "",
};

export default function RegisterPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [form, setForm] = useState<FormState>(initialState);
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const redirectTimer = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (redirectTimer.current) {
        clearTimeout(redirectTimer.current);
      }
    };
  }, []);

  const validate = (): boolean => {
    const nextErrors: FormErrors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!form.name.trim()) {
      nextErrors.name = "Nama lengkap wajib diisi";
    }
    if (!form.email.trim()) {
      nextErrors.email = "Email wajib diisi";
    } else if (!emailRegex.test(form.email.trim())) {
      nextErrors.email = "Format email tidak valid";
    }
    if (!form.password) {
      nextErrors.password = "Password wajib diisi";
    } else if (form.password.length < 8) {
      nextErrors.password = "Password minimal 8 karakter";
    }
    if (!form.confirmPassword) {
      nextErrors.confirmPassword = "Konfirmasi password wajib diisi";
    } else if (form.confirmPassword !== form.password) {
      nextErrors.confirmPassword = "Konfirmasi password tidak cocok";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleChange =
    (field: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement>) => {
      setForm((prev) => ({ ...prev, [field]: e.target.value }));
    };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (loading) return;

    if (!validate()) return;

    try {
      setLoading(true);

      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim(),
          password: form.password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        const message =
          data?.error === "Email already exists"
            ? "Email ini sudah terdaftar"
            : "Terjadi kesalahan. Silakan coba lagi.";
        toast({
          title: "Registrasi gagal",
          description: message,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Registrasi berhasil",
        description: "Akun berhasil dibuat! Silakan login.",
      });
      setForm(initialState);
      redirectTimer.current = window.setTimeout(() => {
        router.push("/login");
      }, 2000);
    } catch {
      toast({
        title: "Registrasi gagal",
        description: "Terjadi kesalahan. Silakan coba lagi.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-md">
      <Card className="shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Buat Akun Baru</CardTitle>
          <CardDescription>Mulai kelola gudang dengan AI</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">Nama lengkap</Label>
              <Input
                id="name"
                placeholder="Masukkan nama lengkap"
                value={form.name}
                onChange={handleChange("name")}
              />
              {errors.name ? (
                <p className="mt-1 text-xs text-red-600">{errors.name}</p>
              ) : null}
            </div>

            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="nama@email.com"
                value={form.email}
                onChange={handleChange("email")}
              />
              {errors.email ? (
                <p className="mt-1 text-xs text-red-600">{errors.email}</p>
              ) : null}
            </div>

            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Minimal 8 karakter"
                value={form.password}
                onChange={handleChange("password")}
              />
              {errors.password ? (
                <p className="mt-1 text-xs text-red-600">{errors.password}</p>
              ) : null}
            </div>

            <div>
              <Label htmlFor="confirmPassword">Konfirmasi password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Ulangi password"
                value={form.confirmPassword}
                onChange={handleChange("confirmPassword")}
              />
              {errors.confirmPassword ? (
                <p className="mt-1 text-xs text-red-600">
                  {errors.confirmPassword}
                </p>
              ) : null}
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={loading}
            >
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/70 border-t-transparent" />
                  Mendaftar...
                </span>
              ) : (
                "Daftar"
              )}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Sudah punya akun?{" "}
            <a className="font-medium text-blue-600 hover:underline" href="/login">
              Login di sini
            </a>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
