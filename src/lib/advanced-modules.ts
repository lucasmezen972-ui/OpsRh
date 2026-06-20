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
