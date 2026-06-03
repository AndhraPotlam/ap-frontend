'use client';
import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function NewExpenseRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Redirect /new to /create while preserving query params
    const params = searchParams.toString();
    const redirectUrl = params ? `/dashboard/expenses/create?${params}` : '/dashboard/expenses/create';
    router.replace(redirectUrl);
  }, [router, searchParams]);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center">Redirecting...</div>
    </div>
  );
}


