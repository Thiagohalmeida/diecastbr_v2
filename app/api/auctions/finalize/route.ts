import { NextResponse } from "next/server";
import { Resend } from "resend";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

// --- ENV ---
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const CRON_SECRET = process.env.CRON_SECRET || ""; // defina na Vercel / GitHub Actions
const RESEND_API_KEY = process.env.RESEND_API_KEY || "";

// --- Clients ---
const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { persistSession: false },
});
const resend = RESEND_API_KEY ? new Resend(RESEND_API_KEY) : null;

// Tipos simples
type AuctionRow = { id: string };
type FinalizeRow = {
  trade_id: string;
  winner_user_id: string | null;
  winner_amount: number | null;
  owner_user_id: string;
};

// valida token vindo no header Authorization: Bearer <token> ou ?secret=<token>
function checkAuth(req: Request) {
  if (!CRON_SECRET) return process.env.NODE_ENV === "development"; // facilita local
  const auth = req.headers.get("authorization") || "";
  const bearer = auth.toLowerCase().startsWith("bearer ")
    ? auth.slice(7).trim()
    : null;
  const urlToken = new URL(req.url).searchParams.get("secret");
  return bearer === CRON_SECRET || urlToken === CRON_SECRET;
}

export async function GET(req: Request) {
  if (!checkAuth(req)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  const { data, error } = (await admin
    .from("auctions_to_finalize")
    .select("id")) as { data: AuctionRow[] | null; error: any | null };

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true, pending: data?.length ?? 0 });
}

export async function POST(req: Request) {
  if (!checkAuth(req)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  try {
    // 1) buscar leilões vencidos (view)
    const { data: toFinalize, error: e0 } = (await admin
      .from("auctions_to_finalize")
      .select("id")) as { data: AuctionRow[] | null; error: any | null };
    if (e0) throw e0;

    const results: Array<{ trade_id: string; status: "sold" | "canceled" }> = [];

    for (const row of toFinalize ?? []) {
      // 2) finalizar via RPC (idempotente)
      const { data: fin, error: e1 } = (await admin
        .rpc("finalize_auction", { p_trade_id: row.id })
        .single()) as { data: FinalizeRow | null; error: any | null };

      if (e1 || !fin) continue;

      const { trade_id, winner_user_id, winner_amount, owner_user_id } = fin;

      // 3) e-mails (opcional)
      try {
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
      } catch (mailErr) {
        // não falha o job por erro de e-mail
        console.warn("[finalize auctions] mail warn:", mailErr);
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
