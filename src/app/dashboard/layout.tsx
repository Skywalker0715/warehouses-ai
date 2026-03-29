import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import DashboardShell from "@/components/layout/DashboardShell";

type TokenPayload = {
  userId?: string;
  email?: string;
};

type DashboardLayoutProps = {
  children: React.ReactNode;
};

export default async function DashboardLayout({
  children,
}: DashboardLayoutProps) {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  if (!token || !process.env.JWT_SECRET) {
    redirect("/login");
  }

  let payload: TokenPayload | null = null;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET) as TokenPayload;
  } catch {
    redirect("/login");
  }

  const user = {
    id: payload?.userId ?? "unknown",
    email: payload?.email ?? "unknown",
  };

  return <DashboardShell user={user}>{children}</DashboardShell>;
}
