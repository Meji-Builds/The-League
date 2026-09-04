import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-navy flex flex-col items-center justify-center px-4 text-center">
      <Link href="/" className="text-gold font-bold tracking-widest uppercase text-sm mb-16 block">
        The League
      </Link>

      <p className="font-display font-black text-[8rem] leading-none text-white/5 select-none">
        404
      </p>

      <div className="-mt-8 mb-8">
        <h1 className="text-white font-bold text-xl mb-2">Page not found</h1>
        <p className="text-white/40 text-sm max-w-xs">
          This page doesn&apos;t exist or may have been moved.
        </p>
      </div>

      <Link
        href="/"
        className="inline-flex items-center gap-2 bg-gold text-navy font-semibold text-sm px-5 py-2.5 rounded hover:bg-gold/90 transition-colors"
      >
        Go home
      </Link>
    </div>
  );
}
