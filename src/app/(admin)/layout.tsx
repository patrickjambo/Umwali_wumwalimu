import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session || (session.user as any)?.role !== 'admin') {
    redirect("/dashboard");
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-gray-900 text-white px-6">
        <Link href="/admin" className="flex items-center gap-2 font-bold">
          Amategeko Admin
        </Link>
        <div className="ml-auto flex items-center gap-4">
          <span className="text-sm font-medium">{session.user?.name} (Admin)</span>
          <form action={async () => {
             "use server";
             const { signOut } = await import("@/lib/auth");
             await signOut();
          }}>
            <Button variant="outline" size="sm" className="text-black">
              Sohoka
            </Button>
          </form>
        </div>
      </header>
      <div className="flex flex-1">
        <aside className="w-64 border-r bg-gray-50/40 p-4 hidden md:block">
          <nav className="flex flex-col gap-2">
            <Link href="/admin/questions" className="flex items-center gap-2 rounded-lg px-3 py-2 text-gray-500 hover:text-gray-900">
              Ibibazo (Questions)
            </Link>
            <Link href="/admin/students" className="flex items-center gap-2 rounded-lg px-3 py-2 text-gray-500 hover:text-gray-900">
              Abanyeshuri (Students)
            </Link>
            <Link href="/admin/certificates" className="flex items-center gap-2 rounded-lg px-3 py-2 text-gray-500 hover:text-gray-900">
              Ibyemezo (Certificates)
            </Link>
          </nav>
        </aside>
        <main className="flex-1 p-6 md:p-8 lg:p-12 bg-white">
          {children}
        </main>
      </div>
    </div>
  );
}
