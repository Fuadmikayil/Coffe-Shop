// next.config.mjs
/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
      domains: [
        // buraya öz Supabase layihə ürəyini yaz:
        'upgddooonnxtfxxwjvcv.supabase.co'
      ],
      // Əgər istəsən, remotePatterns ilə də daha esnek qura bilərsən:
      // remotePatterns: [
      //   {
      //     protocol: 'https',
      //     hostname: '**.supabase.co',
      //     port: '',
      //     pathname: '/storage/v1/object/public/coffee-images/**'
      //   },
      // ],
    },
    // istəsən digər Next.js config-ləri də bura əlavə elə
  }
  
  export default nextConfig
  