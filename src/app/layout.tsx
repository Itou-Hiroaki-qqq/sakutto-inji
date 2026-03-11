import type { Metadata } from "next";
import { Noto_Sans_JP } from "next/font/google";
import { DeviceGate } from "@/components/DeviceGate";
import "./globals.css";

const notoSansJP = Noto_Sans_JP({
  subsets: ["latin"],
  variable: "--font-noto-sans-jp",
});

export const metadata: Metadata = {
  title: "さくっと印字",
  description: "記入用紙をスキャンして、テキスト配置を指定し、ブランクの実物用紙に直接印字できるWebアプリ",
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className={`${notoSansJP.variable} font-sans antialiased`}>
        <DeviceGate>
          {children}
        </DeviceGate>
      </body>
    </html>
  );
}
