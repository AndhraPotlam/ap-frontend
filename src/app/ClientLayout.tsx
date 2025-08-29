'use client';
import { CartProvider } from '@/context/CartContext';
import { Toaster } from '@/components/ui/sonner';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Skeleton } from "@/components/ui/skeleton";

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
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
  );
} 