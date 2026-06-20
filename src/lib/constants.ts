import type {
  CaseStatus,
  CaseType,
  ClientRequestStatus,
  ClientRequestType,
  ClientStatus,
  DocumentStatus,
  DocumentType,
  PreInvoiceStatus,
  Priority,
  TaskStatus,
  TaskType,
} from "./types";

// Variantes de couleur exploitées par <StatusBadge />
export type Tone = "neutral" | "info" | "success" | "warning" | "danger" | "purple";

interface Meta {
  label: string;
  tone: Tone;
}

export const CLIENT_STATUS: Record<ClientStatus, Meta> = {
  actif: { label: "Actif", tone: "success" },
  en_pause: { label: "En pause", tone: "warning" },
  termine: { label: "Terminé", tone: "neutral" },
};

export const CASE_STATUS: Record<CaseStatus, Meta> = {
  nouveau: { label: "Nouveau", tone: "info" },
  en_cours: { label: "En cours", tone: "info" },
  en_attente_client: { label: "En attente client", tone: "warning" },
  a_completer: { label: "À compléter", tone: "warning" },
  bloque: { label: "Bloqué", tone: "danger" },
  a_valider: { label: "À valider", tone: "purple" },
  termine: { label: "Terminé", tone: "success" },
  archive: { label: "Archivé", tone: "neutral" },
};

export const CASE_TYPE: Record<CaseType, string> = {
  embauche: "Embauche",
  onboarding: "Onboarding",
  suivi_salarie: "Suivi salarié",
  demande_document: "Demande de document",
  preparation_contrat: "Préparation contrat",
  rupture: "Rupture",
  procedure: "Procédure",
  accompagnement: "Accompagnement",
  autre: "Autre",
};

export const PRIORITY: Record<Priority, Meta> = {
  basse: { label: "Basse", tone: "neutral" },
  normale: { label: "Normale", tone: "info" },
  haute: { label: "Haute", tone: "warning" },
  urgente: { label: "Urgente", tone: "danger" },
};

export const TASK_STATUS: Record<TaskStatus, Meta> = {
  a_faire: { label: "À faire", tone: "info" },
  en_cours: { label: "En cours", tone: "info" },
  en_attente: { label: "En attente", tone: "warning" },
  termine: { label: "Terminé", tone: "success" },
  en_retard: { label: "En retard", tone: "danger" },
};

export const TASK_TYPE: Record<TaskType, string> = {
  relance_client: "Relance client",
  demande_document: "Demande de document",
  preparation_document: "Préparation document",
  verification_dossier: "Vérification dossier",
  appel: "Appel",
  point_client: "Point client",
  suivi_administratif: "Suivi administratif",
  facturation: "Facturation",
  autre: "Autre",
};

export const DOCUMENT_STATUS: Record<DocumentStatus, Meta> = {
  demande: { label: "Demandé", tone: "warning" },
  recu: { label: "Reçu", tone: "info" },
  valide: { label: "Validé", tone: "success" },
  a_corriger: { label: "À corriger", tone: "danger" },
  expire: { label: "Expiré", tone: "danger" },
  archive: { label: "Archivé", tone: "neutral" },
};

export const DOCUMENT_TYPE: Record<DocumentType, string> = {
  piece_identite: "Pièce d'identité",
  rib: "RIB",
  cv: "CV",
  justificatif: "Justificatif",
  contrat: "Contrat",
  document_signe: "Document signé",
  fiche_poste: "Fiche de poste",
  compte_rendu: "Compte rendu",
  courrier: "Courrier",
  rapport: "Rapport",
  autre: "Autre",
};

export const PRE_INVOICE_STATUS: Record<PreInvoiceStatus, Meta> = {
  a_preparer: { label: "À préparer", tone: "neutral" },
  a_verifier: { label: "À vérifier", tone: "warning" },
  prete: { label: "Prête", tone: "success" },
  exportee: { label: "Exportée", tone: "info" },
  archivee: { label: "Archivée", tone: "neutral" },
};

export const CLIENT_REQUEST_STATUS: Record<ClientRequestStatus, Meta> = {
  nouvelle: { label: "Nouvelle", tone: "info" },
  en_cours: { label: "En cours", tone: "warning" },
  convertie: { label: "Convertie", tone: "success" },
  close: { label: "Close", tone: "neutral" },
};

export const CLIENT_REQUEST_TYPE: Record<ClientRequestType, string> = {
  besoin_document: "Besoin de document",
  demande_contrat: "Demande de contrat",
  demande_conseil: "Demande de conseil",
  demande_relance: "Demande de relance",
  demande_administrative: "Demande administrative",
  autre: "Autre",
};

// Modules avancés (section « Modules »)
export type ModuleStatus = "non_active" | "active" | "bientot";

export interface AdvancedModule {
  key: string;
  name: string;
  description: string;
  status: ModuleStatus;
  icon: string;
  href?: string;
}

export const ADVANCED_MODULES: AdvancedModule[] = [
  {
    key: "ia",
    name: "Assistant IA",
    description:
      "Rédige des mails, résume un dossier, propose les prochaines actions. L'IA assiste mais ne décide jamais à votre place.",
    status: "bientot",
    icon: "Sparkles",
  },
  {
    key: "reporting",
    name: "Reporting",
    description:
      "Génèrera des rapports mensuels client, synthèses de tâches, temps passé et points de vigilance.",
    status: "bientot",
    icon: "BarChart3",
  },
  {
    key: "signature",
    name: "Signature électronique",
    description:
      "Faites signer devis, contrats de mission et validations. Le document signé est archivé automatiquement.",
    status: "bientot",
    icon: "PenTool",
  },
  {
    key: "analyse",
    name: "Analyse automatique des documents",
    description:
      "Détecte le type de document, l'associe à une checklist, repère les dates d'expiration et signale les incohérences.",
    status: "bientot",
    icon: "ScanLine",
  },
  {
    key: "import",
    name: "Import WhatsApp / Email",
    description:
      "Transforme un email ou un message en tâche ou demande client, et rattache la conversation au bon dossier.",
    status: "bientot",
    icon: "Inbox",
  },
];
