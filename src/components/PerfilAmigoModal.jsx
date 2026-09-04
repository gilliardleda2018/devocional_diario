"use client";

import { useState, useEffect } from "react";
import AvatarUsuario from "@/src/components/AvatarUsuario";
import { obterNivel } from "@/src/lib/devocional/niveis";
import { criarClienteSupabase } from "@/src/lib/supabase/client";

export default function PerfilAmigoModal({
  aberto,
  aoFechar,
  amigo,
  usuarioAtualId,
  meusAmigos = [],
  aoAdicionar,
  aoTorcer,
}) {
  const [detalhes, setDetalhes] = useState(null);
  const [carregando, setCarregando] = useState(false);
  const [adicionando, setAdicionando] = useState(false);
  const [torcendo, setTorcendo] = useState(false);
  const [mensagem, setMensagem] = useState(null);

  const amigoId = amigo?.usuario_id || amigo?.amigo_id || amigo?.id;
  const ehProprioUsuario = usuarioAtualId && amigoId === usuarioAtualId;
  const ehAmigo = meusAmigos.some(
    (a) => a.amigo_id === amigoId || a.id === amigoId || a.usuario_id === amigoId
  );

  useEffect(() => {
    if (!aberto || !amigoId) return;

    async function carregarDetalhes() {
      setCarregando(true);
      setMensagem(null);
      try {
        const supabase = criarClienteSupabase();
        // Busca dados de perfil + estatísticas de ofensiva e XP
        const [{ data: profile }, { data: stats }, { data: ofensiva }] = await Promise.all([
          supabase.from("profiles").select("*").eq("id", amigoId).maybeSingle(),
          supabase.from("estatisticas_usuario").select("*").eq("usuario_id", amigoId).maybeSingle(),
          supabase.from("ofensivas").select("*").eq("usuario_id", amigoId).maybeSingle(),
        ]);

        setDetalhes({
          nome_exibicao: profile?.nome_exibicao || amigo?.nome_exibicao || "Usuário",
          foto_url: profile?.foto_url || amigo?.foto_url || null,
          codigo_amigo: profile?.codigo_amigo || amigo?.codigo_amigo || null,
          xp_total: stats?.xp_total || amigo?.xp_total || 0,
          devocionais_concluidos: stats?.devocionais_concluidos || amigo?.devocionais_concluidos || 0,
          ofensiva_atual: ofensiva?.ofensiva_atual || amigo?.ofensiva_atual || 0,
          maior_ofensiva: ofensiva?.maior_ofensiva || amigo?.maior_ofensiva || 0,
        });
      } catch (err) {
        console.error("Erro ao carregar perfil do amigo:", err);
      } finally {
        setCarregando(false);
      }
    }

    carregarDetalhes();
  }, [aberto, amigoId, amigo]);

  if (!aberto || !amigo) return null;

  const perfilExibicao = detalhes || amigo;
  const nivel = obterNivel(perfilExibicao?.xp_total || 0);

  async function handleAdicionar() {
    if (!aoAdicionar || !perfilExibicao?.codigo_amigo) return;
    setAdicionando(true);
    setMensagem(null);
    try {
      const res = await aoAdicionar(perfilExibicao.codigo_amigo);
      if (res?.sucesso) {
        setMensagem({ tipo: "sucesso", texto: "Amigo adicionado com sucesso! 🎉" });
      } else {
        setMensagem({ tipo: "erro", texto: res?.erro || "Não foi possível adicionar." });
      }
    } catch (e) {
      setMensagem({ tipo: "erro", texto: "Erro ao adicionar amigo." });
    } finally {
      setAdicionando(false);
    }
  }

  async function handleTorcer() {
    if (!aoTorcer || !amigoId) return;
    setTorcendo(true);
    setMensagem(null);
    try {
      const res = await aoTorcer(amigoId);
      if (res?.sucesso) {
        setMensagem({ tipo: "sucesso", texto: "Torcida enviada! 🔥" });
      } else {
        setMensagem({ tipo: "erro", texto: res?.erro || "Você já enviou uma torcida hoje!" });
      }
    } catch (e) {
      setMensagem({ tipo: "erro", texto: "Erro ao enviar torcida." });
    } finally {
      setTorcendo(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-5 border border-slate-200 dark:border-slate-800 animate-scaleUp text-center relative overflow-hidden">
        {/* Botão de Fechar */}
        <button
          onClick={aoFechar}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-lg font-bold p-1"
        >
          ✕
        </button>

        {/* Top Header Card */}
        <div className="flex flex-col items-center pt-2 space-y-2">
          <AvatarUsuario
            nome={perfilExibicao.nome_exibicao}
            fotoUrl={perfilExibicao.foto_url}
            tamanho={64}
            className="ring-4 ring-amber-500/20 shadow-md"
          />
          <div>
            <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100">
              {perfilExibicao.nome_exibicao}
            </h3>
            <span className="inline-block px-3 py-0.5 mt-1 text-xs font-bold rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
              {nivel.titulo}
            </span>
          </div>
        </div>

        {/* Card de Estatísticas */}
        <div className="grid grid-cols-2 gap-3 bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-2xl border border-slate-200/60 dark:border-slate-700/50">
          <div className="text-center">
            <p className="text-[11px] uppercase tracking-wider font-semibold text-slate-400">
              Ofensiva
            </p>
            <p className="text-base font-bold text-amber-600 dark:text-amber-400 flex items-center justify-center gap-1 mt-0.5">
              🔥 {perfilExibicao.ofensiva_atual ?? 0} <span className="text-xs font-normal text-slate-400">dias</span>
            </p>
          </div>
          <div className="text-center border-l border-slate-200 dark:border-slate-700">
            <p className="text-[11px] uppercase tracking-wider font-semibold text-slate-400">
              XP Acumulado
            </p>
            <p className="text-base font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
              ⚡ {perfilExibicao.xp_total ?? 0} XP
            </p>
          </div>
        </div>

        {/* Mensagens de Feedback */}
        {mensagem && (
          <p
            className={`text-xs p-2.5 rounded-xl font-medium ${
              mensagem.tipo === "sucesso"
                ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                : "bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300"
            }`}
          >
            {mensagem.texto}
          </p>
        )}

        {/* Ações */}
        <div className="space-y-2 pt-1">
          {ehProprioUsuario ? (
            <p className="text-xs text-slate-400 italic">Este é o seu perfil de usuário.</p>
          ) : ehAmigo ? (
            <div className="space-y-2">
              <div className="px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-semibold flex items-center justify-center gap-1.5">
                <span>✓ Vocês são amigos</span>
              </div>
              <button
                onClick={handleTorcer}
                disabled={torcendo}
                className="w-full py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-md transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                <span>🔥</span> {torcendo ? "Enviando..." : "Mandar Torcida"}
              </button>
            </div>
          ) : (
            <button
              onClick={handleAdicionar}
              disabled={adicionando}
              className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-1.5"
            >
              <span>➕</span> {adicionando ? "Adicionando..." : "Adicionar como Amigo"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
