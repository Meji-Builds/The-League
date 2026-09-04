import Link from "next/link";

export default function PublicNotFound() {
  return (
    <div className="flex flex-col items-center justify-center px-4 py-32 text-center">
      <p className="font-display font-black text-[7rem] leading-none text-white/5 select-none">
        404
      </p>

      <div className="-mt-6 mb-8">
        <h1 className="text-white font-bold text-xl mb-2">Page not found</h1>
        <p className="text-white/40 text-sm max-w-xs">
          This page doesn&apos;t exist or may have been moved.
        </p>
      </div>

      <div className="flex gap-3">
        <Link
          href="/"
          className="bg-gold text-navy font-semibold text-sm px-5 py-2.5 rounded hover:bg-gold/90 transition-colors"
        >
          Go home
        </Link>
        <Link
          href="/fixtures"
          className="border border-white/15 text-white/70 font-semibold text-sm px-5 py-2.5 rounded hover:text-white hover:border-white/30 transition-colors"
        >
          View fixtures
        </Link>
      </div>
    </div>
  );
}
