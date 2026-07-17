/** @type {import('next').NextConfig} */
// NEXT_PUBLIC_BASE_PATH: set by the pipeline's mockup-preview build (ui_build
// publish_nextjs_build) so the static-shell preview serves under its per-uuid
// prefix on mockups.athenconsult.com — Next's config-level equivalent of
// Angular's --base-href flag. Unset (deploy/dev) → no-op.
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
const nextConfig = {
  output: 'standalone',
  ...(basePath ? { basePath, assetPrefix: basePath } : {}),
};
export default nextConfig;
