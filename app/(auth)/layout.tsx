import Link from "next/link";
import { ThemeStyle } from "@/components/ThemeStyle";

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-navy flex flex-col">
      <ThemeStyle />
      <div className="px-6 py-5">
        <Link href="/" className="text-gold font-bold tracking-widest uppercase text-sm">
          The League
        </Link>
      </div>
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        {children}
      </div>
    </div>
  );
}
