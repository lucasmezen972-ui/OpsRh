// Données de démonstration Ops RH.
// Utilisées tant qu'aucun projet Supabase n'est connecté, et reprises
// telles quelles dans supabase/seed.sql pour le seed de la base.

import type {
  ActivityLog,
  AppNotification,
  ChecklistItem,
  Client,
  ClientContact,
  ClientRequest,
  Comment,
  DocumentChecklist,
  DocumentItem,
  EmailTemplate,
  GeneratedEmail,
  HrCase,
  PreInvoice,
  Profile,
  Task,
  TimeEntry,
} from "./types";

const OWNER = "00000000-0000-0000-0000-000000000001";

// Helpers de dates relatives (base : aujourd'hui)
const now = new Date();
function iso(daysOffset: number, hour = 9): string {
  const d = new Date(now);
  d.setDate(d.getDate() + daysOffset);
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
}
function dateOnly(daysOffset: number): string {
  const d = new Date(now);
  d.setDate(d.getDate() + daysOffset);
  return d.toISOString().slice(0, 10);
}

export const profile: Profile = {
  id: OWNER,
  email: "lucas.mezen.972@gmail.com",
  full_name: "Lucas Mezen",
  role: "freelance",
  avatar_url: null,
  company_name: "Mezen RH Conseil",
  created_at: iso(-120),
};

export const clients: Client[] = [
  {
    id: "c1",
    owner_id: OWNER,
    name: "Alpha Services",
    sector: "Services aux entreprises",
    address: "12 rue des Lilas, 97200 Fort-de-France",
    siret: "812 345 678 00021",
    main_contact_name: "Marie Laurent",
    main_contact_email: "marie.laurent@alpha-services.fr",
    main_contact_phone: "06 12 34 56 78",
    status: "actif",
    notes: "Cliente fidèle depuis 2024. Forfait mensuel + prestations ponctuelles. Réactive par email.",
    collaboration_type: "Forfait mensuel",
    collaboration_start_date: dateOnly(-300),
    created_at: iso(-300),
    updated_at: iso(-1),
  },
  {
    id: "c2",
    owner_id: OWNER,
    name: "Caraïbes Distribution",
    sector: "Grande distribution",
    address: "ZI La Lézarde, 97232 Le Lamentin",
    siret: "509 876 543 00014",
    main_contact_name: "Julien Moreau",
    main_contact_email: "j.moreau@caraibes-distrib.com",
    main_contact_phone: "06 98 76 54 32",
    status: "actif",
    notes: "Plusieurs onboardings en cours. Préfère être appelé en fin de journée.",
    collaboration_type: "Régie + forfait",
    collaboration_start_date: dateOnly(-150),
    created_at: iso(-150),
    updated_at: iso(-2),
  },
  {
    id: "c3",
    owner_id: OWNER,
    name: "Studio Mango",
    sector: "Agence créative",
    address: "5 impasse des Manguiers, 97122 Baie-Mahault",
    siret: "884 112 233 00010",
    main_contact_name: "Sophie Nadal",
    main_contact_email: "sophie@studio-mango.fr",
    main_contact_phone: "06 44 55 66 77",
    status: "en_pause",
    notes: "Collaboration en pause jusqu'à la rentrée. Reprise prévue en septembre.",
    collaboration_type: "À la mission",
    collaboration_start_date: dateOnly(-90),
    created_at: iso(-90),
    updated_at: iso(-20),
  },
];

export const clientContacts: ClientContact[] = [
  {
    id: "ct1",
    client_id: "c1",
    name: "Marie Laurent",
    email: "marie.laurent@alpha-services.fr",
    phone: "06 12 34 56 78",
    role: "Gérante",
    portal_access: true,
    created_at: iso(-300),
  },
  {
    id: "ct2",
    client_id: "c2",
    name: "Julien Moreau",
    email: "j.moreau@caraibes-distrib.com",
    phone: "06 98 76 54 32",
    role: "Responsable RH",
    portal_access: true,
    created_at: iso(-150),
  },
  {
    id: "ct3",
    client_id: "c3",
    name: "Sophie Nadal",
    email: "sophie@studio-mango.fr",
    phone: "06 44 55 66 77",
    role: "Directrice",
    portal_access: false,
    created_at: iso(-90),
  },
];

export const hrCases: HrCase[] = [
  {
    id: "d1",
    owner_id: OWNER,
    client_id: "c1",
    title: "Embauche — Clara Martin",
    person_name: "Clara Martin",
    case_type: "embauche",
    description: "Recrutement d'une assistante commerciale en CDI. Constitution du dossier d'embauche complet.",
    status: "en_attente_client",
    priority: "haute",
    due_date: dateOnly(4),
    internal_notes: "Relancer Marie pour le RIB et la pièce d'identité, manquants depuis 6 jours.",
    created_at: iso(-12),
    updated_at: iso(-1),
    archived_at: null,
  },
  {
    id: "d2",
    owner_id: OWNER,
    client_id: "c1",
    title: "Demande documents salarié",
    person_name: "Thomas Petit",
    case_type: "demande_document",
    description: "Mise à jour des justificatifs administratifs pour un salarié en poste.",
    status: "en_cours",
    priority: "normale",
    due_date: dateOnly(9),
    internal_notes: null,
    created_at: iso(-8),
    updated_at: iso(-3),
    archived_at: null,
  },
  {
    id: "d3",
    owner_id: OWNER,
    client_id: "c1",
    title: "Point RH mensuel",
    person_name: null,
    case_type: "accompagnement",
    description: "Point mensuel avec la gérante : suivi des effectifs, questions diverses, compte rendu.",
    status: "a_valider",
    priority: "normale",
    due_date: dateOnly(2),
    internal_notes: "Compte rendu à générer puis à valider avant envoi.",
    created_at: iso(-5),
    updated_at: iso(0),
    archived_at: null,
  },
  {
    id: "d4",
    owner_id: OWNER,
    client_id: "c2",
    title: "Onboarding — Assistant administratif",
    person_name: "Kevin Rosé",
    case_type: "onboarding",
    description: "Parcours d'intégration d'un nouvel assistant administratif. Checklist onboarding à transmettre.",
    status: "en_cours",
    priority: "haute",
    due_date: dateOnly(6),
    internal_notes: null,
    created_at: iso(-7),
    updated_at: iso(-1),
    archived_at: null,
  },
  {
    id: "d5",
    owner_id: OWNER,
    client_id: "c2",
    title: "Mise à jour documents salariés",
    person_name: null,
    case_type: "suivi_salarie",
    description: "Campagne de mise à jour des documents pour l'ensemble des salariés du dépôt.",
    status: "bloque",
    priority: "haute",
    due_date: dateOnly(-2),
    internal_notes: "Bloqué : en attente de la liste à jour des salariés de la part du client depuis 9 jours.",
    created_at: iso(-15),
    updated_at: iso(-9),
    archived_at: null,
  },
];

export const checklists: DocumentChecklist[] = [
  { id: "cl1", owner_id: OWNER, client_id: "c1", hr_case_id: "d1", title: "Dossier d'embauche", created_at: iso(-12) },
  { id: "cl2", owner_id: OWNER, client_id: "c2", hr_case_id: "d4", title: "Checklist onboarding", created_at: iso(-7) },
];

export const checklistItems: ChecklistItem[] = [
  { id: "ci1", checklist_id: "cl1", name: "Pièce d'identité", required: true, status: "demande", document_id: null, comment: "Recto-verso lisible", created_at: iso(-12), updated_at: iso(-6) },
  { id: "ci2", checklist_id: "cl1", name: "RIB", required: true, status: "demande", document_id: null, comment: null, created_at: iso(-12), updated_at: iso(-6) },
  { id: "ci3", checklist_id: "cl1", name: "Justificatif de domicile", required: true, status: "recu", document_id: "doc1", comment: null, created_at: iso(-12), updated_at: iso(-2) },
  { id: "ci4", checklist_id: "cl1", name: "Fiche de renseignements", required: true, status: "valide", document_id: "doc2", comment: null, created_at: iso(-12), updated_at: iso(-4) },
  { id: "ci5", checklist_id: "cl1", name: "Contrat signé", required: true, status: "demande", document_id: null, comment: "À envoyer après réception des pièces", created_at: iso(-12), updated_at: iso(-12) },
  { id: "ci6", checklist_id: "cl1", name: "CV", required: false, status: "valide", document_id: "doc3", comment: null, created_at: iso(-12), updated_at: iso(-10) },
  { id: "ci7", checklist_id: "cl2", name: "Pièce d'identité", required: true, status: "recu", document_id: "doc4", comment: null, created_at: iso(-7), updated_at: iso(-1) },
  { id: "ci8", checklist_id: "cl2", name: "RIB", required: true, status: "valide", document_id: "doc5", comment: null, created_at: iso(-7), updated_at: iso(-3) },
  { id: "ci9", checklist_id: "cl2", name: "Carte vitale", required: true, status: "demande", document_id: null, comment: null, created_at: iso(-7), updated_at: iso(-7) },
  { id: "ci10", checklist_id: "cl2", name: "Diplôme", required: false, status: "demande", document_id: null, comment: null, created_at: iso(-7), updated_at: iso(-7) },
];

export const documents: DocumentItem[] = [
  { id: "doc1", owner_id: OWNER, client_id: "c1", hr_case_id: "d1", checklist_item_id: "ci3", name: "Justificatif domicile - Clara Martin.pdf", file_url: null, file_type: "application/pdf", document_type: "justificatif", status: "recu", expiration_date: null, uploaded_by: "ct1", created_at: iso(-2), updated_at: iso(-2) },
  { id: "doc2", owner_id: OWNER, client_id: "c1", hr_case_id: "d1", checklist_item_id: "ci4", name: "Fiche renseignements - Clara Martin.pdf", file_url: null, file_type: "application/pdf", document_type: "justificatif", status: "valide", expiration_date: null, uploaded_by: OWNER, created_at: iso(-4), updated_at: iso(-4) },
  { id: "doc3", owner_id: OWNER, client_id: "c1", hr_case_id: "d1", checklist_item_id: "ci6", name: "CV - Clara Martin.pdf", file_url: null, file_type: "application/pdf", document_type: "cv", status: "valide", expiration_date: null, uploaded_by: OWNER, created_at: iso(-10), updated_at: iso(-10) },
  { id: "doc4", owner_id: OWNER, client_id: "c2", hr_case_id: "d4", checklist_item_id: "ci7", name: "CNI - Kevin Rosé.jpg", file_url: null, file_type: "image/jpeg", document_type: "piece_identite", status: "recu", expiration_date: dateOnly(400), uploaded_by: "ct2", created_at: iso(-1), updated_at: iso(-1) },
  { id: "doc5", owner_id: OWNER, client_id: "c2", hr_case_id: "d4", checklist_item_id: "ci8", name: "RIB - Kevin Rosé.pdf", file_url: null, file_type: "application/pdf", document_type: "rib", status: "valide", expiration_date: null, uploaded_by: "ct2", created_at: iso(-3), updated_at: iso(-3) },
  { id: "doc6", owner_id: OWNER, client_id: "c1", hr_case_id: "d3", checklist_item_id: null, name: "Compte rendu point RH - Mai.pdf", file_url: null, file_type: "application/pdf", document_type: "compte_rendu", status: "valide", expiration_date: null, uploaded_by: OWNER, created_at: iso(-35), updated_at: iso(-35) },
];

export const tasks: Task[] = [
  { id: "t1", owner_id: OWNER, client_id: "c1", hr_case_id: "d1", title: "Relancer pour le RIB", description: "Relancer Marie pour le RIB de Clara Martin.", type: "relance_client", status: "a_faire", priority: "haute", due_date: dateOnly(0), estimated_minutes: 15, completed_at: null, created_at: iso(-6), updated_at: iso(-1) },
  { id: "t2", owner_id: OWNER, client_id: "c1", hr_case_id: "d3", title: "Générer le compte rendu du point RH", description: "Rédiger et générer le compte rendu mensuel.", type: "preparation_document", status: "a_faire", priority: "normale", due_date: dateOnly(0), estimated_minutes: 45, completed_at: null, created_at: iso(-3), updated_at: iso(-1) },
  { id: "t3", owner_id: OWNER, client_id: "c1", hr_case_id: null, title: "Préparer la pré-facture du mois", description: "Consolider le temps passé et préparer la pré-facture mensuelle.", type: "facturation", status: "a_faire", priority: "normale", due_date: dateOnly(1), estimated_minutes: 30, completed_at: null, created_at: iso(-2), updated_at: iso(-2) },
  { id: "t4", owner_id: OWNER, client_id: "c2", hr_case_id: "d4", title: "Vérifier les documents reçus", description: "Vérifier les pièces déposées par Kevin Rosé.", type: "verification_dossier", status: "en_cours", priority: "normale", due_date: dateOnly(0), estimated_minutes: 20, completed_at: null, created_at: iso(-2), updated_at: iso(0) },
  { id: "t5", owner_id: OWNER, client_id: "c2", hr_case_id: "d4", title: "Envoyer la checklist onboarding", description: "Transmettre la checklist d'onboarding au client.", type: "demande_document", status: "a_faire", priority: "haute", due_date: dateOnly(2), estimated_minutes: 15, completed_at: null, created_at: iso(-1), updated_at: iso(-1) },
  { id: "t6", owner_id: OWNER, client_id: "c2", hr_case_id: "d5", title: "Relancer pour la liste des salariés", description: "Dossier bloqué : relancer le client.", type: "relance_client", status: "en_retard", priority: "urgente", due_date: dateOnly(-3), estimated_minutes: 15, completed_at: null, created_at: iso(-9), updated_at: iso(-3) },
  { id: "t7", owner_id: OWNER, client_id: "c2", hr_case_id: null, title: "Ajouter le temps passé de la semaine", description: "Saisir les heures de la semaine pour Caraïbes Distribution.", type: "suivi_administratif", status: "a_faire", priority: "basse", due_date: dateOnly(1), estimated_minutes: 10, completed_at: null, created_at: iso(-1), updated_at: iso(-1) },
  { id: "t8", owner_id: OWNER, client_id: "c1", hr_case_id: "d2", title: "Appeler Marie pour les justificatifs", description: "Point téléphonique sur les justificatifs salarié.", type: "appel", status: "termine", priority: "normale", due_date: dateOnly(-2), estimated_minutes: 20, completed_at: iso(-2), created_at: iso(-5), updated_at: iso(-2) },
];

export const timeEntries: TimeEntry[] = [
  { id: "te1", owner_id: OWNER, client_id: "c1", hr_case_id: "d1", task_id: null, date: dateOnly(-1), duration_minutes: 90, description: "Constitution dossier embauche Clara Martin", billable: true, hourly_rate: 65, created_at: iso(-1) },
  { id: "te2", owner_id: OWNER, client_id: "c1", hr_case_id: "d3", task_id: null, date: dateOnly(-2), duration_minutes: 60, description: "Préparation point RH mensuel", billable: true, hourly_rate: 65, created_at: iso(-2) },
  { id: "te3", owner_id: OWNER, client_id: "c1", hr_case_id: null, task_id: null, date: dateOnly(-4), duration_minutes: 30, description: "Échanges email divers", billable: false, hourly_rate: 65, created_at: iso(-4) },
  { id: "te4", owner_id: OWNER, client_id: "c2", hr_case_id: "d4", task_id: null, date: dateOnly(-1), duration_minutes: 75, description: "Onboarding Kevin Rosé — préparation", billable: true, hourly_rate: 70, created_at: iso(-1) },
  { id: "te5", owner_id: OWNER, client_id: "c2", hr_case_id: "d5", task_id: null, date: dateOnly(-3), duration_minutes: 45, description: "Suivi documents salariés", billable: true, hourly_rate: 70, created_at: iso(-3) },
  { id: "te6", owner_id: OWNER, client_id: "c2", hr_case_id: null, task_id: null, date: dateOnly(-6), duration_minutes: 120, description: "Mise en place process onboarding", billable: true, hourly_rate: 70, created_at: iso(-6) },
];

export const preInvoices: PreInvoice[] = [
  { id: "pi1", owner_id: OWNER, client_id: "c1", period_start: dateOnly(-30), period_end: dateOnly(0), subtotal: 850, total: 850, status: "a_preparer", pdf_url: null, notes: "Forfait mensuel + 3h de prestations ponctuelles.", created_at: iso(-1), updated_at: iso(-1) },
  { id: "pi2", owner_id: OWNER, client_id: "c2", period_start: dateOnly(-30), period_end: dateOnly(0), subtotal: 1260, total: 1260, status: "a_verifier", pdf_url: null, notes: "Régie 18h + forfait onboarding.", created_at: iso(-2), updated_at: iso(-1) },
];

export const emailTemplates: EmailTemplate[] = [
  {
    id: "et1",
    owner_id: OWNER,
    title: "Relance documents manquants",
    type: "relance_documents",
    subject: "Documents manquants — dossier {{dossier}}",
    body:
      "Bonjour {{contact}},\n\nDans le cadre du dossier « {{dossier}} », il nous manque encore les pièces suivantes :\n\n{{liste_documents}}\n\nPourriez-vous nous les transmettre dès que possible afin de poursuivre le traitement ?\n\nJe reste à votre disposition.\n\nBien cordialement,\n{{signature}}",
    variables: ["contact", "dossier", "liste_documents", "signature"],
    created_at: iso(-60),
    updated_at: iso(-60),
  },
  {
    id: "et2",
    owner_id: OWNER,
    title: "Confirmation réception dossier",
    type: "confirmation_reception",
    subject: "Bonne réception — dossier {{dossier}}",
    body:
      "Bonjour {{contact}},\n\nJe vous confirme la bonne réception des éléments pour le dossier « {{dossier}} ». Je reviens vers vous sous peu pour la suite.\n\nBien cordialement,\n{{signature}}",
    variables: ["contact", "dossier", "signature"],
    created_at: iso(-60),
    updated_at: iso(-60),
  },
  {
    id: "et3",
    owner_id: OWNER,
    title: "Rappel d'échéance",
    type: "rappel_echeance",
    subject: "Rappel — échéance {{date}} pour {{dossier}}",
    body:
      "Bonjour {{contact}},\n\nPetit rappel concernant l'échéance du {{date}} pour le dossier « {{dossier}} ». N'hésitez pas à revenir vers moi si besoin.\n\nBien cordialement,\n{{signature}}",
    variables: ["contact", "dossier", "date", "signature"],
    created_at: iso(-50),
    updated_at: iso(-50),
  },
];

export const generatedEmails: GeneratedEmail[] = [
  {
    id: "ge1",
    owner_id: OWNER,
    client_id: "c1",
    hr_case_id: "d1",
    template_id: "et1",
    subject: "Documents manquants — dossier Embauche — Clara Martin",
    body:
      "Bonjour Marie,\n\nDans le cadre du dossier « Embauche — Clara Martin », il nous manque encore les pièces suivantes :\n\n- Pièce d'identité\n- RIB\n- Contrat signé\n\nPourriez-vous nous les transmettre dès que possible ?\n\nBien cordialement,\nLucas Mezen",
    status: "brouillon",
    created_at: iso(-1),
  },
];

export const clientRequests: ClientRequest[] = [
  {
    id: "cr1",
    client_id: "c2",
    created_by: "ct2",
    title: "Besoin d'un modèle d'attestation de travail",
    type: "besoin_document",
    priority: "normale",
    description: "Pourriez-vous nous préparer une attestation de travail pour un salarié ? Merci.",
    status: "nouvelle",
    due_date: dateOnly(5),
    converted_to_task_id: null,
    converted_to_case_id: null,
    created_at: iso(-1),
    updated_at: iso(-1),
  },
];

export const comments: Comment[] = [
  { id: "cm1", owner_id: OWNER, client_id: "c2", hr_case_id: "d4", client_request_id: null, body: "J'ai bien déposé la pièce d'identité, est-ce que tout est bon ?", visibility: "client_visible", created_by: "ct2", created_at: iso(-1) },
  { id: "cm2", owner_id: OWNER, client_id: "c1", hr_case_id: "d1", client_request_id: null, body: "Penser à vérifier la cohérence de l'adresse sur le justificatif.", visibility: "internal", created_by: OWNER, created_at: iso(-2) },
];

export const activityLogs: ActivityLog[] = [
  { id: "al1", owner_id: OWNER, client_id: "c2", hr_case_id: "d4", action_type: "document_ajoute", description: "Kevin Rosé a déposé « CNI - Kevin Rosé.jpg »", actor_id: "ct2", created_at: iso(-1, 14) },
  { id: "al2", owner_id: OWNER, client_id: "c1", hr_case_id: "d1", action_type: "mail_genere", description: "Mail de relance généré pour le dossier Embauche — Clara Martin", actor_id: OWNER, created_at: iso(-1, 11) },
  { id: "al3", owner_id: OWNER, client_id: "c1", hr_case_id: "d8", action_type: "tache_terminee", description: "Tâche « Appeler Marie pour les justificatifs » terminée", actor_id: OWNER, created_at: iso(-2, 16) },
  { id: "al4", owner_id: OWNER, client_id: "c1", hr_case_id: "d1", action_type: "temps_ajoute", description: "1h30 saisies sur le dossier Embauche — Clara Martin", actor_id: OWNER, created_at: iso(-1, 17) },
  { id: "al5", owner_id: OWNER, client_id: "c2", hr_case_id: "d4", action_type: "commentaire_ajoute", description: "Nouveau commentaire client sur l'onboarding", actor_id: "ct2", created_at: iso(-1, 9) },
  { id: "al6", owner_id: OWNER, client_id: "c1", hr_case_id: "d3", action_type: "dossier_maj", description: "Dossier « Point RH mensuel » passé à « À valider »", actor_id: OWNER, created_at: iso(0, 8) },
];

export const notifications: AppNotification[] = [
  { id: "n1", user_id: OWNER, client_id: "c2", hr_case_id: "d4", title: "Nouveau document déposé", message: "Kevin Rosé a déposé sa pièce d'identité.", type: "document_depose", status: "non_lue", created_at: iso(-1, 14) },
  { id: "n2", user_id: OWNER, client_id: "c2", hr_case_id: null, title: "Nouvelle demande client", message: "Caraïbes Distribution a créé une demande : attestation de travail.", type: "demande_client", status: "non_lue", created_at: iso(-1, 9) },
  { id: "n3", user_id: OWNER, client_id: "c2", hr_case_id: "d5", title: "Dossier bloqué", message: "« Mise à jour documents salariés » est bloqué depuis 9 jours.", type: "dossier_bloque", status: "non_lue", created_at: iso(0, 8) },
  { id: "n4", user_id: OWNER, client_id: "c1", hr_case_id: "d1", title: "Document manquant", message: "Le RIB est toujours manquant pour Embauche — Clara Martin.", type: "document_manquant", status: "lue", created_at: iso(-1, 10) },
  { id: "n5", user_id: OWNER, client_id: "c2", hr_case_id: "d5", title: "Tâche en retard", message: "« Relancer pour la liste des salariés » est en retard.", type: "tache_retard", status: "non_lue", created_at: iso(-3, 9) },
];
