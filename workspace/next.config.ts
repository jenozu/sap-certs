import type { NextConfig } from "next";

// ADR-010 CSP for practice routes. Next inlines bootstrap scripts, hence 'unsafe-inline'
// for scripts until nonces are introduced; WASM needs 'wasm-unsafe-eval'.
export const practiceCsp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval'",
  "worker-src 'self' blob:",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com",
  "img-src 'self' data: blob:",
  "connect-src 'self'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join('; ');

const nextConfig: NextConfig = {
  async headers() {
    return [
      { source: '/practice/:path*', headers: [{ key: 'Content-Security-Policy', value: practiceCsp }] },
      { source: '/practice', headers: [{ key: 'Content-Security-Policy', value: practiceCsp }] },
      { source: '/skills/:path*', headers: [{ key: 'Content-Security-Policy', value: practiceCsp }] },
      { source: '/:path*', headers: [
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        { key: 'X-Frame-Options', value: 'DENY' },
      ] },
    ];
  },
};

export default nextConfig;
