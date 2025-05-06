'use client';
import { Separator } from "@/components/ui/separator";
import { Facebook, Youtube } from "lucide-react";
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t">
      <div className="container flex flex-col md:flex-row mx-auto md:justify-between items-start md:items-center px-4 py-6">

        <div className="space-y-3">
          <h3 className="font-semibold">Contact</h3>
          <ul className="space-y-2">
            <li className="text-sm text-muted-foreground">Email: andhrapotlam+support@gmail.com</li>
            <li className="text-sm text-muted-foreground">Phone: +91 123-456-7890</li>
          </ul>
        </div>

        <div className="space-y-3 mt-2">
          <h3 className="font-semibold">Follow Us</h3>
          <div className="flex space-x-2  flex-row" >
            <Link href="https://www.facebook.com/andhrapotlam">
              <Facebook className="w-6 h-6" />
            </Link>
            <Link href="https://www.youtube.com/andhrapotlam">
              <Youtube className="w-6 h-6" />
            </Link>
          </div>
        </div>

      </div>

      <div className="text-center text-sm text-muted-foreground mb-8">
          © {new Date().getFullYear()} Andhra Potlam. All rights reserved.
        </div>
    </footer>
  );
}