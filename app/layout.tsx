import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BrewCart | Better Deals. Better Mornings.",
  description: "A mobile-first marketplace for coffee gear and everyday deals."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
