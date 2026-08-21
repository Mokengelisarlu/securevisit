import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    "/**": ["./db/tenants/migrations/**/*"],
  },
};

export default nextConfig;
