import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MIC Operations Control",
  description: "Track invoice jobs from intake to courier collection",
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
