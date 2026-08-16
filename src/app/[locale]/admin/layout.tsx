import { requireAdmin } from "@/lib/admin";
import AdminNav from "./_components/AdminNav";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();

  return (
    <div className="page-container max-w-6xl">
      <div className="grid md:grid-cols-[220px_1fr] gap-6 md:items-start">
        <aside className="md:sticky md:top-24">
          <AdminNav />
        </aside>
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
