import "./globals.css";

export const metadata = {
  title: "Devocional Diário",
  description: "Um versículo por dia e um devocional guiado para o seu momento.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen bg-cream-50 font-sans antialiased">{children}</body>
    </html>
  );
}
