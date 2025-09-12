import { NextResponse } from "next/server";
import { Resend } from "resend";
import { createClient } from "@supabase/supabase-js";

// garante Node runtime (bibliotecas padrão, sem Edge)
export const runtime = "nodejs";

// --- Admin client (service role) ---
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { persistSession: false },
});

// --- Resend (pode estar ausente em dev) ---
const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

// Tipagens simples para o TS
type AuctionRow = { id: string };
type FinalizeRow = {
  trade_id: string;
  winner_user_id: string | null;
  winner_amount: number | null;
  owner_user_id: string;
};

export async function POST() {
  try {
    // 1) buscar leilões a finalizar (view)
    const { data: toFinalize, error: e0 } = (await admin
      .from("auctions_to_finalize")
      .select("id")) as { data: AuctionRow[] | null; error: any | null };

    if (e0) throw e0;

    const results: Array<{ trade_id: string; status: "sold" | "canceled" }> = [];

    for (const row of toFinalize ?? []) {
      // 2) finalizar no banco (rpc retorna vencedor e valores)
      const { data: fin, error: e1 } = (await admin
        .rpc("finalize_auction", { p_trade_id: row.id })
        .single()) as { data: FinalizeRow | null; error: any | null };

      if (e1 || !fin) continue;

      const { trade_id, winner_user_id, winner_amount, owner_user_id } = fin;

      // 3) buscar e-mails do vendedor e do vencedor
      const sellerRes = await admin.auth.admin.getUserById(owner_user_id);
      const sellerEmail = sellerRes.data?.user?.email ?? null;

      let winnerEmail: string | null = null;
      if (winner_user_id) {
        const winRes = await admin.auth.admin.getUserById(winner_user_id);
        winnerEmail = winRes.data?.user?.email ?? null;
      }

      // 4) enviar e-mail ao vendedor (se houver chave do Resend)
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
