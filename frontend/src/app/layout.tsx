import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "NSIP — Non-Systematic Investment Plan",
  description: "Compare Buy the Dip strategy against regular SIP",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-[#080c14] text-slate-200 antialiased`}>
        {children}
      </body>
    </html>
  );
}
