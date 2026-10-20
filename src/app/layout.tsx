import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Multi-Mode Calculator | Arithmetic, Mortgage & Discount",
  description:
    "Next.js multi-mode calculator with Standard Arithmetic, Mortgage & Loan Estimator, and Discount & Sales Tax modules.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body
        className={`${inter.className} bg-[#020617] text-slate-100 antialiased min-h-screen selection:bg-indigo-500/30 selection:text-indigo-200`}
      >
        {children}
      </body>
    </html>
  );
}
