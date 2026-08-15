import type { NextConfig } from "next"
import createMDX from "@next/mdx"

const nextConfig: NextConfig = {
  output: "export",
  pageExtensions: ["js", "jsx", "md", "mdx", "ts", "tsx"],
  trailingSlash: true,
  basePath: process.env.GITHUB_ACTIONS ? "/aq-ui" : "",
  assetPrefix: process.env.GITHUB_ACTIONS ? "/aq-ui" : undefined,
  transpilePackages: ["@aq-ui/registry"],
  images: {
    unoptimized: true,
  },
}

const withMDX = createMDX({ extension: /\.(md|mdx)$/ })

export default withMDX(nextConfig)
