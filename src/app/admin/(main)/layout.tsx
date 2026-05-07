import { AdminShell } from "@/components/admin/AdminShell";

export default function AdminMainLayout({ children }: { children: React.ReactNode }) {
  return <AdminShell>{children}</AdminShell>;
}
