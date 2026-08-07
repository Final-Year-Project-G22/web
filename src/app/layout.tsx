import type { Metadata } from "next";
import { Inter, JetBrains_Mono, Noto_Sans_Ethiopic, Sora } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import { AuthHydrator } from "@/components/auth/auth-hydrator";
import { QueryProvider } from "@/components/providers/query-provider";
import { ThemeProvider } from "@/components/providers/theme-provider";

// Locked type stack (§10.2): Sora display / Inter body / JetBrains Mono data,
// every stack ending in Noto Sans Ethiopic — Amharic must never hit a fallback gap.
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const sora = Sora({
  variable: "--font-sora",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  display: "swap",
});

const notoSansEthiopic = Noto_Sans_Ethiopic({
  variable: "--font-noto-sans-ethiopic",
  subsets: ["ethiopic", "latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Adisu Serategna Admin Panel",
  description: "Secure Admin Management Portal",
  icons: {
    icon: "/icon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${sora.variable} ${jetbrainsMono.variable} ${notoSansEthiopic.variable} antialiased`}
        suppressHydrationWarning
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <QueryProvider>
            <AuthHydrator>{children}</AuthHydrator>
            <Toaster position="bottom-right" />
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
