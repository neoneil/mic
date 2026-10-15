import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MIC Invoice Importer",
  description: "Import text-based Xero invoice PDFs",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
