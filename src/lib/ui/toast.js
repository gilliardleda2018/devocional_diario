"use client";

/**
 * Notificação transitória global e leve, sem depender de Context/Provider
 * encadeado por componente -- só um pub-sub simples. Monte <ToastHost /> uma
 * vez perto da raiz do app (ver DevocionalApp.jsx) e chame showToast() de
 * qualquer lugar do cliente.
 */
let listeners = [];
let idCounter = 0;

export function showToast(mensagem, tipo = "erro", duracaoMs = 4500) {
  if (!mensagem) return;
  const id = ++idCounter;
  listeners.forEach((fn) => fn((prev) => [...prev, { id, mensagem, tipo }]));
  setTimeout(() => {
    listeners.forEach((fn) => fn((prev) => prev.filter((t) => t.id !== id)));
  }, duracaoMs);
}

export function subscribeToast(setToasts) {
  listeners.push(setToasts);
  return () => {
    listeners = listeners.filter((fn) => fn !== setToasts);
  };
}
