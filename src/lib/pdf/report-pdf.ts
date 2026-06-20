import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import type { ClientReport } from "@/lib/supabase/reporting";

export interface ReportPdfData {
  companyName: string;
  ownerName: string;
  clientName: string;
  periodLabel: string;
  report: ClientReport;
}

function euro(n: number) {
  return `${new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 2 }).format(n)} EUR`;
}
function duration(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m} min`;
  if (m === 0) return `${h} h`;
  return `${h} h ${String(m).padStart(2, "0")}`;
}

export async function buildReportPdf(data: ReportPdfData): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const page = doc.addPage([595.28, 841.89]);
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);

  const { width, height } = page.getSize();
  const margin = 56;
  const ink = rgb(0.12, 0.16, 0.23);
  const muted = rgb(0.45, 0.5, 0.58);
  const line = rgb(0.85, 0.87, 0.9);
  const primary = rgb(0.17, 0.27, 0.5);
  let y = height - margin;

  const text = (s: string, x: number, yy: number, size = 11, f = font, color = ink) =>
    page.drawText(s, { x, y: yy, size, font: f, color });

  text(data.companyName || "Ops RH", margin, y, 18, bold, primary);
  const title = "RAPPORT MENSUEL";
  text(title, width - margin - bold.widthOfTextAtSize(title, 16), y, 16, bold, ink);
  y -= 18;
  text(data.ownerName || "", margin, y, 10, font, muted);
  const periodTxt = data.periodLabel.charAt(0).toUpperCase() + data.periodLabel.slice(1);
  text(periodTxt, width - margin - font.widthOfTextAtSize(periodTxt, 10), y, 10, font, muted);
  y -= 26;
  page.drawLine({ start: { x: margin, y }, end: { x: width - margin, y }, thickness: 1, color: line });
  y -= 26;

  text("CLIENT", margin, y, 9, bold, muted);
  y -= 16;
  text(data.clientName, margin, y, 14, bold, ink);
  y -= 34;

  const rows: [string, string][] = [
    ["Temps total saisi", duration(data.report.minutes)],
    ["Dont facturable", duration(data.report.billableMinutes)],
    ["Montant pré-facturable estimé", euro(data.report.billableAmount)],
    ["Tâches terminées", String(data.report.tasksCompleted)],
    ["Dossiers actifs", String(data.report.activeCases)],
    ["Dossiers clôturés", String(data.report.closedCases)],
    ["Documents reçus / validés", String(data.report.docsReceived)],
    ["Demandes client", String(data.report.requests)],
  ];

  const colRight = width - margin;
  for (const [label, value] of rows) {
    text(label, margin, y, 11, font, ink);
    text(value, colRight - bold.widthOfTextAtSize(value, 11), y, 11, bold, ink);
    y -= 10;
    page.drawLine({ start: { x: margin, y }, end: { x: colRight, y }, thickness: 0.5, color: line });
    y -= 16;
  }

  y -= 10;
  text("Points de vigilance", margin, y, 9, bold, muted);
  y -= 16;
  const vigilance =
    data.report.activeCases > 0
      ? `${data.report.activeCases} dossier(s) encore en cours à suivre le mois prochain.`
      : "Aucun dossier en cours : tout est à jour.";
  text(vigilance, margin, y, 10, font, ink);

  const footer = "Rapport généré via Ops RH — synthèse indicative de l'activité du mois.";
  text(footer, margin, margin - 10, 8, font, muted);

  return doc.save();
}
