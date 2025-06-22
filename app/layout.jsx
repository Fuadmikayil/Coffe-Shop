import "./globals.css";
import supabase from "../lib/supabase"; // Supabase client üçün yolu düzgün qeyd edin

// Metadata obyektini asinxron funksiya ilə əvəz edirik
export async function generateMetadata() {
  // Supabase Storage-dən logonun URL-ni götürürük
  // Bura öz bucket və fayl adınızı yazın
  const { data } = supabase
    .storage
    .from('coffee-images') // Sizin bucket adınız
    .getPublicUrl('LogoCoffe.svg'); // Sizin logo faylınızın adı

  const logoUrl = data?.publicUrl;

  return {
    title: "Coffee Shop",
    description: "Coffee shop application",
    icons: {
      icon: logoUrl || '/favicon.ico', // Əgər logo tapılmasa, standart icon istifadə olunacaq
    },
  };
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}