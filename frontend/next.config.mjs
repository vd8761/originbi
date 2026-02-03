import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

/**
 * Helper to load env vars from .env.local manually if not present
 * (Useful during build if Next.js hasn't fully loaded envs for the config yet)
 */
function loadEnvLocal() {
  try {
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    const envPath = path.resolve(__dirname, '.env.local');
    if (fs.existsSync(envPath)) {
      const envFile = fs.readFileSync(envPath, 'utf8');
      envFile.split('\n').forEach(line => {
        const [key, ...values] = line.split('=');
        if (key && values.length > 0 && !process.env[key.trim()]) {
          const val = values.join('=').trim().replace(/^["']|["']$/g, ''); // simple unquote
          process.env[key.trim()] = val;
        }
      });
    }
  } catch (e) {
    console.warn('Failed to manually load .env.local', e);
  }
}

// Attempt load
loadEnvLocal();

const corporateUrl = process.env.NEXT_PUBLIC_CORPORATE_API_URL;

/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    if (!corporateUrl) {
      console.warn('⚠️  WARNING: NEXT_PUBLIC_CORPORATE_API_URL is missing. The /api/proxy/corporate route will NOT work.');
      return [];
    }
    return [
      {
        source: '/api/proxy/corporate/:path*',
        destination: `${corporateUrl}/:path*`,
      },
    ];
  },
  webpack: (config, { isServer }) => {
    // Add alias resolution to ensure Vercel recognizes @ path aliases
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.resolve(path.dirname(fileURLToPath(import.meta.url))),
    };
    return config;
  },
};

export default nextConfig;