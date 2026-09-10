import type { Metadata } from "next";
import { Tajawal } from "next/font/google";
import { Toaster } from "react-hot-toast";
import PwaManager from "@/components/pwa/PwaManager";
import "./globals.css";

const tajawal = Tajawal({
  subsets: ["arabic"],
  weight: ["300", "400", "500", "700", "800"],
  variable: "--font-tajawal",
});

export const metadata: Metadata = {
  title: "EPS DZ PRO — منصة أستاذ التربية البدنية",
  description:
    "منصة رقمية متكاملة لأساتذة التربية البدنية والرياضية في الطور الابتدائي بالجزائر",
  manifest: "/manifest.json",
};

export const viewport = {
  themeColor: "#158455",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl" className={tajawal.variable}>
      <body className="font-sans">
        <PwaManager />
        {children}
        <Toaster
          position="top-center"
          toastOptions={{
            style: { fontFamily: "var(--font-tajawal)", direction: "rtl" },
          }}
        />
      </body>
    </html>
  );
}
