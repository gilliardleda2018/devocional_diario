import { redirect } from "next/navigation";
import { criarClienteSupabaseServidor } from "@/src/lib/supabase/server";
import DevocionalApp from "@/src/components/DevocionalApp";

export default async function PaginaInicial() {
  const supabase = criarClienteSupabaseServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return <DevocionalApp usuario={user} />;
}
