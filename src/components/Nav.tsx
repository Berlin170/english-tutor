"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "Dashboard", emoji: "🏠" },
  { href: "/tenses", label: "Tenses", emoji: "📖" },
  { href: "/story", label: "Stories", emoji: "📚" },
  { href: "/call", label: "Live Call", emoji: "🎙️" },
  { href: "/chat", label: "Chat", emoji: "💬" },
  { href: "/grammar", label: "Grammar Check", emoji: "✍️" },
  { href: "/progress", label: "Progress", emoji: "📈" },
];

export default function Nav() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-30 border-b border-card-border bg-card/80 backdrop-blur">
      <nav className="mx-auto flex max-w-6xl flex-wrap items-center gap-1 px-4 py-3">
        <Link href="/" className="mr-4 flex items-center gap-2 font-bold">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-accent text-white">
            S
          </span>
          <span className="hidden sm:inline">Speak English with Sara</span>
          <span className="sm:hidden">Sara</span>
        </Link>

        {LINKS.map((link) => {
          const active =
            link.href === "/"
              ? pathname === "/"
              : pathname.startsWith(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                active
                  ? "bg-accent-soft text-accent"
                  : "text-muted hover:bg-accent-soft hover:text-foreground"
              }`}
            >
              <span aria-hidden>{link.emoji}</span>{" "}
              <span className="hidden md:inline">{link.label}</span>
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
