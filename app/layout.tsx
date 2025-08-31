import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "STEPTIONS - Options Protocol on Stellar",
  description: "The first comprehensive options trading protocol on Stellar blockchain. Advanced DeFi strategies with gasless transactions.",
  icons: {
    icon: [
      { url: '/favicon.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon.png', sizes: '16x16', type: 'image/png' },
    ],
    shortcut: '/favicon.png',
    apple: '/favicon.png',
  },
};

export default function RootLayout({
                                     children,
                                   }: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
    <body className="font-sans antialiased">
    {children}
    </body>
    </html>
  );
}