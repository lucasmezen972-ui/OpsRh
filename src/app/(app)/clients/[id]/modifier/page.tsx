import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EditClientForm } from "@/components/clients/edit-client-form";
import { getClient } from "@/lib/data";
import { getSupabaseClientDetail } from "@/lib/supabase/details";
import type { Client } from "@/lib/types";

export default async function ModifierClientPage({ params }: { params: { id: string } }) {
  const result = await getSupabaseClientDetail(params.id);
  if (result.status === "not_found") notFound();

  let client: Client;
  let isDemo = false;
  if (result.status === "ok") {
    client = result.detail.client;
  } else {
    const demo = getClient(params.id);
    if (!demo) notFound();
    client = demo;
    isDemo = true;
  }

  return (
    <div className="space-y-6">
      <Button asChild variant="ghost" size="sm" className="-ml-2 w-fit text-muted-foreground">
        <Link href={`/clients/${client.id}`}>
          <ArrowLeft className="size-4" /> Retour à la fiche
        </Link>
      </Button>

      <PageHeader title={`Modifier — ${client.name}`} description="Mettez à jour les informations du client.">
        {isDemo && <Badge variant="warning">Mode démo</Badge>}
      </PageHeader>

      <EditClientForm client={client} />
    </div>
  );
}
