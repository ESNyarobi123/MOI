import { redirect } from "next/navigation";

export default function AdminUsersTypoRedirectPage() {
  redirect("/admin/users");
}
