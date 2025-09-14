// app/api/auctions/finalize/route.ts
import { NextResponse } from "next/server";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { Resend } from "resend";

// Garante que essa rota rode no Node runtime (bibliotecas padrão do Node).
export const runtime = "nodejs";
// Evita otimização estática / coleta de page data durante o build.
export const dynamic = "force-dynamic";

type AuctionRow = { id: string };

type FinalizeRow = {
  trade_id: string;
  winner_user_id: string | null;
  winner_amount: number | null;
  owner_user_id: string;
};

function getEnvOrThrow(name: string, altName?: string): string {
  const val = process.env[name] ?? (altName ? process.env[altName] : undefined);
  if (!val || !val.trim()) {
    throw new Error(
      `Missing environment variable: ${name}${altName ? ` (or ${altName})` : ""}`,
    );
  }
  return val;
}

/**
 * Cria um cliente admin do Supabase com as envs corretas.
 * Colocamos isso dentro do handler para não executar em build-time.
 */
function createAdminClient(): SupabaseClient {
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SERVICE_KEY;

  if (!url) throw new Error("Missing SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL");
  if (!serviceKey) throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY");

  return createClient(url, serviceKey, { auth: { persistSession: false } });
}

export async function POST() {
  try {
    const admin = createAdminClient();

    // Instancia o Resend só se houver chave (opcional em dev).
    const resendKey = process.env.RESEND_API_KEY;
    const resend = resendKey ? new Resend(resendKey) : null;

    // 1) Buscar leilões a finalizar (view criada no banco)
    const { data: toFinalize, error: e0 } = (await admin
      .from("auctions_to_finalize")
      .select("id")) as { data: AuctionRow[] | null; error: any | null };

    if (e0) {
      throw new Error(`Erro ao consultar auctions_to_finalize: ${e0.message ?? e0}`);
    }

    if (!toFinalize || toFinalize.length === 0) {
      return NextResponse.json({ ok: true, finalized: [], message: "Nenhum leilão a finalizar." });
    }

    const results: Array<{ trade_id: string; status: "sold" | "canceled" }> = [];

    for (const row of toFinalize) {
      // 2) Finaliza o leilão no banco via RPC (retorna dados do vencedor, se houver)
      const { data: fin, error: e1 } = (await admin
        .rpc("finalize_auction", { p_trade_id: row.id })
        .single()) as { data: FinalizeRow | null; error: any | null };

      if (e1) {
        // Segue para o próximo leilão, mas registra no log
        console.error("[finalize_auction] erro:", e1);
        continue;
      }
      if (!fin) {
        console.warn("[finalize_auction] sem retorno para trade_id:", row.id);
        continue;
      }

      const { trade_id, winner_user_id, winner_amount, owner_user_id } = fin;

      // 3) Busca e-mails do vendedor e do vencedor
      let sellerEmail: string | null = null;
      try {
        const sellerRes = await admin.auth.admin.getUserById(owner_user_id);
        sellerEmail = sellerRes.data?.user?.email ?? null;
      } catch (e) {
        console.error("Erro ao buscar vendedor:", e);
      }

      let winnerEmail: string | null = null;
      if (winner_user_id) {
        try {
          const winRes = await admin.auth.admin.getUserById(winner_user_id);
          winnerEmail = winRes.data?.user?.email ?? null;
        } catch (e) {
          console.error("Erro ao buscar vencedor:", e);
        }
      }

      // 4) Envia e-mail ao vendedor (opcional, se RESEND_API_KEY existir)
      if (sellerEmail && resend) {
        const subject =
          winner_user_id && winner_amount != null
            ? "Leilão encerrado — temos um vencedor!"
            : "Leilão encerrado — nenhum lance recebido";

        const html =
          winner_user_id && winner_amount != null
            ? `
              <p>Seu leilão foi encerrado.</p>
              <p><b>Maior lance:</b> R$ ${Number(winner_amount).toFixed(2)}</p>
              <p><b>Contato do vencedor:</b> ${winnerEmail ?? "indisponível"}</p>
            `
            : `
              <p>Seu leilão foi encerrado sem lances.</p>
            `;

        try {
          await resend.emails.send({
            from: "Diecast BR <notificacoes@mail.diecastbr.app>",
            to: sellerEmail,
            subject,
            html,
          });
        } catch (e) {
          console.error("Erro ao enviar e-mail via Resend:", e);
        }
      }

      results.push({ trade_id, status: winner_user_id ? "sold" : "canceled" });
    }

    return NextResponse.json({ ok: true, finalized: results });
  } catch (err: any) {
    console.error("[finalize auctions] erro:", err);
    return NextResponse.json(
      { ok: false, error: err?.message ?? "unknown error" },
      { status: 500 }
    );
  }
}
