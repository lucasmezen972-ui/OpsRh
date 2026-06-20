import {
  LayoutDashboard,
  Users,
  FolderKanban,
  CheckSquare,
  FileText,
  Mail,
  Clock,
  Receipt,
  Globe,
  Blocks,
  BarChart3,
  Settings,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  question: string;
}

// Cœur principal de l'application — chaque page répond à une question.
export const MAIN_NAV: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, question: "Que dois-je traiter aujourd'hui ?" },
  { label: "Clients", href: "/clients", icon: Users, question: "Quels clients je gère ?" },
  { label: "Dossiers RH", href: "/dossiers", icon: FolderKanban, question: "Où en sont mes dossiers ?" },
  { label: "Tâches", href: "/taches", icon: CheckSquare, question: "Que dois-je faire ?" },
  { label: "Documents", href: "/documents", icon: FileText, question: "Qu'est-ce qui manque ?" },
  { label: "Mails & modèles", href: "/mails", icon: Mail, question: "Que puis-je générer ?" },
  { label: "Temps passé", href: "/temps", icon: Clock, question: "Combien de temps ai-je travaillé ?" },
  { label: "Pré-facturation", href: "/pre-facturation", icon: Receipt, question: "Que dois-je facturer ?" },
  { label: "Portail client", href: "/portail", icon: Globe, question: "Que voit mon client ?" },
];

// Sections secondaires, volontairement séparées du cœur.
export const SECONDARY_NAV: NavItem[] = [
  { label: "Reporting", href: "/reporting", icon: BarChart3, question: "Quelle est mon activité ce mois-ci ?" },
  { label: "Modules", href: "/modules", icon: Blocks, question: "Quelles extensions activer ?" },
  { label: "Paramètres", href: "/parametres", icon: Settings, question: "Comment configurer Ops RH ?" },
];
