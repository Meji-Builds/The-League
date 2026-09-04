import Link from "next/link";

export default function AdminNotFound() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <p className="font-display font-black text-[6rem] leading-none text-white/5 select-none">
        404
      </p>

      <div className="-mt-4 mb-8">
        <h1 className="text-white font-bold text-lg mb-1">Page not found</h1>
        <p className="text-white/40 text-sm">This admin page doesn&apos;t exist.</p>
      </div>

      <Link
        href="/admin"
        className="bg-gold text-navy font-semibold text-sm px-5 py-2 rounded hover:bg-gold/90 transition-colors"
      >
        Back to overview
      </Link>
    </div>
  );
}
