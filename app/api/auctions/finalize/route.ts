// app/api/auctions/finalize/route.ts
import { NextResponse } from "next/server";
import { Resend } from "resend";
import { createClient } from "@supabase/supabase-js";

// Garante runtime Node (não Edge)
export const runtime = "nodejs";
// Evita qualquer tentativa de pré-renderização
export const dynamic = "force-dynamic";

type AuctionRow = { id: string };
type FinalizeRow = {
  trade_id: string;
  winner_user_id: string | null;
  winner_amount: number | null;
  owner_user_id: string;
};

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url) throw new Error("ENV NEXT_PUBLIC_SUPABASE_URL não definida");
  if (!serviceKey) throw new Error("ENV SUPABASE_SERVICE_ROLE_KEY não definida");

  return createClient(url, serviceKey, { auth: { persistSession: false } });
}

function getResend() {
  const key = process.env.RESEND_API_KEY;
  return key ? new Resend(key) : null;
}

export async function POST() {
  try {
    // **cria os clientes só agora, em tempo de request**
    const admin = getAdminClient();
    const resend = getResend();

    // 1) Buscar leilões a finalizar (view)
    const { data: toFinalize, error: e0 } = (await admin
      .from("auctions_to_finalize")
      .select("id")) as { data: AuctionRow[] | null; error: any | null };

    if (e0) throw e0;

    const results: Array<{ trade_id: string; status: "sold" | "canceled" }> = [];

    for (const row of toFinalize ?? []) {
      // 2) Finaliza via RPC (retorna dados do vencedor)
      const { data: fin, error: e1 } = (await admin
        .rpc("finalize_auction", { p_trade_id: row.id })
        .single()) as { data: FinalizeRow | null; error: any | null };

      if (e1 || !fin) continue;

      const { trade_id, winner_user_id, winner_amount, owner_user_id } = fin;

      // 3) E-mails
      const sellerRes = await admin.auth.admin.getUserById(owner_user_id);
      const sellerEmail = sellerRes.data?.user?.email ?? null;

      let winnerEmail: string | null = null;
      if (winner_user_id) {
        const winRes = await admin.auth.admin.getUserById(winner_user_id);
        winnerEmail = winRes.data?.user?.email ?? null;
      }

      // 4) Notificação por e-mail (se RESEND_API_KEY estiver configurada)
      if (sellerEmail && resend) {
        const subject =
          winner_user_id && winner_amount != null
            ? "Leilão encerrado — temos um vencedor!"
            : "Leilão encerrado — nenhum lance recebido";

        const html =
          winner_user_id && winner_amount != null
            ? `<p>Seu leilão foi encerrado.</p>
               <p><b>Maior lance:</b> R$ ${Number(winner_amount).toFixed(2)}</p>
               <p><b>Contato do vencedor:</b> ${winnerEmail ?? "indisponível"}</p>`
            : `<p>Seu leilão foi encerrado sem lances.</p>`;

        await resend.emails.send({
          from: "Diecast BR <notificacoes@mail.diecastbr.app>",
          to: sellerEmail,
          subject,
          html,
        });
      }

      results.push({ trade_id, status: winner_user_id ? "sold" : "canceled" });
    }

    return NextResponse.json({ ok: true, finalized: results });
  } catch (err: any) {
    console.error("[finalize auctions]", err);
    return NextResponse.json(
      { ok: false, error: err?.message ?? "unknown error" },
      { status: 500 }
    );
  }
}
