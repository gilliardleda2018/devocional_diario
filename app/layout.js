import "./globals.css";
import RecuperadorChunk from "@/src/components/RecuperadorChunk";

const descricao = "5 minutos com Deus, todos os dias: um versículo, uma reflexão e uma oração para o momento que você está vivendo. Grátis.";

// Endereço público do site, usado para montar os links absolutos da prévia
// (WhatsApp/Instagram/Facebook exigem URL completa da imagem).
const urlSite = process.env.NEXT_PUBLIC_SITE_URL || "https://main.d357ab4gel6chc.amplifyapp.com";

export const metadata = {
  metadataBase: new URL(urlSite),
  title: "Devocional Diário",
  description: descricao,
  openGraph: {
    title: "Devocional Diário — 5 minutos com Deus",
    description: descricao,
    type: "website",
    locale: "pt_BR",
    siteName: "Devocional Diário",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "Devocional Diário — 5 minutos com Deus, todos os dias" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Devocional Diário — 5 minutos com Deus",
    description: descricao,
    images: ["/og.png"],
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen bg-cream-50 font-sans antialiased">
        <RecuperadorChunk />
        {children}
      </body>
    </html>
  );
}
