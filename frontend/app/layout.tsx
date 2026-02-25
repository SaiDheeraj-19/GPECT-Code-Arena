import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "../components/ThemeProvider";
import AuthInitializer from "../components/AuthInitializer";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
    title: "GPCET Coding Platform",
    description: "Advanced coding and assessment platform for GPCET",
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body className={inter.className}>
                <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
                    <AuthInitializer />
                    <div className="bg-noise" />
                    {children}
                </ThemeProvider>
            </body>
        </html>
    );
}
