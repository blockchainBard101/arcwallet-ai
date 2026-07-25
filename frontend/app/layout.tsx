import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AppContextProvider } from "./context/AppContext";
import AppLayoutShell from "./components/AppLayoutShell";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "BlockGENT | Premium AI Agent Stack",
  description: "Autonomous Personal Wallet Agents and analytics platform built on Arc blockchain & Circle Agent Stack.",
  icons: {
    icon: "/blockgent.png",
    shortcut: "/blockgent.png",
    apple: "/blockgent.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
    >
      <body className="min-h-full bg-background text-slate-100 flex flex-col">
        <AppContextProvider>
          <AppLayoutShell>{children}</AppLayoutShell>
        </AppContextProvider>
      </body>
    </html>
  );
}
