"use client";

import { useState } from "react";
import CompartilharBotoes from "@/src/components/CompartilharBotoes";

export default function FavoritosTab({ favoritos, carregando, alternarFavorito }) {
  const [filtro, setFiltro] = useState("");
  const [modalCardVersiculo, setModalCardVersiculo] = useState(null);
  const [estiloTema, setEstiloTema] = useState("dourado"); // dourado, oceano, amanhecer, noite

  const favoritosFiltrados = favoritos.filter(
    (f) =>
      f.referencia?.toLowerCase().includes(filtro.toLowerCase()) ||
      f.texto?.toLowerCase().includes(filtro.toLowerCase())
  );

  const temas = {
    dourado: {
      bg: "bg-gradient-to-br from-amber-600 via-amber-700 to-amber-900",
      text: "text-amber-50",
      accent: "border-amber-300/40",
      label: "✨ Dourado celestial",
    },
    oceano: {
      bg: "bg-gradient-to-br from-blue-700 via-indigo-800 to-slate-900",
      text: "text-blue-50",
      accent: "border-blue-300/40",
      label: "🌊 Oceano de paz",
    },
    amanhecer: {
      bg: "bg-gradient-to-br from-rose-600 via-purple-700 to-indigo-900",
      text: "text-rose-50",
      accent: "border-rose-300/40",
      label: "🌅 Amanhecer da graça",
    },
    noite: {
      bg: "bg-gradient-to-br from-slate-900 via-gray-900 to-emerald-950",
      text: "text-emerald-50",
      accent: "border-emerald-300/40",
      label: "🌌 Noite de oração",
    },
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Cabeçalho */}
      <div className="bg-gradient-to-r from-amber-500/10 via-amber-600/5 to-transparent p-5 rounded-2xl border border-amber-500/20 backdrop-blur-sm">
        <div className="flex items-center space-x-3 mb-2">
          <span className="text-3xl">⭐</span>
          <div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">
              Meus Versículos Favoritos
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Guarde os textos que tocaram seu coração e crie cards para compartilhar.
            </p>
          </div>
        </div>

        {/* Barra de Busca */}
        <div className="mt-4 relative">
          <input
            type="text"
            value={filtro}
            onChange={(e) => setFiltro(e.target.value)}
            placeholder="Buscar nos favoritos por livro, capítulo ou palavra..."
            className="w-full px-4 py-2.5 pl-10 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl shadow-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-slate-800 dark:text-slate-100 placeholder-slate-400"
          />
          <span className="absolute left-3 top-3 text-slate-400">🔍</span>
          {filtro && (
            <button
              onClick={() => setFiltro("")}
              className="absolute right-3 top-2.5 text-xs bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 px-2 py-1 rounded-full text-slate-600 dark:text-slate-300"
            >
              Limpar
            </button>
          )}
        </div>
      </div>

      {/* Lista de Favoritos */}
      {carregando ? (
        <div className="text-center py-12 text-slate-500 dark:text-slate-400 space-y-2">
          <div className="inline-block animate-spin text-2xl">⚡</div>
          <p>Carregando versículos salvos...</p>
        </div>
      ) : favoritosFiltrados.length === 0 ? (
        <div className="bg-slate-50 dark:bg-slate-800/50 border border-dashed border-slate-300 dark:border-slate-700 p-8 rounded-2xl text-center">
          <span className="text-4xl block mb-3">📖</span>
          <h3 className="font-semibold text-slate-700 dark:text-slate-200 mb-1">
            {filtro ? "Nenhum versículo encontrado" : "Nenhum favorito salvo ainda"}
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            {filtro
              ? "Tente buscar com outros termos."
              : "Toque no ícone de estrela ⭐ ao ler a Bíblia ou durante o Devocional para salvar seus versículos preferidos aqui!"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {favoritosFiltrados.map((item) => (
            <div
              key={item.referencia}
              className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4 relative group"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:amber-300 border border-amber-300/30">
                    📜 {item.referencia}
                  </span>
                  <button
                    onClick={() => alternarFavorito(item.referencia, item.texto)}
                    className="text-amber-500 hover:text-red-500 transition-colors p-1"
                    title="Remover dos favoritos"
                  >
                    ⭐
                  </button>
                </div>
                <blockquote className="text-sm text-slate-700 dark:text-slate-200 italic leading-relaxed border-l-2 border-amber-400 pl-3 my-2">
                  &ldquo;{item.texto}&rdquo;
                </blockquote>
              </div>

              {/* Ações do Card */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between gap-2">
                <button
                  onClick={() => setModalCardVersiculo(item)}
                  className="inline-flex items-center space-x-1 text-xs font-medium text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/60 px-3 py-1.5 rounded-lg transition-colors border border-amber-200/50 dark:border-amber-800/40"
                >
                  <span>🖼️ Criar Card Visual</span>
                </button>

                <CompartilharBotoes
                  titulo={`Versículo ${item.referencia}`}
                  texto={`"${item.texto}" — ${item.referencia}`}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Gerador de Card de Versículo */}
      {modalCardVersiculo && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-6 border border-slate-200 dark:border-slate-800 animate-scaleUp">
            <div className="flex items-center justify-between border-b pb-3 border-slate-200 dark:border-slate-800">
              <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100 flex items-center gap-2">
                🎨 Gerador de Card para Redes Sociais
              </h3>
              <button
                onClick={() => setModalCardVersiculo(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xl font-bold p-1"
              >
                ✕
              </button>
            </div>

            {/* Seleção de Tema */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                Escolha o Tema Visual:
              </label>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(temas).map(([key, value]) => (
                  <button
                    key={key}
                    onClick={() => setEstiloTema(key)}
                    className={`px-3 py-2 rounded-xl text-xs font-medium text-left border transition-all ${
                      estiloTema === key
                        ? "border-amber-500 bg-amber-50 dark:bg-amber-900/30 text-amber-900 dark:text-amber-200 font-bold ring-2 ring-amber-500/20"
                        : "border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100"
                    }`}
                  >
                    {value.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Preview do Card */}
            <div
              className={`p-8 rounded-2xl shadow-xl border ${temas[estiloTema].bg} ${temas[estiloTema].text} ${temas[estiloTema].accent} flex flex-col justify-between min-h-[240px] text-center space-y-6 transition-all duration-300 relative overflow-hidden`}
            >
              <div className="absolute top-2 right-3 text-white/20 text-5xl select-none font-serif">
                ✝️
              </div>
              <p className="text-base font-serif italic leading-relaxed relative z-10">
                &ldquo;{modalCardVersiculo.texto}&rdquo;
              </p>

              <div className="relative z-10 pt-2 border-t border-white/20 flex flex-col items-center">
                <span className="font-bold text-sm tracking-wide">
                  {modalCardVersiculo.referencia}
                </span>
                <span className="text-[10px] opacity-75 mt-0.5">
                  Devocional Diário • Almeida 1911
                </span>
              </div>
            </div>

            {/* Ações de Compartilhamento */}
            <div className="space-y-3 pt-2">
              <CompartilharBotoes
                titulo={`Versículo ${modalCardVersiculo.referencia}`}
                texto={`"${modalCardVersiculo.texto}" — ${modalCardVersiculo.referencia}`}
              />
              <button
                onClick={() => setModalCardVersiculo(null)}
                className="w-full py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
