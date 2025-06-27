
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export function MainNav({
  className,
  ...props
}: React.HTMLAttributes<HTMLElement>) {
  const pathname = usePathname();

  const routes: { href: string, label: string }[] = [];

  const isActive = (href: string) => {
    if (href === '/') {
      return pathname === '/';
    }
    if (href === '/admin') {
      return pathname.startsWith('/admin');
    }
    return pathname.startsWith(href);
  };

  return (
    <nav
      className={cn("flex items-center space-x-4 lg:space-x-6", className)}
      {...props}
    >
      {routes.map((route) => (
        <Link
          key={route.href}
          href={route.href}
          suppressHydrationWarning
          className={cn(
            "text-sm font-medium transition-colors",
            isActive(route.href)
              ? "text-foreground hover:text-primary"
              : "text-primary hover:underline"
          )}
        >
          {route.label}
        </Link>
      ))}
    </nav>
  );
}
