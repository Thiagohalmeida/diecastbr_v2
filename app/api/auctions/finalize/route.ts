// app/api/auctions/finalize/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type AuctionRow = { id: string };
type FinalizeRow = {
  trade_id: string;
  winner_user_id: string | null;
  winner_amount: number | null;
  owner_user_id: string;
};

export async function POST() {
  try {
    // ==> CRIA o client APENAS aqui, em runtime
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url) throw new Error("ENV NEXT_PUBLIC_SUPABASE_URL não definida");
    if (!serviceKey) throw new Error("ENV SUPABASE_SERVICE_ROLE_KEY não definida");

    const admin = createClient(url, serviceKey, { auth: { persistSession: false } });

    const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

    // 1) buscar leilões a finalizar (view)
    const { data: toFinalize, error: e0 } = (await admin
      .from("auctions_to_finalize")
      .select("id")) as { data: AuctionRow[] | null; error: any | null };

    if (e0) throw e0;

    const results: Array<{ trade_id: string; status: "sold" | "canceled" }> = [];

    for (const row of toFinalize ?? []) {
      // 2) finalizar via RPC
      const { data: fin, error: e1 } = (await admin
        .rpc("finalize_auction", { p_trade_id: row.id })
        .single()) as { data: FinalizeRow | null; error: any | null };

      if (e1 || !fin) continue;

      const { trade_id, winner_user_id, winner_amount, owner_user_id } = fin;

      // 3) e-mails
      const sellerRes = await admin.auth.admin.getUserById(owner_user_id);
      const sellerEmail = sellerRes.data?.user?.email ?? null;

      let winnerEmail: string | null = null;
      if (winner_user_id) {
        const winRes = await admin.auth.admin.getUserById(winner_user_id);
        winnerEmail = winRes.data?.user?.email ?? null;
      }

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

// (opcional) Evita erro ao bater GET no endpoint manualmente
export function GET() {
  return NextResponse.json({ ok: true, message: "Use POST para finalizar leilões." });
}
