import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
// Self-hosted, so builds never depend on a font CDN.
import "@fontsource/eb-garamond/400.css";
import "@fontsource/eb-garamond/400-italic.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "Your skin report · Lumeria",
  description: "A month of your skin, in one calm read.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#fbf9f4",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={GeistSans.variable}>
      <body>{children}</body>
    </html>
  );
}
