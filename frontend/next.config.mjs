/** @type {import('next').NextConfig} */
const isDev = process.env.NODE_ENV === "development";

// Префиксы API бэкенда — в dev проксируются на FastAPI (:8000),
// в проде фронт раздаётся тем же FastAPI, поэтому пути относительные.
const API_PREFIXES = [
  "auth",
  "profile",
  "products",
  "dishes",
  "diary",
  "fridge",
  "receipts",
  "recommendations",
  "health",
];

const backend = process.env.BACKEND_URL || "http://localhost:8000";

const nextConfig = {
  // Прод: статический экспорт в out/, который раздаёт FastAPI.
  output: isDev ? undefined : "export",
  trailingSlash: true,
  images: { unoptimized: true },
  ...(isDev
    ? {
        async rewrites() {
          return API_PREFIXES.map((p) => ({
            source: `/${p}/:path*`,
            destination: `${backend}/${p}/:path*`,
          })).concat(
            API_PREFIXES.map((p) => ({
              source: `/${p}`,
              destination: `${backend}/${p}`,
            })),
          );
        },
      }
    : {}),
};

export default nextConfig;
