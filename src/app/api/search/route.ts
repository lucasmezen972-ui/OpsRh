import { NextResponse } from "next/server";
import { getCases, getClients, getDocuments, getTasks } from "@/lib/data";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";

type SearchType = "Client" | "Dossier" | "Tache" | "Document";

interface SearchResult {
  id: string;
  type: SearchType;
  title: string;
  subtitle: string;
  href: string;
}

function includes(value: string | null | undefined, query: string) {
  return (value ?? "").toLowerCase().includes(query);
}

export async function GET(request: Request) {
  const query = new URL(request.url).searchParams.get("q")?.trim().toLowerCase() ?? "";
  if (query.length < 2) return NextResponse.json({ results: [] });

  const supabase = createClient();
  if (isSupabaseConfigured && supabase) {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const [clients, cases, tasks, documents] = await Promise.all([
        supabase
          .from("clients")
          .select("id,name,sector,main_contact_name")
          .eq("owner_id", user.id)
          .ilike("name", `%${query}%`)
          .limit(5),
        supabase
          .from("hr_cases")
          .select("id,title,person_name,status")
          .eq("owner_id", user.id)
          .or(`title.ilike.%${query}%,person_name.ilike.%${query}%`)
          .limit(5),
        supabase
          .from("tasks")
          .select("id,title,status,due_date")
          .eq("owner_id", user.id)
          .ilike("title", `%${query}%`)
          .limit(5),
        supabase
          .from("documents")
          .select("id,name,status")
          .eq("owner_id", user.id)
          .ilike("name", `%${query}%`)
          .limit(5),
      ]);

      const results: SearchResult[] = [
        ...((clients.data ?? []).map((item) => ({
          id: item.id,
          type: "Client" as const,
          title: item.name,
          subtitle: item.sector ?? item.main_contact_name ?? "Client",
          href: `/clients/${item.id}`,
        }))),
        ...((cases.data ?? []).map((item) => ({
          id: item.id,
          type: "Dossier" as const,
          title: item.title,
          subtitle: item.person_name ?? item.status ?? "Dossier RH",
          href: `/dossiers/${item.id}`,
        }))),
        ...((tasks.data ?? []).map((item) => ({
          id: item.id,
          type: "Tache" as const,
          title: item.title,
          subtitle: item.due_date ?? item.status ?? "Tache",
          href: `/taches?taskId=${item.id}`,
        }))),
        ...((documents.data ?? []).map((item) => ({
          id: item.id,
          type: "Document" as const,
          title: item.name,
          subtitle: item.status ?? "Document",
          href: "/documents",
        }))),
      ].slice(0, 12);

      return NextResponse.json({ results });
    }
  }

  const results: SearchResult[] = [
    ...getClients()
      .filter((item) => includes(item.name, query) || includes(item.sector, query) || includes(item.main_contact_name, query))
      .map((item) => ({
        id: item.id,
        type: "Client" as const,
        title: item.name,
        subtitle: item.sector ?? item.main_contact_name ?? "Client",
        href: `/clients/${item.id}`,
      })),
    ...getCases()
      .filter((item) => includes(item.title, query) || includes(item.person_name, query))
      .map((item) => ({
        id: item.id,
        type: "Dossier" as const,
        title: item.title,
        subtitle: item.person_name ?? item.status,
        href: `/dossiers/${item.id}`,
      })),
    ...getTasks()
      .filter((item) => includes(item.title, query) || includes(item.description, query))
      .map((item) => ({
        id: item.id,
        type: "Tache" as const,
        title: item.title,
        subtitle: item.due_date ?? item.status,
        href: `/taches?taskId=${item.id}`,
      })),
    ...getDocuments()
      .filter((item) => includes(item.name, query))
      .map((item) => ({
        id: item.id,
        type: "Document" as const,
        title: item.name,
        subtitle: item.status,
        href: "/documents",
      })),
  ].slice(0, 12);

  return NextResponse.json({ results });
}
