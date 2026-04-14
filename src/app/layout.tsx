import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { GoogleRedirectResultHandler } from "@/components/google-redirect-result-handler";
import { PwaRegister } from "@/components/pwa-register";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

/**
 * Evitamos `force-dynamic` no layout raiz: em hospedagens partilhadas isso força SSR em
 * todas as páginas e aumenta 503 em cold start. O middleware já envia no-cache nas rotas
 * relevantes; páginas sensíveis podem exportar `dynamic` localmente se precisar.
 */

export const metadata: Metadata = {
  title: "Sol do Recreio — Acesso",
  description: "Login e cadastro",
  applicationName: "Sol do Recreio",
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  appleWebApp: {
    capable: true,
    title: "Sol do Recreio",
    statusBarStyle: "default",
  },
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
        <PwaRegister />
        <GoogleRedirectResultHandler />
        {children}
      </body>
    </html>
  );
}
