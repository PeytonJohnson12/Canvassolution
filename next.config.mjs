/** @type {import('next').NextConfig} */
const nextConfig = {
  // No ESLint config in this MVP; don't block builds on it. TS errors still fail the build.
  eslint: { ignoreDuringBuilds: true },
};

export default nextConfig;
