import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import { CartButton } from "@/components/cart/CartButton";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Tienda Mundial 2026 | Fútbol",
  description:
    "Tienda oficial del Mundial 2026: uniformes, botines, balones y merch de tu selección. Compra la equipación de fútbol con envíos a todo el país.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="mx-auto flex h-14 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
            <Link
              href="/"
              className="group inline-flex items-center gap-2 rounded-md font-bold tracking-tight focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              <span
                aria-hidden
                className="grid size-7 place-items-center rounded-full bg-primary text-xs font-black text-primary-foreground"
              >
                26
              </span>
              <span>Tienda Mundial</span>
            </Link>
            <div className="flex items-center gap-4">
              <span className="hidden text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground sm:inline">
                Fútbol · 2026
              </span>
              <CartButton />
            </div>
          </div>
        </header>
        <div className="flex flex-1 flex-col">{children}</div>
      </body>
    </html>
  );
}
