import { Sidebar } from "@/components/app/sidebar";
import { Topbar } from "@/components/app/topbar";
import { getCurrentUser } from "@/lib/auth/current-user";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar isAdmin={user.role === "admin"} />
      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        <Topbar
          credits={user.profile.credits}
          email={user.email}
          name={user.profile.full_name ?? user.name}
        />
        <main className="flex-1 px-4 py-6 sm:px-8 sm:py-8">{children}</main>
      </div>
    </div>
  );
}
