/** @type {import('next').NextConfig} */
const apiOrigin = process.env.NEXT_PUBLIC_API_URL ?? "https://api.chordially.local"
let apiConnectSrc = apiOrigin
try {
  apiConnectSrc = new URL(apiOrigin).origin
} catch {
  // keep raw value as fallback
}

const contentSecurityPolicy = [
  "default-src 'self'",
  "base-uri 'self'",
  "frame-ancestors 'none'",
  "form-action 'self'",
  "img-src 'self' data: blob: https://*.s3.amazonaws.com https://s3.amazonaws.com",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  "style-src 'self' 'unsafe-inline'",
  `connect-src 'self' ${apiConnectSrc} https://*.s3.amazonaws.com https://s3.amazonaws.com`,
  "font-src 'self' data:",
  "object-src 'none'",
].join("; ")

const nextConfig = {
  poweredByHeader: false,
  transpilePackages: ["@chordially/shared"],
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: contentSecurityPolicy },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), payment=()",
          },
        ],
      },
    ]
  },
  webpack: (config) => {
    // @chordially/shared uses NodeNext-style ".js" specifiers that point at
    // ".ts" source files; teach webpack to resolve those for the workspace
    // package since it isn't pre-compiled to dist.
    config.resolve.extensionAlias = {
      ...config.resolve.extensionAlias,
      ".js": [".ts", ".tsx", ".js"],
    }
    return config
  },
}

export default nextConfig
