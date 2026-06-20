import type {
  AppNotification,
  ActivityLog,
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

export const getProfile = (): Profile => ({
  id: "",
  email: "",
  full_name: "",
  role: "freelance" as const,
  avatar_url: null,
  company_name: null,
  created_at: new Date(0).toISOString(),
});

export const getClients = (): Client[] => [];
export const getClient = (_id: string): Client | null => null;
export const getContacts = (): ClientContact[] => [];
export const getClientContacts = (_clientId: string): ClientContact[] => [];
export const getCases = (): HrCase[] => [];
export const getCase = (_id: string): HrCase | null => null;
export const getClientCases = (_clientId: string): HrCase[] => [];
export const getTasks = (): Task[] => [];
export const getClientTasks = (_clientId: string): Task[] => [];
export const getCaseTasks = (_caseId: string): Task[] => [];
export const getDocuments = (): DocumentItem[] => [];
export const getClientDocuments = (_clientId: string): DocumentItem[] => [];
export const getCaseDocuments = (_caseId: string): DocumentItem[] => [];
export const getChecklists = (): DocumentChecklist[] => [];
export const getCaseChecklists = (_caseId: string): DocumentChecklist[] => [];
export const getChecklistItems = (_checklistId: string): ChecklistItem[] => [];
export const getAllChecklistItems = (): ChecklistItem[] => [];
export const getTimeEntries = (): TimeEntry[] => [];
export const getClientTimeEntries = (_clientId: string): TimeEntry[] => [];
export const getCaseTimeEntries = (_caseId: string): TimeEntry[] => [];
export const getPreInvoices = (): PreInvoice[] => [];
export const getClientPreInvoices = (_clientId: string): PreInvoice[] => [];
export const getEmailTemplates = (): EmailTemplate[] => [];
export const getGeneratedEmails = (): GeneratedEmail[] => [];
export const getCaseEmails = (_caseId: string): GeneratedEmail[] => [];
export const getClientRequests = (): ClientRequest[] => [];
export const getComments = (): Comment[] => [];
export const getCaseComments = (_caseId: string): Comment[] => [];
export const getActivity = (): ActivityLog[] => [];
export const getClientActivity = (_clientId: string): ActivityLog[] => [];
export const getCaseActivity = (_caseId: string): ActivityLog[] => [];
export const getNotifications = (): AppNotification[] => [];

export function clientActiveCasesCount(_clientId: string) {
  return 0;
}

export function missingChecklistItems(): ChecklistItem[] {
  return [];
}

export function clientMissingDocsCount(_clientId: string) {
  return 0;
}

export function caseMissingDocsCount(_caseId: string) {
  return 0;
}

export function caseReceivedDocsCount(_caseId: string) {
  return { received: 0, total: 0 };
}

export function clientMinutesThisMonth(_clientId: string) {
  return 0;
}

export function clientBillableAmount(_clientId: string) {
  return 0;
}

export function totalMinutesThisMonth() {
  return 0;
}

export function totalBillableThisMonth() {
  return 0;
}

export function openTasks(): Task[] {
  return [];
}

export function overdueTasks(): Task[] {
  return [];
}

export function todayTasks(): Task[] {
  return [];
}

export function blockedCases(): HrCase[] {
  return [];
}

export function relancesToDo(): Task[] {
  return [];
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
  return [];
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
    todayTasks: 0,
    overdueTasks: 0,
    missingDocs: 0,
    blockedCases: 0,
    relances: 0,
    minutesThisMonth: 0,
    billableThisMonth: 0,
  };
}

export function unreadNotificationsCount() {
  return 0;
}
