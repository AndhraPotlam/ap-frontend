import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { CartProvider } from '@/context/CartContext';
import { Toaster } from '@/components/ui/sonner';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Skeleton } from "@/components/ui/skeleton";

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Andhra Potlam',
  description: 'Your one-stop shop for traditional Andhra products',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" data-theme="cupcake">
      <body className={`${inter.className} min-h-screen flex flex-col text-base-content bg-base-100`}>
        <AuthProvider>
          <CartProvider>
            <div className="fixed top-0 left-0 right-0 z-50">
              <Skeleton className="h-0.5 w-full animate-pulse" />
            </div>
            <Navbar />
            <main className="flex-grow">
              {children}
            </main>
            <Footer />
            <Toaster />
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}