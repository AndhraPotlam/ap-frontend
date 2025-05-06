'use client';

import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";

export default function AuthSkeleton() {
  return (
    <div className="container mx-auto flex items-center justify-center min-h-screen p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64 mt-2" />
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-10 w-full" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-10 w-full" />
              </div>
            </div>
            <Skeleton className="h-10 w-full" />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <Skeleton className="h-4 w-32" />
          <div className="text-center space-y-2 w-full">
            <Skeleton className="h-4 w-48 mx-auto" />
            <Skeleton className="h-10 w-32 mx-auto" />
          </div>
        </CardFooter>
      </Card>
    </div>
  );
} 