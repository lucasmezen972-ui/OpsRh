// Couche d'accès aux données.
// Aujourd'hui : données de démonstration en mémoire (src/lib/sample-data.ts).
// Demain : remplacer chaque fonction par une requête Supabase équivalente,
// sans toucher aux composants qui les consomment.

import * as sample from "./sample-data";
import type { Client, HrCase, Task } from "./types";
import { daysSince, isOverdue } from "./utils";

export const getProfile = () => sample.profile;
export const getClients = () => sample.clients;
export const getClient = (id: string) => sample.clients.find((c) => c.id === id) ?? null;
export const getContacts = () => sample.clientContacts;
export const getClientContacts = (clientId: string) =>
  sample.clientContacts.filter((c) => c.client_id === clientId);
export const getCases = () => sample.hrCases;
export const getCase = (id: string) => sample.hrCases.find((c) => c.id === id) ?? null;
export const getClientCases = (clientId: string) =>
  sample.hrCases.filter((c) => c.client_id === clientId);
export const getTasks = () => sample.tasks;
export const getClientTasks = (clientId: string) =>
  sample.tasks.filter((t) => t.client_id === clientId);
export const getCaseTasks = (caseId: string) =>
  sample.tasks.filter((t) => t.hr_case_id === caseId);
export const getDocuments = () => sample.documents;
export const getClientDocuments = (clientId: string) =>
  sample.documents.filter((d) => d.client_id === clientId);
export const getCaseDocuments = (caseId: string) =>
  sample.documents.filter((d) => d.hr_case_id === caseId);
export const getChecklists = () => sample.checklists;
export const getCaseChecklists = (caseId: string) =>
  sample.checklists.filter((c) => c.hr_case_id === caseId);
export const getChecklistItems = (checklistId: string) =>
  sample.checklistItems.filter((i) => i.checklist_id === checklistId);
export const getAllChecklistItems = () => sample.checklistItems;
export const getTimeEntries = () => sample.timeEntries;
export const getClientTimeEntries = (clientId: string) =>
  sample.timeEntries.filter((t) => t.client_id === clientId);
export const getCaseTimeEntries = (caseId: string) =>
  sample.timeEntries.filter((t) => t.hr_case_id === caseId);
export const getPreInvoices = () => sample.preInvoices;
export const getClientPreInvoices = (clientId: string) =>
  sample.preInvoices.filter((p) => p.client_id === clientId);
export const getEmailTemplates = () => sample.emailTemplates;
export const getGeneratedEmails = () => sample.generatedEmails;
export const getCaseEmails = (caseId: string) =>
  sample.generatedEmails.filter((e) => e.hr_case_id === caseId);
export const getClientRequests = () => sample.clientRequests;
export const getComments = () => sample.comments;
export const getCaseComments = (caseId: string) =>
  sample.comments.filter((c) => c.hr_case_id === caseId);
export const getActivity = () => [...sample.activityLogs].sort((a, b) => b.created_at.localeCompare(a.created_at));
export const getClientActivity = (clientId: string) =>
  getActivity().filter((a) => a.client_id === clientId);
export const getCaseActivity = (caseId: string) =>
  getActivity().filter((a) => a.hr_case_id === caseId);
export const getNotifications = () =>
  [...sample.notifications].sort((a, b) => b.created_at.localeCompare(a.created_at));

// ——— Dérivés métier ———

const ACTIVE_CASE_STATES = new Set(["nouveau", "en_cours", "en_attente_client", "a_completer", "bloque", "a_valider"]);
const MISSING_DOC_STATES = new Set(["demande", "a_corriger", "expire"]);

export function clientActiveCasesCount(clientId: string) {
  return getClientCases(clientId).filter((c) => ACTIVE_CASE_STATES.has(c.status)).length;
}

export function missingChecklistItems() {
  return sample.checklistItems.filter((i) => MISSING_DOC_STATES.has(i.status));
}

export function clientMissingDocsCount(clientId: string) {
  const caseIds = new Set(getClientCases(clientId).map((c) => c.id));
  const checklistIds = new Set(
    sample.checklists.filter((cl) => cl.hr_case_id && caseIds.has(cl.hr_case_id)).map((cl) => cl.id)
  );
  return sample.checklistItems.filter(
    (i) => checklistIds.has(i.checklist_id) && MISSING_DOC_STATES.has(i.status)
  ).length;
}

export function caseMissingDocsCount(caseId: string) {
  const checklistIds = new Set(getCaseChecklists(caseId).map((c) => c.id));
  return sample.checklistItems.filter(
    (i) => checklistIds.has(i.checklist_id) && MISSING_DOC_STATES.has(i.status)
  ).length;
}

export function caseReceivedDocsCount(caseId: string) {
  const checklistIds = new Set(getCaseChecklists(caseId).map((c) => c.id));
  const items = sample.checklistItems.filter((i) => checklistIds.has(i.checklist_id));
  const received = items.filter((i) => i.status === "recu" || i.status === "valide").length;
  return { received, total: items.length };
}

function thisMonth(dateStr: string) {
  const d = new Date(dateStr);
  const n = new Date();
  return d.getMonth() === n.getMonth() && d.getFullYear() === n.getFullYear();
}

export function clientMinutesThisMonth(clientId: string) {
  return getClientTimeEntries(clientId)
    .filter((t) => thisMonth(t.date))
    .reduce((sum, t) => sum + t.duration_minutes, 0);
}

export function clientBillableAmount(clientId: string) {
  return getClientTimeEntries(clientId)
    .filter((t) => thisMonth(t.date) && t.billable)
    .reduce((sum, t) => sum + (t.duration_minutes / 60) * (t.hourly_rate ?? 0), 0);
}

export function totalMinutesThisMonth() {
  return getTimeEntries()
    .filter((t) => thisMonth(t.date))
    .reduce((sum, t) => sum + t.duration_minutes, 0);
}

export function totalBillableThisMonth() {
  return getClients().reduce((sum, c) => sum + clientBillableAmount(c.id), 0);
}

export function openTasks() {
  return getTasks().filter((t) => t.status !== "termine");
}

export function overdueTasks() {
  return getTasks().filter(
    (t) => t.status !== "termine" && (t.status === "en_retard" || isOverdue(t.due_date))
  );
}

export function todayTasks() {
  const today = new Date().toISOString().slice(0, 10);
  return getTasks().filter(
    (t) => t.status !== "termine" && t.due_date && t.due_date <= today
  );
}

export function blockedCases() {
  return getCases().filter((c) => c.status === "bloque");
}

export function relancesToDo() {
  return getTasks().filter(
    (t) => t.type === "relance_client" && t.status !== "termine"
  );
}

export interface UrgentAlert {
  id: string;
  title: string;
  detail: string;
  kind: "document" | "task" | "case" | "deadline";
  client: Client | null;
  hrCase: HrCase | null;
  href: string;
}

export function urgentAlerts(): UrgentAlert[] {
  const alerts: UrgentAlert[] = [];

  // Documents manquants depuis plusieurs jours
  for (const item of missingChecklistItems()) {
    const days = daysSince(item.created_at);
    if (days >= 5) {
      const checklist = sample.checklists.find((c) => c.id === item.checklist_id);
      const hrCase = checklist?.hr_case_id ? getCase(checklist.hr_case_id) : null;
      const client = hrCase ? getClient(hrCase.client_id) : null;
      alerts.push({
        id: `doc-${item.id}`,
        title: `Document manquant : ${item.name}`,
        detail: `Demandé depuis ${days} jours${hrCase ? ` — ${hrCase.title}` : ""}`,
        kind: "document",
        client,
        hrCase,
        href: hrCase ? `/dossiers/${hrCase.id}` : "/documents",
      });
    }
  }

  // Tâches urgentes en retard
  for (const t of overdueTasks()) {
    if (t.priority === "urgente" || t.priority === "haute") {
      const client = t.client_id ? getClient(t.client_id) : null;
      const hrCase = t.hr_case_id ? getCase(t.hr_case_id) : null;
      alerts.push({
        id: `task-${t.id}`,
        title: t.title,
        detail: `Tâche en retard${client ? ` — ${client.name}` : ""}`,
        kind: "task",
        client,
        hrCase,
        href: "/taches",
      });
    }
  }

  // Dossiers bloqués
  for (const c of blockedCases()) {
    const client = getClient(c.client_id);
    alerts.push({
      id: `case-${c.id}`,
      title: c.title,
      detail: `Dossier bloqué${client ? ` — ${client.name}` : ""}`,
      kind: "case",
      client,
      hrCase: c,
      href: `/dossiers/${c.id}`,
    });
  }

  return alerts;
}

export interface DashboardStats {
  todayTasks: number;
  overdueTasks: number;
  missingDocs: number;
  blockedCases: number;
  relances: number;
  minutesThisMonth: number;
  billableThisMonth: number;
}

export function dashboardStats(): DashboardStats {
  return {
    todayTasks: todayTasks().length,
    overdueTasks: overdueTasks().length,
    missingDocs: missingChecklistItems().length,
    blockedCases: blockedCases().length,
    relances: relancesToDo().length,
    minutesThisMonth: totalMinutesThisMonth(),
    billableThisMonth: totalBillableThisMonth(),
  };
}

export function unreadNotificationsCount() {
  return getNotifications().filter((n) => n.status === "non_lue").length;
}
