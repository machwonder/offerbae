
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export function AdminNav({
  className,
  ...props
}: React.HTMLAttributes<HTMLElement>) {
  const pathname = usePathname();

  const routes = [
    { href: "/admin/partnerships", label: "Partnerships" },
    { href: "/admin/products", label: "Products" },
    { href: "/admin/links", label: "Links" },
    { href: "/admin/categories", label: "Categories" },
    { href: "/admin/terms", label: "Terms" },
    { href: "/", label: "Storefront" },
  ];

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
            "text-sm font-medium transition-colors hover:text-primary",
            (pathname === route.href || (pathname === '/admin' && route.href === '/admin/partnerships') || (pathname.startsWith('/admin/products') && route.href === '/admin/products'))
              ? "text-foreground"
              : "text-muted-foreground"
          )}
        >
          {route.label}
        </Link>
      ))}
    </nav>
  );
}
