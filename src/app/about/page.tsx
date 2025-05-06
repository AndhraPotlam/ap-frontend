import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function AboutPage() {
  return (
    <main className="container mx-auto py-12 space-y-8">
      <h1 className="text-4xl font-bold text-center">About Us</h1>

      <Card>
        <CardHeader>
          <CardTitle>Our Mission</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>
            At Andhra Potlam, our mission is to bring the rich and authentic flavors of Andhra Pradesh directly to your table. We believe in preserving traditional recipes passed down through generations and sharing them with food enthusiasts across the world.
          </p>
          <p>
            We source our ingredients from trusted local farmers and artisans, ensuring every spice, herb, and key element is fresh, high-quality, and sustainably produced.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Our Process</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <ul className="list-disc list-inside space-y-2">
            <li>Handpicking the finest local ingredients</li>
            <li>Using traditional stone-grinding and slow-roasting methods</li>
            <li>Blending recipes perfected over generations</li>
            <li>Maintaining strict quality and hygiene standards</li>
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Why Choose Us?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>
            Our promise is authenticity in every bite. With Andhra Potlam, you experience the true essence of Andhra cuisine, delivered fresh and ready to savor.
          </p>
          <Link href="/">
            <Button>Shop Our Products</Button>
          </Link>
        </CardContent>
      </Card>
    </main>
  );
} 