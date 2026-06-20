// Types métier Ops RH — alignés sur le schéma Supabase (voir supabase/migrations).

export type UserRole = "freelance" | "collaborateur" | "client" | "platform_admin";

export type ClientStatus = "actif" | "en_pause" | "termine";

export type CaseStatus =
  | "nouveau"
  | "en_cours"
  | "en_attente_client"
  | "a_completer"
  | "bloque"
  | "a_valider"
  | "termine"
  | "archive";

export type CaseType =
  | "embauche"
  | "onboarding"
  | "suivi_salarie"
  | "demande_document"
  | "preparation_contrat"
  | "rupture"
  | "procedure"
  | "accompagnement"
  | "autre";

export type Priority = "basse" | "normale" | "haute" | "urgente";

export type TaskStatus = "a_faire" | "en_cours" | "en_attente" | "termine" | "en_retard";

export type TaskType =
  | "relance_client"
  | "demande_document"
  | "preparation_document"
  | "verification_dossier"
  | "appel"
  | "point_client"
  | "suivi_administratif"
  | "facturation"
  | "autre";

export type DocumentStatus =
  | "demande"
  | "recu"
  | "valide"
  | "a_corriger"
  | "expire"
  | "archive";

export type DocumentType =
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

export type PreInvoiceStatus =
  | "a_preparer"
  | "a_verifier"
  | "prete"
  | "exportee"
  | "archivee";

export type ClientRequestStatus = "nouvelle" | "en_cours" | "convertie" | "close";

export type ClientRequestType =
  | "besoin_document"
  | "demande_contrat"
  | "demande_conseil"
  | "demande_relance"
  | "demande_administrative"
  | "autre";

export type CommentVisibility = "internal" | "client_visible";

export type NotificationStatus = "non_lue" | "lue" | "traitee";

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  avatar_url: string | null;
  company_name: string | null;
  created_at: string;
}

export interface Client {
  id: string;
  owner_id: string;
  name: string;
  sector: string | null;
  address: string | null;
  siret: string | null;
  main_contact_name: string | null;
  main_contact_email: string | null;
  main_contact_phone: string | null;
  status: ClientStatus;
  notes: string | null;
  collaboration_type: string | null;
  collaboration_start_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface ClientContact {
  id: string;
  client_id: string;
  name: string;
  email: string | null;
  phone: string | null;
  role: string | null;
  portal_access: boolean;
  created_at: string;
}

export interface HrCase {
  id: string;
  owner_id: string;
  client_id: string;
  title: string;
  person_name: string | null;
  case_type: CaseType;
  description: string | null;
  status: CaseStatus;
  priority: Priority;
  due_date: string | null;
  internal_notes: string | null;
  created_at: string;
  updated_at: string;
  archived_at: string | null;
}

export interface Task {
  id: string;
  owner_id: string;
  client_id: string | null;
  hr_case_id: string | null;
  title: string;
  description: string | null;
  type: TaskType;
  status: TaskStatus;
  priority: Priority;
  due_date: string | null;
  estimated_minutes: number | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface DocumentItem {
  id: string;
  owner_id: string;
  client_id: string | null;
  hr_case_id: string | null;
  checklist_item_id: string | null;
  name: string;
  file_url: string | null;
  file_type: string | null;
  document_type: DocumentType;
  status: DocumentStatus;
  expiration_date: string | null;
  uploaded_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface DocumentChecklist {
  id: string;
  owner_id: string;
  client_id: string | null;
  hr_case_id: string | null;
  title: string;
  created_at: string;
}

export interface ChecklistItem {
  id: string;
  checklist_id: string;
  name: string;
  required: boolean;
  status: DocumentStatus;
  document_id: string | null;
  comment: string | null;
  created_at: string;
  updated_at: string;
}

export interface EmailTemplate {
  id: string;
  owner_id: string;
  title: string;
  type: string;
  subject: string;
  body: string;
  variables: string[];
  created_at: string;
  updated_at: string;
}

export interface GeneratedEmail {
  id: string;
  owner_id: string;
  client_id: string | null;
  hr_case_id: string | null;
  template_id: string | null;
  subject: string;
  body: string;
  status: string;
  created_at: string;
}

export interface DocumentTemplate {
  id: string;
  owner_id: string;
  title: string;
  type: string;
  content: string;
  variables: string[];
  created_at: string;
  updated_at: string;
}

export interface GeneratedDocument {
  id: string;
  owner_id: string;
  client_id: string | null;
  hr_case_id: string | null;
  template_id: string | null;
  title: string;
  content: string;
  pdf_url: string | null;
  status: string;
  created_at: string;
}

export interface TimeEntry {
  id: string;
  owner_id: string;
  client_id: string | null;
  hr_case_id: string | null;
  task_id: string | null;
  date: string;
  duration_minutes: number;
  description: string | null;
  billable: boolean;
  hourly_rate: number | null;
  created_at: string;
}

export interface BillingSettings {
  id: string;
  owner_id: string;
  client_id: string;
  hourly_rate: number | null;
  monthly_retainer: number | null;
  billing_notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface PreInvoice {
  id: string;
  owner_id: string;
  client_id: string;
  period_start: string;
  period_end: string;
  subtotal: number;
  total: number;
  status: PreInvoiceStatus;
  pdf_url: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface ClientRequest {
  id: string;
  client_id: string;
  created_by: string | null;
  title: string;
  type: ClientRequestType;
  priority: Priority;
  description: string | null;
  status: ClientRequestStatus;
  due_date: string | null;
  converted_to_task_id: string | null;
  converted_to_case_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Comment {
  id: string;
  owner_id: string | null;
  client_id: string | null;
  hr_case_id: string | null;
  client_request_id: string | null;
  body: string;
  visibility: CommentVisibility;
  created_by: string;
  created_at: string;
}

export interface ActivityLog {
  id: string;
  owner_id: string;
  client_id: string | null;
  hr_case_id: string | null;
  action_type: string;
  description: string;
  actor_id: string | null;
  created_at: string;
}

export interface AppNotification {
  id: string;
  user_id: string;
  client_id: string | null;
  hr_case_id: string | null;
  href?: string | null;
  entity_type?: string | null;
  entity_id?: string | null;
  title: string;
  message: string;
  type: string;
  status: NotificationStatus;
  created_at: string;
}
