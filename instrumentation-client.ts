// Polyfills for Safari 15 / iOS 16 — runs synchronously before React hydrates.
// Next.js 16 targets Safari 16.4+ by default; runtime APIs still need explicit
// polyfills when the browserslist is lowered to safari 15.

/* eslint-disable @typescript-eslint/no-explicit-any */

const ap = Array.prototype as any;

// ES2023 immutable array methods (landed in Safari 16.0)
if (!ap.toSorted)    ap.toSorted    = function(fn?: any)                    { return [...this].sort(fn); };
if (!ap.toReversed)  ap.toReversed  = function()                            { return [...this].reverse(); };
if (!ap.toSpliced)   ap.toSpliced   = function(s: any, d: any, ...i: any[]) { const c=[...this]; c.splice(s,d,...i); return c; };
if (!ap.with)        ap.with        = function(idx: any, val: any)           { const c=[...this]; c[idx<0?this.length+idx:idx]=val; return c; };

// ES2024 groupBy (landed in Safari 17.4)
if (!(Object as any).groupBy) {
  (Object as any).groupBy = function(items: any, fn: any) {
    const r: any = Object.create(null);
    for (const item of items) { const k=fn(item); (r[k]??=[]).push(item); }
    return r;
  };
}
if (!(Map as any).groupBy) {
  (Map as any).groupBy = function(items: any, fn: any) {
    const r = new Map();
    for (const item of items) { const k=fn(item); if(!r.has(k)) r.set(k,[]); r.get(k).push(item); }
    return r;
  };
}
