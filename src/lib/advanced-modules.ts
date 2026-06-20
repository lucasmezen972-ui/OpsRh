export type AdvancedDocumentType =
  | "piece_identite"
  | "rib"
  | "cv"
  | "justificatif"
  | "contrat"
  | "document_signe"
  | "fiche_poste"
  | "compte_rendu"
  | "courrier"
  | "rapport"
  | "autre";

export type AdvancedPriority = "basse" | "normale" | "haute" | "urgente";

export type AdvancedTaskType =
  | "relance_client"
  | "demande_document"
  | "preparation_document"
  | "verification_dossier"
  | "appel"
  | "point_client"
  | "suivi_administratif"
  | "facturation"
  | "autre";

export type AdvancedModuleClient = {
  id: string;
  name: string;
  main_contact_name: string | null;
  main_contact_email: string | null;
};

export type AdvancedModuleCase = {
  id: string;
  title: string;
  client_id: string;
  person_name: string | null;
  description: string | null;
  due_date: string | null;
};

export type AdvancedModuleDocument = {
  id: string;
  name: string;
  client_id: string | null;
  hr_case_id: string | null;
  file_type: string | null;
  document_type: AdvancedDocumentType;
  status: string;
  expiration_date: string | null;
};

export type AdvancedModuleOptions = {
  isDemo: boolean;
  clients: AdvancedModuleClient[];
  cases: AdvancedModuleCase[];
  documents: AdvancedModuleDocument[];
};

export type AiRequestKind = "relance" | "resume" | "prochaines_actions" | "mail_libre";

export type AiAssistantDraft = {
  subject: string;
  body: string;
  nextActions: string[];
};

export type DocumentAnalysisResult = {
  detectedType: AdvancedDocumentType;
  confidence: number;
  summary: string;
  issues: string[];
  suggestedStatus: "recu" | "valide" | "a_corriger";
  expirationDate: string | null;
};

export type ImportSource = "whatsapp" | "email";

export type ImportedMessageResult = {
  title: string;
  summary: string;
  taskType: AdvancedTaskType;
  priority: AdvancedPriority;
  suggestedAction: string;
};

export type ReportingCase = {
  id: string;
  title: string;
  status: string;
  priority: AdvancedPriority;
  due_date: string | null;
  updated_at: string;
};

export type ReportingTask = {
  id: string;
  title: string;
  status: string;
  priority: AdvancedPriority;
  due_date: string | null;
  completed_at: string | null;
  created_at: string;
};

export type ReportingDocument = {
  id: string;
  name: string;
  status: string;
  created_at: string;
  expiration_date: string | null;
};

export type ReportingTimeEntry = {
  id: string;
  date: string;
  duration_minutes: number;
  billable: boolean;
  hourly_rate: number | null;
  description: string | null;
};

export type ReportingData = {
  client: AdvancedModuleClient | null;
  periodStart: string;
  periodEnd: string;
  cases: ReportingCase[];
  tasks: ReportingTask[];
  documents: ReportingDocument[];
  timeEntries: ReportingTimeEntry[];
  notes: string | null;
};

export type ReportingReport = {
  title: string;
  periodLabel: string;
  summary: string;
  metrics: {
    casesTotal: number;
    casesOpen: number;
    tasksTotal: number;
    tasksDone: number;
    tasksLate: number;
    documentsTotal: number;
    documentsMissing: number;
    totalMinutes: number;
    billableMinutes: number;
    billableAmount: number;
  };
  vigilance: string[];
  recommendations: string[];
  content: string;
};

function byId<T extends { id: string }>(items: T[], id: string | null | undefined) {
  if (!id) return null;
  return items.find((item) => item.id === id) ?? null;
}

function documentLabel(doc: AdvancedModuleDocument) {
  return `- ${doc.name} (${doc.status})`;
}

function inferMissingDocuments(documents: AdvancedModuleDocument[], caseId: string | null | undefined) {
  const scoped = caseId ? documents.filter((doc) => doc.hr_case_id === caseId) : documents;
  const missing = scoped.filter((doc) => ["demande", "a_corriger", "expire"].includes(doc.status));
  return missing.length > 0 ? missing.map(documentLabel).join("\n") : "- Aucun document bloquant identifié.";
}

export function buildAiAssistantDraft(input: {
  kind: AiRequestKind;
  prompt: string;
  clientId?: string | null;
  caseId?: string | null;
  options: AdvancedModuleOptions;
}): AiAssistantDraft {
  const client = byId(input.options.clients, input.clientId);
  const hrCase = byId(input.options.cases, input.caseId);
  const contact = client?.main_contact_name ?? "Bonjour";
  const clientName = client?.name ?? "le client";
  const caseTitle = hrCase?.title ?? "le dossier RH";
  const missingDocs = inferMissingDocuments(input.options.documents, input.caseId);
  const prompt = input.prompt.trim();

  if (input.kind === "resume") {
    return {
      subject: `Synthèse - ${caseTitle}`,
      body: [
        `Synthèse opérationnelle pour ${caseTitle}`,
        "",
        `Client : ${clientName}`,
        hrCase?.person_name ? `Personne concernée : ${hrCase.person_name}` : null,
        hrCase?.description ? `Contexte : ${hrCase.description}` : null,
        prompt ? `Point ajouté : ${prompt}` : null,
        "",
        "Documents / points de vigilance :",
        missingDocs,
      ]
        .filter(Boolean)
        .join("\n"),
      nextActions: ["Vérifier les pièces reçues", "Relancer le client si un document bloque", "Mettre à jour le statut du dossier"],
    };
  }

  if (input.kind === "prochaines_actions") {
    return {
      subject: `Prochaines actions - ${caseTitle}`,
      body: [
        `Plan d'action proposé pour ${caseTitle}`,
        "",
        "1. Contrôler les documents déjà reçus.",
        "2. Relancer les pièces manquantes ou à corriger.",
        "3. Programmer un point client si le dossier reste bloqué.",
        "4. Saisir le temps passé et préparer la pré-facturation si nécessaire.",
        prompt ? `\nContrainte à prendre en compte : ${prompt}` : null,
      ]
        .filter(Boolean)
        .join("\n"),
      nextActions: ["Créer une tâche de relance", "Préparer un mail client", "Planifier un suivi"],
    };
  }

  const subject =
    input.kind === "relance" ? `Relance documents - ${caseTitle}` : `Message RH - ${clientName}`;

  return {
    subject,
    body: [
      `${contact},`,
      "",
      input.kind === "relance"
        ? `Je reviens vers vous concernant le dossier « ${caseTitle} ».`
        : `Je vous contacte concernant ${caseTitle}.`,
      "",
      input.kind === "relance"
        ? ["Il nous manque encore les éléments suivants :", "", missingDocs].join("\n")
        : prompt || "Voici les éléments à suivre pour avancer sur le dossier.",
      "",
      "Pouvez-vous me confirmer la suite à donner ou me transmettre les éléments disponibles ?",
      "",
      "Bien cordialement,",
    ].join("\n"),
    nextActions: ["Relire le message", "Adapter le ton si nécessaire", "Enregistrer comme brouillon"],
  };
}

function lower(value: string) {
  return value.toLowerCase();
}

export function analyzeDocumentContent(input: {
  filename: string;
  mimeType?: string | null;
  content?: string | null;
}): DocumentAnalysisResult {
  const combined = lower(`${input.filename} ${input.mimeType ?? ""} ${input.content ?? ""}`);
  let detectedType: AdvancedDocumentType = "autre";
  let confidence = 0.45;
  const issues: string[] = [];

  const rules: Array<[AdvancedDocumentType, RegExp, number]> = [
    ["rib", /\b(rib|iban|bic|releve d.identite bancaire)\b/i, 0.92],
    ["piece_identite", /\b(cni|identite|passeport|carte nationale)\b/i, 0.9],
    ["cv", /\b(cv|curriculum|experience|formation)\b/i, 0.88],
    ["justificatif", /\b(justificatif|domicile|facture edf|quittance)\b/i, 0.86],
    ["contrat", /\b(contrat|cdi|cdd|avenant|clause)\b/i, 0.84],
    ["fiche_poste", /\b(fiche de poste|missions|competences)\b/i, 0.82],
    ["compte_rendu", /\b(compte rendu|cr |reunion|point rh)\b/i, 0.78],
    ["rapport", /\b(rapport|audit|synthese)\b/i, 0.76],
  ];

  for (const [type, pattern, score] of rules) {
    if (pattern.test(combined)) {
      detectedType = type;
      confidence = score;
      break;
    }
  }

  if (!input.mimeType) issues.push("Type MIME non disponible.");
  if (input.mimeType && !["application/pdf", "image/png", "image/jpeg"].includes(input.mimeType)) {
    issues.push("Format inhabituel pour un document RH.");
  }
  if (combined.includes("expire") || combined.includes("périmé") || combined.includes("perime")) {
    issues.push("Le contenu laisse penser que le document est expiré.");
  }
  if (detectedType === "piece_identite" && !/\b(recto|verso|passeport)\b/i.test(combined)) {
    issues.push("Pour une pièce d'identité, vérifier que le recto-verso est disponible.");
  }
  if (detectedType === "rib" && !/\b(iban|bic)\b/i.test(combined)) {
    issues.push("Pour un RIB, vérifier la présence de l'IBAN et du BIC.");
  }

  const expirationMatch = combined.match(/\b(20\d{2})[-/](0?[1-9]|1[0-2])[-/](0?[1-9]|[12]\d|3[01])\b/);
  const expirationDate = expirationMatch
    ? `${expirationMatch[1]}-${expirationMatch[2].padStart(2, "0")}-${expirationMatch[3].padStart(2, "0")}`
    : null;

  return {
    detectedType,
    confidence,
    summary: `Document identifié comme « ${detectedType} » avec une confiance de ${Math.round(confidence * 100)} %.`,
    issues,
    suggestedStatus: issues.length > 0 ? "a_corriger" : "valide",
    expirationDate,
  };
}

export function parseInboundMessage(input: {
  source: ImportSource;
  rawContent: string;
}): ImportedMessageResult {
  const raw = input.rawContent.trim();
  const firstLine = raw.split(/\r?\n/).map((line) => line.trim()).find(Boolean) ?? "Message entrant";
  const urgent = /\b(urgent|aujourd'hui|retard|bloque|bloqué|asap|rapidement)\b/i.test(raw);
  const document = /\b(document|piece|pièce|rib|contrat|justificatif|cv|attestation)\b/i.test(raw);
  const relance = /\b(relance|rappel|retour|réponse|reponse)\b/i.test(raw);
  const appointment = /\b(appel|rdv|rendez-vous|point)\b/i.test(raw);

  let taskType: AdvancedTaskType = "autre";
  if (document) taskType = "demande_document";
  else if (relance) taskType = "relance_client";
  else if (appointment) taskType = "appel";

  const title = firstLine.length > 90 ? `${firstLine.slice(0, 87)}...` : firstLine;
  const summary = raw.length > 360 ? `${raw.slice(0, 357)}...` : raw;

  return {
    title,
    summary,
    taskType,
    priority: urgent ? "haute" : "normale",
    suggestedAction: input.source === "email" ? "Créer une tâche depuis l'email" : "Créer une tâche depuis WhatsApp",
  };
}

function formatPeriod(start: string, end: string) {
  const startDate = new Date(`${start}T00:00:00`);
  const endDate = new Date(`${end}T00:00:00`);
  return `${startDate.toLocaleDateString("fr-FR")} - ${endDate.toLocaleDateString("fr-FR")}`;
}

function isWithinPeriod(date: string | null | undefined, start: string, end: string) {
  if (!date) return false;
  return date >= start && date <= end;
}

function unique(values: string[]) {
  return Array.from(new Set(values));
}

export function buildReportingReport(data: ReportingData): ReportingReport {
  const openCaseStates = ["nouveau", "en_cours", "en_attente_client", "a_completer", "bloque", "a_valider"];
  const missingDocStates = ["demande", "a_corriger", "expire"];
  const today = new Date().toISOString().slice(0, 10);

  const scopedTasks = data.tasks.filter(
    (task) =>
      isWithinPeriod(task.created_at.slice(0, 10), data.periodStart, data.periodEnd) ||
      isWithinPeriod(task.completed_at?.slice(0, 10), data.periodStart, data.periodEnd) ||
      isWithinPeriod(task.due_date, data.periodStart, data.periodEnd)
  );
  const scopedDocuments = data.documents.filter((document) =>
    isWithinPeriod(document.created_at.slice(0, 10), data.periodStart, data.periodEnd)
  );
  const scopedTime = data.timeEntries.filter((entry) => isWithinPeriod(entry.date, data.periodStart, data.periodEnd));

  const totalMinutes = scopedTime.reduce((sum, entry) => sum + Number(entry.duration_minutes ?? 0), 0);
  const billableMinutes = scopedTime.filter((entry) => entry.billable).reduce((sum, entry) => sum + Number(entry.duration_minutes ?? 0), 0);
  const billableAmount = scopedTime
    .filter((entry) => entry.billable)
    .reduce((sum, entry) => sum + (Number(entry.duration_minutes ?? 0) / 60) * Number(entry.hourly_rate ?? 0), 0);

  const openCases = data.cases.filter((hrCase) => openCaseStates.includes(hrCase.status));
  const doneTasks = scopedTasks.filter((task) => task.status === "termine");
  const lateTasks = scopedTasks.filter((task) => task.status !== "termine" && task.due_date && task.due_date < today);
  const missingDocuments = data.documents.filter((document) => missingDocStates.includes(document.status));
  const blockedCases = data.cases.filter((hrCase) => hrCase.status === "bloque");

  const vigilance = unique([
    ...blockedCases.map((hrCase) => `Dossier bloqué : ${hrCase.title}`),
    ...lateTasks.map((task) => `Tâche en retard : ${task.title}`),
    ...missingDocuments.slice(0, 6).map((document) => `Document à suivre : ${document.name} (${document.status})`),
  ]);

  const recommendations = [
    missingDocuments.length > 0 ? "Planifier une relance documents ciblée." : "Maintenir le rythme de validation documentaire.",
    lateTasks.length > 0 ? "Reprioriser les tâches en retard avant la prochaine échéance client." : "Conserver le suivi hebdomadaire des tâches ouvertes.",
    billableMinutes > 0 ? "Comparer le temps facturable avec les accords client avant pré-facturation." : "Vérifier si le mois contient du temps non saisi.",
  ];

  const clientName = data.client?.name ?? "Tous clients";
  const periodLabel = formatPeriod(data.periodStart, data.periodEnd);
  const title = `Rapport RH - ${clientName}`;
  const summary = `${clientName} : ${openCases.length} dossier(s) ouvert(s), ${doneTasks.length}/${scopedTasks.length} tâche(s) terminée(s), ${Math.round(billableMinutes / 60 * 10) / 10}h facturable(s).`;

  const content = [
    `# ${title}`,
    "",
    `Période : ${periodLabel}`,
    "",
    "## Synthèse",
    summary,
    data.notes ? `\nNote : ${data.notes}` : null,
    "",
    "## Indicateurs",
    `- Dossiers actifs : ${openCases.length}/${data.cases.length}`,
    `- Tâches terminées : ${doneTasks.length}/${scopedTasks.length}`,
    `- Tâches en retard : ${lateTasks.length}`,
    `- Documents suivis : ${scopedDocuments.length} ajouté(s), ${missingDocuments.length} à suivre`,
    `- Temps total : ${Math.round(totalMinutes / 60 * 10) / 10}h`,
    `- Temps facturable : ${Math.round(billableMinutes / 60 * 10) / 10}h`,
    `- Montant facturable estimé : ${Math.round(billableAmount)} EUR`,
    "",
    "## Dossiers",
    data.cases.length > 0 ? data.cases.map((hrCase) => `- ${hrCase.title} (${hrCase.status}, ${hrCase.priority})`).join("\n") : "- Aucun dossier.",
    "",
    "## Points de vigilance",
    vigilance.length > 0 ? vigilance.map((item) => `- ${item}`).join("\n") : "- Aucun point de vigilance majeur.",
    "",
    "## Recommandations",
    recommendations.map((item) => `- ${item}`).join("\n"),
  ]
    .filter(Boolean)
    .join("\n");

  return {
    title,
    periodLabel,
    summary,
    metrics: {
      casesTotal: data.cases.length,
      casesOpen: openCases.length,
      tasksTotal: scopedTasks.length,
      tasksDone: doneTasks.length,
      tasksLate: lateTasks.length,
      documentsTotal: scopedDocuments.length,
      documentsMissing: missingDocuments.length,
      totalMinutes,
      billableMinutes,
      billableAmount,
    },
    vigilance,
    recommendations,
    content,
  };
}
