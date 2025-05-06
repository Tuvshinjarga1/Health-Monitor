/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Warning: Байнгын шийдэл биш, зөвхөн түр ашиглана
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Warning: Байнгын шийдэл биш, зөвхөн түр ашиглана
    ignoreBuildErrors: true,
  },
};

module.exports = nextConfig;
