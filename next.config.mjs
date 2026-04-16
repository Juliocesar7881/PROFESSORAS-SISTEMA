import path from "node:path";
import { fileURLToPath } from "node:url";
import withPWAInit from "next-pwa";
import { withSentryConfig } from "@sentry/nextjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isDev = process.env.NODE_ENV !== "production";

const withPWA = withPWAInit({
	dest: "public",
	disable: isDev,
	register: true,
	skipWaiting: true,
	fallbacks: {
		document: "/offline",
	},
});

const contentSecurityPolicy = [
	"default-src 'self'",
	"script-src 'self' 'unsafe-inline'",
	"style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
	"font-src 'self' https://fonts.gstatic.com data:",
	"img-src 'self' data: blob: https:",
	"connect-src 'self' https://*.supabase.co https://api.stripe.com https://generativelanguage.googleapis.com https://*.ingest.sentry.io",
	"frame-src 'self' https://js.stripe.com https://hooks.stripe.com",
	"object-src 'none'",
	"base-uri 'self'",
	"form-action 'self'",
	"frame-ancestors 'none'",
].join("; ");

const securityHeaders = [
	{ key: "Content-Security-Policy", value: contentSecurityPolicy },
	{ key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
	{ key: "X-Frame-Options", value: "DENY" },
	{ key: "X-Content-Type-Options", value: "nosniff" },
	{ key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
	{ key: "Permissions-Policy", value: "camera=(self), microphone=(), geolocation=()" },
];

const pwaNoCacheHeaders = [
	{ key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
	{ key: "Pragma", value: "no-cache" },
	{ key: "Expires", value: "0" },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
	reactStrictMode: true,
	outputFileTracingRoot: __dirname,
	images: {
		remotePatterns: [
			{
				protocol: "https",
				hostname: "**.supabase.co",
			},
			{
				protocol: "https",
				hostname: "lh3.googleusercontent.com",
			},
		],
	},
	async headers() {
		return [
			{
				source: "/sw.js",
				headers: [...securityHeaders, ...pwaNoCacheHeaders],
			},
			{
				source: "/:path*",
				headers: securityHeaders,
			},
		];
	},
};

export default withSentryConfig(withPWA(nextConfig), {
	silent: true,
	webpack: {
		treeshake: {
			removeDebugLogging: true,
		},
	},
});
