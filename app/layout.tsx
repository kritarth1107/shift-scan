import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["500", "600"],
});

export const metadata: Metadata = {
  title: "ShiftScan",
  description: "Scan carton barcodes and see owner + contents instantly",
  manifest: "/manifest.json",
  icons: {
    icon: "/icon.svg",
    apple: "/icon.svg",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "ShiftScan",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#09080d",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} ${spaceGrotesk.variable} font-sans bg-app text-zinc-200 antialiased`}>
        {children}
        <Toaster
          position="top-center"
          richColors
          toastOptions={{
            className: "font-sans !rounded-2xl",
            style: { marginTop: "env(safe-area-inset-top)" },
          }}
        />
      </body>
    </html>
  );
}