"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const PAGES: { href: string; label: string }[] = [
  { href: "/", label: "Players" },
];

export function AppNav() {
  const pathname = usePathname();

  return (
    <nav className="border-b border-slate-200 bg-white">
      <div className="container mx-auto flex flex-wrap items-center gap-1 px-4 py-2">
        {PAGES.map(({ href, label }) => {
          const isActive = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              aria-current={isActive ? "page" : undefined}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? "bg-indigo-600 text-white"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              {label}
            </Link>
          );
        })}
        <a
          href="https://buymeacoffee.com/jcorum"
          target="_blank"
          rel="noopener noreferrer"
          className="ml-auto px-3 py-1 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100"
        >
          ☕ Buy me a coffee
        </a>
      </div>
    </nav>
  );
}
