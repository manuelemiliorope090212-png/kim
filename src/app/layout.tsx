import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { MusicProvider } from "../components/MusicContext";
import GlobalMusicPlayer from "../components/GlobalMusicPlayer";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  themeColor: "#2c1810",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: "☕ Para Kimberly ☕",
  description: "Un rincón aesthetic de amor y creatividad",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} antialiased`}
      >
        <MusicProvider>
          {children}
          <GlobalMusicPlayer />
        </MusicProvider>
      </body>
    </html>
  );
}
