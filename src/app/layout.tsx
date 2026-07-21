/*
 Root Layout
 Provides the top-level HTML layout and global styles for the app. Loads the
 Inter font and exposes metadata used by Next.js.
*/
import "./globals.css";
import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "StarScream",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
