/** @type {import('next').NextConfig} */
const nextConfig = {
  // Static HTML export → packaged directly into the extension.
  output: "export",
  distDir: "out",
  // Extension pages load from moz-extension://<id>/ ; relative asset paths keep
  // _next/ chunks resolvable regardless of the page path.
  assetPrefix: ".",
  images: { unoptimized: true },
  reactStrictMode: true,
  // Extensions can't use the Next.js Image optimizer or server runtime.
  trailingSlash: false,
};

export default nextConfig;
