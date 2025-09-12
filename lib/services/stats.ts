import { createClient } from "@/lib/supabase/client";

export type DashboardCounts = {
  total: number;
  thCount: number;   // se quiser usar depois
  monthAdds: number; // se quiser usar depois
};

export async function getDashboardCounts(): Promise<DashboardCounts> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { total: 0, thCount: 0, monthAdds: 0 };

  // total de miniaturas do usuário
  const { count: total } = await supabase
    .from("user_miniatures")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id);

  // TH/STH – ajuste o campo boolean/enum que você usa
  const { count: thCount } = await supabase
    .from("user_miniatures")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("is_super_treasure_hunt", true);

  // adições no mês corrente
  const start = new Date();
  start.setDate(1);
  start.setHours(0, 0, 0, 0);
  const { count: monthAdds } = await supabase
    .from("user_miniatures")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .gte("acquired_at", start.toISOString());

  return {
    total: total ?? 0,
    thCount: thCount ?? 0,
    monthAdds: monthAdds ?? 0,
  };
}

export async function getCollectingDays(): Promise<number> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.created_at) return 0;
  const created = new Date(user.created_at);
  const now = new Date();
  const diffMs = now.getTime() - created.getTime();
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  return days < 0 ? 0 : days;
}
