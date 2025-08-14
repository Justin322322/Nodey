import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
	reactStrictMode: true,
	eslint: {
		ignoreDuringBuilds: true,
	},
	compiler: {
		removeConsole: process.env.NODE_ENV === 'production',
	},
	experimental: {
		optimizePackageImports: [
			'lucide-react',
			'@radix-ui/react-dialog',
			'@radix-ui/react-label',
			'@radix-ui/react-select',
			'@radix-ui/react-slot',
		],
	},
	images: {
		formats: ['image/webp', 'image/avif'],
	},
}

export default nextConfig
