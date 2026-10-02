"use client";

import { useEffect, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";

function hasAdminRole(token: string | null) {
  if (!token) return false;
  try {
    const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    return payload.role === "admin" || payload.isAdmin === true;
  } catch {
    return false;
  }
}

export default function AdminLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (pathname === "/admin/login") {
        setAllowed(true);
        return;
      }
      const token = window.localStorage.getItem("sc_token");
      if (!hasAdminRole(token)) {
        router.replace(`/admin/login?next=${encodeURIComponent(pathname)}`);
        return;
      }
      setAllowed(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [pathname, router]);

  if (!allowed) return <main className="min-h-screen bg-slate-50 p-8 text-sm text-slate-600">Checking admin access...</main>;
  return children;
}
