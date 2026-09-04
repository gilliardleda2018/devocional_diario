"use client";

import { useState } from "react";
import { criarClienteSupabase } from "@/src/lib/supabase/client";
import AvatarUsuario from "@/src/components/AvatarUsuario";

const AVATARES_PRESET = [
  "🕊️", "✝️", "🌿", "⚓", "🛡️", "👑",
  "💡", "🔥", "⭐", "📖", "🦁", "🌅"
];

export default function PerfilModal({ usuario, perfilAtual, aberto, aoFechar, aoSalvar }) {
  const [nomeExibicao, setNomeExibicao] = useState(
    perfilAtual?.nome_exibicao || usuario?.user_metadata?.full_name || ""
  );
  const [fotoUrl, setFotoUrl] = useState(
    perfilAtual?.foto_url || usuario?.user_metadata?.avatar_url || usuario?.user_metadata?.picture || ""
  );
  const [urlPersonalizada, setUrlPersonalizada] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [mensagem, setMensagem] = useState(null);

  if (!aberto) return null;

  async function handleSalvar(e) {
    e.preventDefault();
    setSalvando(true);
    setMensagem(null);

    const fotoFinal = urlPersonalizada.trim() || fotoUrl;

    try {
      const supabase = criarClienteSupabase();
      const { error } = await supabase
        .from("profiles")
        .update({
          nome_exibicao: nomeExibicao.trim(),
          foto_url: fotoFinal,
        })
        .eq("id", usuario.id);

      if (error) throw error;

      // Salva em localStorage pra acesso rápido síncrono
      if (typeof window !== "undefined") {
        localStorage.setItem(`perfil_foto_${usuario.id}`, fotoFinal);
        localStorage.setItem(`perfil_nome_${usuario.id}`, nomeExibicao.trim());
      }

      aoSalvar({ nome_exibicao: nomeExibicao.trim(), foto_url: fotoFinal });
      setMensagem({ tipo: "sucesso", texto: "Perfil atualizado com sucesso!" });

      setTimeout(() => {
        aoFechar();
      }, 1000);
    } catch (err) {
      console.error("Erro ao atualizar perfil:", err);
      setMensagem({ tipo: "erro", texto: "Não foi possível salvar as alterações." });
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-6 border border-slate-200 dark:border-slate-800 animate-scaleUp">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between border-b pb-3 border-slate-200 dark:border-slate-800">
          <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100 flex items-center gap-2">
            👤 Editar Perfil & Foto
          </h3>
          <button
            onClick={aoFechar}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xl font-bold p-1"
          >
            ✕
          </button>
        </div>

        {/* Preview do Avatar */}
        <div className="flex flex-col items-center justify-center space-y-1.5">
          <AvatarUsuario
            nome={nomeExibicao}
            fotoUrl={urlPersonalizada.trim() || fotoUrl}
            tamanho={56}
            className="ring-2 ring-amber-500/30 shadow-md"
          />
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {usuario?.email}
          </p>
        </div>

        <form onSubmit={handleSalvar} className="space-y-4">
          {/* Nome de Exibição */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
              Nome de Exibição:
            </label>
            <input
              type="text"
              required
              value={nomeExibicao}
              onChange={(e) => setNomeExibicao(e.target.value)}
              placeholder="Seu nome no app"
              className="w-full px-4 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-amber-500"
            />
          </div>

          {/* Seleção de Ícone / Avatar */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
              Escolha um Ícone de Perfil:
            </label>
            <div className="grid grid-cols-6 gap-2">
              {AVATARES_PRESET.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => {
                    setFotoUrl(emoji);
                    setUrlPersonalizada("");
                  }}
                  className={`h-11 rounded-xl text-xl flex items-center justify-center border transition-all ${
                    fotoUrl === emoji && !urlPersonalizada
                      ? "border-amber-500 bg-amber-100 dark:bg-amber-900/50 ring-2 ring-amber-500/30 scale-105"
                      : "border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100"
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          {/* URL da Foto Personalizada */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
              Ou cole a URL da sua Foto de Perfil:
            </label>
            <input
              type="url"
              value={urlPersonalizada}
              onChange={(e) => setUrlPersonalizada(e.target.value)}
              placeholder="https://exemplo.com/minha-foto.jpg"
              className="w-full px-4 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-amber-500"
            />
          </div>

          {/* Mensagem de Sucesso / Erro */}
          {mensagem && (
            <p
              className={`text-xs text-center p-2.5 rounded-xl font-medium ${
                mensagem.tipo === "sucesso"
                  ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                  : "bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300"
              }`}
            >
              {mensagem.texto}
            </p>
          )}

          {/* Botão de Salvar */}
          <div className="pt-2 flex gap-3">
            <button
              type="button"
              onClick={aoFechar}
              className="flex-1 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={salvando}
              className="flex-1 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-sm shadow-md transition-colors disabled:opacity-50"
            >
              {salvando ? "Salvando..." : "Salvar Perfil"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
