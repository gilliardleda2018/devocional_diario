import { criarClienteSupabaseServidor } from "@/src/lib/supabase/server";
import DevocionalApp from "@/src/components/DevocionalApp";
import PaginaEntrada from "@/src/components/PaginaEntrada";
import { obterVersiculoDoDia } from "@/src/lib/devocional/datasComemorativas";
import { buscarTextoReferencia } from "@/src/lib/biblia/getBibleApi";
import { hojeNoBrasil } from "@/src/lib/util/data";

export default async function PaginaInicial() {
  const supabase = criarClienteSupabaseServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    return <DevocionalApp usuario={user} />;
  }

  // Visitante sem conta: em vez de mandar direto pro login, mostra a Palavra
  // do dia e deixa fazer o devocional (ver PaginaEntrada). O texto já vem
  // pronto do servidor, então aparece sem "Carregando...".
  const hoje = hojeNoBrasil();
  const versiculoDoDia = obterVersiculoDoDia(hoje);
  let textoDoDia = null;
  try {
    textoDoDia = await buscarTextoReferencia(versiculoDoDia.ref);
  } catch {}

  return (
    <PaginaEntrada
      versiculoDoDia={{ label: versiculoDoDia.label }}
      textoDoDia={textoDoDia}
      rotuloData={hoje.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })}
    />
  );
}
