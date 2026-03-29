import type { Metadata, Viewport } from "next"
import { Geist, Geist_Mono, Montserrat } from "next/font/google"
import "./globals.css"
import { SwRegister } from "@/components/shared/sw-register"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  style: ["normal", "italic"],
})

export const metadata: Metadata = {
  title: {
    template: "%s | Perilab",
    default: "Perilab — de perito para perito",
  },
  description: "Plataforma de gestão pericial para peritos judiciais brasileiros",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Perilab",
  },
  icons: {
    icon: "/logo-icon.svg",
    apple: "/logo-icon.svg",
  },
}

export const viewport: Viewport = {
  themeColor: "#84cc16",
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} ${montserrat.variable} antialiased`}>
        {children}
        <SwRegister />
      </body>
    </html>
  )
}
