import { criarClienteSupabaseServidor } from "@/src/lib/supabase/server";
import { obterVersiculoDoDia } from "@/src/lib/devocional/datasComemorativas";
import { buscarTextoReferencia } from "@/src/lib/biblia/getBibleApi";
import { hojeNoBrasil } from "@/src/lib/util/data";
import ConviteConteudo from "./ConviteConteudo";

/**
 * Página pública de convite (/convite/CODIGO). É para onde leva o link de
 * quem compartilha a Palavra do dia (CompartilharPalavra) ou manda convite
 * pela área de Amigos. Mostra quem convidou, a Palavra de hoje e o botão de
 * cadastro; o código fica guardado até a conta ser criada, e aí os dois
 * viram amigos (DevocionalApp -> resgatar_convite).
 *
 * Montada no servidor para o texto já vir pronto e para a prévia do link
 * no WhatsApp mostrar "Fulano compartilhou a Palavra de hoje com você".
 */

async function obterNomeConvidador(codigo) {
  if (!codigo) return null;
  try {
    const supabase = criarClienteSupabaseServidor();
    const { data } = await supabase.rpc("obter_convite_info", { p_codigo: codigo });
    const linha = Array.isArray(data) ? data[0] : data;
    return linha?.nome_exibicao || null;
  } catch {
    return null;
  }
}

function primeiroNome(nome) {
  const primeiro = (nome || "").trim().split(/\s+/)[0];
  return primeiro ? primeiro.charAt(0).toUpperCase() + primeiro.slice(1) : null;
}

export async function generateMetadata({ params }) {
  const codigo = decodeURIComponent(params.codigo || "").trim();
  const nome = primeiroNome(await obterNomeConvidador(codigo));
  const titulo = nome ? `${nome} compartilhou a Palavra de hoje com você` : "A Palavra de hoje para você";
  const descricao = "Faça seu devocional de hoje no Devocional Diário: 5 minutos, grátis, com áudio.";
  return {
    title: titulo,
    description: descricao,
    openGraph: { title: titulo, description: descricao },
    twitter: { title: titulo, description: descricao },
  };
}

export default async function PaginaConvite({ params }) {
  const codigo = decodeURIComponent(params.codigo || "").trim();
  const hoje = hojeNoBrasil();
  const versiculo = obterVersiculoDoDia(hoje);

  const [nomeConvidador, textoDoDia] = await Promise.all([
    obterNomeConvidador(codigo),
    buscarTextoReferencia(versiculo.ref).catch(() => null),
  ]);

  return (
    <ConviteConteudo
      codigo={codigo}
      nomeConvidador={nomeConvidador}
      textoDoDia={textoDoDia}
      referencia={versiculo.label}
    />
  );
}
