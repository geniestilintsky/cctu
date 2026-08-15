/** @type {import('next').NextConfig} */

const isProd = process.env.NODE_ENV === 'production';

// Every <Image> in the app points at /cctu-crest.png, so no remote host needs to
// be allowed. The previous `hostname: '**'` let anyone make this server fetch
// and re-encode arbitrary images (advisory GHSA-9g9p-9gw9-jx7f). If material
// thumbnails are ever served from R2, that one host is added automatically.
const r2Host = process.env.R2_PUBLIC_BASE_URL
  ? [{ protocol: 'https', hostname: new URL(process.env.R2_PUBLIC_BASE_URL).hostname }]
  : [];

// 'unsafe-inline' stays on script-src because the App Router injects inline
// hydration scripts; removing it needs a nonce on every one. 'unsafe-eval' is
// dev-only — React Refresh needs it, production does not.
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isProd ? '' : " 'unsafe-eval'"}`,
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' data: blob:${process.env.R2_PUBLIC_BASE_URL ? ' ' + process.env.R2_PUBLIC_BASE_URL : ''}`,
  "font-src 'self' data:",
  "connect-src 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "object-src 'none'",
].join('; ');

const securityHeaders = [
  { key: 'Content-Security-Policy', value: csp },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=()' },
  { key: 'X-DNS-Prefetch-Control', value: 'off' },
];

if (isProd) {
  securityHeaders.push({
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  });
}

const nextConfig = {
  reactStrictMode: true,
  // Do not leak the framework version in response headers.
  poweredByHeader: false,
  images: {
    remotePatterns: r2Host,
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '25mb',
    },
    // Runs instrumentation.ts at server boot — see lib/env-guard.ts.
    instrumentationHook: true,
  },
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }];
  },
};

export default nextConfig;
