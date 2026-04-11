import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { GoogleRedirectResultHandler } from "@/components/google-redirect-result-handler";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

// Evita HTML estático antigo em CDN apontando para chunks/CSS de builds anteriores.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Sol do Recreio — Acesso",
  description: "Login e cadastro",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#fbc02d",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={`${inter.className} ${inter.variable}`}>
        <GoogleRedirectResultHandler />
        {children}
      </body>
    </html>
  );
}
