/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async headers() {
    // As páginas (HTML) não podem ficar em cache por muito tempo no CDN --
    // o Next.js manda "s-maxage=31536000" por padrão em páginas estáticas,
    // pensado pra infra da Vercel (que invalida esse cache sozinha a cada
    // deploy). Na AWS Amplify/CloudFront essa invalidação não é garantida,
    // então um HTML antigo em cache pode referenciar arquivos JS com hash
    // de um build anterior -- arquivos que já não existem mais depois do
    // deploy seguinte, causando "Application error: a client-side exception"
    // pra quem receber essa cópia velha. Os arquivos em /_next/static/ têm
    // hash no nome e continuam podendo ser cacheados para sempre (isso é
    // seguro e não é afetado por esta regra, que só vale pra rotas de página).
    return [
      {
        source: "/((?!_next/static|_next/image).*)",
        headers: [
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
