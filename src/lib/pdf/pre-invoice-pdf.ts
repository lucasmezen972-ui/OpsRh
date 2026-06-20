import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

export interface PreInvoicePdfData {
  companyName: string;
  ownerName: string;
  clientName: string;
  periodStart: string;
  periodEnd: string;
  subtotal: number;
  total: number;
  status: string;
  notes: string | null;
}

function euro(n: number) {
  return `${new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 2 }).format(n)} EUR`;
}

function frDate(iso: string) {
  try {
    return new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "long", year: "numeric" }).format(new Date(iso));
  } catch {
    return iso;
  }
}

/** Génère un PDF de pré-facture (récapitulatif) et renvoie les octets. */
export async function buildPreInvoicePdf(data: PreInvoicePdfData): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const page = doc.addPage([595.28, 841.89]); // A4
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

  // En-tête
  text(data.companyName || "Ops RH", margin, y, 18, bold, primary);
  text("PRÉ-FACTURE", width - margin - bold.widthOfTextAtSize("PRÉ-FACTURE", 16), y, 16, bold, ink);
  y -= 18;
  text(data.ownerName || "", margin, y, 10, font, muted);
  text("Récapitulatif (non contractuel)", width - margin - font.widthOfTextAtSize("Récapitulatif (non contractuel)", 9), y, 9, font, muted);
  y -= 28;
  page.drawLine({ start: { x: margin, y }, end: { x: width - margin, y }, thickness: 1, color: line });
  y -= 28;

  // Client + période
  text("CLIENT", margin, y, 9, bold, muted);
  text("PÉRIODE", width / 2, y, 9, bold, muted);
  y -= 16;
  text(data.clientName || "-", margin, y, 12, bold, ink);
  text(`${frDate(data.periodStart)}  au  ${frDate(data.periodEnd)}`, width / 2, y, 11, font, ink);
  y -= 36;

  // Tableau des lignes
  const colRight = width - margin;
  text("DÉSIGNATION", margin, y, 9, bold, muted);
  text("MONTANT", colRight - font.widthOfTextAtSize("MONTANT", 9), y, 9, bold, muted);
  y -= 8;
  page.drawLine({ start: { x: margin, y }, end: { x: colRight, y }, thickness: 1, color: line });
  y -= 22;

  const prestations = Math.max(0, data.total - data.subtotal);
  const rows: [string, number][] = [
    ["Temps facturable", data.subtotal],
    ["Prestations ponctuelles", prestations],
  ];
  for (const [label, amount] of rows) {
    text(label, margin, y, 11);
    const v = euro(amount);
    text(v, colRight - font.widthOfTextAtSize(v, 11), y, 11);
    y -= 20;
  }

  y -= 6;
  page.drawLine({ start: { x: margin, y }, end: { x: colRight, y }, thickness: 1, color: line });
  y -= 24;

  // Total
  text("TOTAL ESTIMÉ", margin, y, 12, bold, ink);
  const totalStr = euro(data.total);
  text(totalStr, colRight - bold.widthOfTextAtSize(totalStr, 14), y - 1, 14, bold, primary);
  y -= 40;

  // Notes
  if (data.notes) {
    text("Notes", margin, y, 9, bold, muted);
    y -= 16;
    const maxWidth = colRight - margin;
    const words = data.notes.split(/\s+/);
    let lineBuf = "";
    for (const w of words) {
      const test = lineBuf ? `${lineBuf} ${w}` : w;
      if (font.widthOfTextAtSize(test, 10) > maxWidth) {
        text(lineBuf, margin, y, 10, font, ink);
        y -= 14;
        lineBuf = w;
      } else {
        lineBuf = test;
      }
    }
    if (lineBuf) {
      text(lineBuf, margin, y, 10, font, ink);
      y -= 14;
    }
  }

  // Pied de page
  const footer = `Document généré le ${frDate(new Date().toISOString())} via Ops RH — ce récapitulatif ne remplace pas une facture légale.`;
  text(footer, margin, margin - 10, 8, font, muted);

  return doc.save();
}
