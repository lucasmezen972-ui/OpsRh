import { NextResponse } from "next/server";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { getClientReport } from "@/lib/supabase/reporting";
import { buildReportPdf } from "@/lib/pdf/report-pdf";

export async function GET(request: Request, { params }: { params: { clientId: string } }) {
  const supabase = createClient();
  if (!isSupabaseConfigured || !supabase) {
    return new NextResponse("Indisponible en mode démo. Connectez-vous pour exporter un rapport.", { status: 503 });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(new URL("/login", request.url));

  const data = await getClientReport(params.clientId);
  if (!data) return new NextResponse("Client introuvable.", { status: 404 });

  const [{ data: client }, { data: profile }] = await Promise.all([
    supabase.from("clients").select("name").eq("id", params.clientId).maybeSingle(),
    supabase.from("profiles").select("full_name, company_name").eq("id", user.id).maybeSingle(),
  ]);

  const pdf = await buildReportPdf({
    companyName: profile?.company_name || "Ops RH",
    ownerName: profile?.full_name || "",
    clientName: client?.name || data.report.clientName,
    periodLabel: data.period.label,
    report: data.report,
  });

  const filename = `rapport-${(client?.name || "client").toLowerCase().replace(/\s+/g, "-")}-${data.period.start.slice(0, 7)}.pdf`;

  return new NextResponse(Buffer.from(pdf), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
