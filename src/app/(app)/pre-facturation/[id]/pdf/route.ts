import { NextResponse } from "next/server";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { buildPreInvoicePdf } from "@/lib/pdf/pre-invoice-pdf";

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const supabase = createClient();
  if (!isSupabaseConfigured || !supabase) {
    return new NextResponse("Indisponible en mode démo. Connectez-vous pour exporter une pré-facture.", { status: 503 });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(new URL("/login", _request.url));

  const { data: invoice } = await supabase
    .from("pre_invoices")
    .select("*")
    .eq("id", params.id)
    .eq("owner_id", user.id)
    .maybeSingle();
  if (!invoice) return new NextResponse("Pré-facture introuvable.", { status: 404 });

  const [{ data: client }, { data: profile }] = await Promise.all([
    supabase.from("clients").select("name").eq("id", invoice.client_id).maybeSingle(),
    supabase.from("profiles").select("full_name, company_name").eq("id", user.id).maybeSingle(),
  ]);

  const pdf = await buildPreInvoicePdf({
    companyName: profile?.company_name || "Ops RH",
    ownerName: profile?.full_name || "",
    clientName: client?.name || "Client",
    periodStart: invoice.period_start,
    periodEnd: invoice.period_end,
    subtotal: Number(invoice.subtotal),
    total: Number(invoice.total),
    status: invoice.status,
    notes: invoice.notes,
  });

  const filename = `pre-facture-${(client?.name || "client").toLowerCase().replace(/\s+/g, "-")}.pdf`;

  return new NextResponse(Buffer.from(pdf), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
