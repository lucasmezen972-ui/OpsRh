import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EditCaseForm } from "@/components/cases/edit-case-form";
import { getCase } from "@/lib/data";
import { getSupabaseCaseDetail } from "@/lib/supabase/details";
import type { HrCase } from "@/lib/types";

export default async function ModifierDossierPage({ params }: { params: { id: string } }) {
  const result = await getSupabaseCaseDetail(params.id);
  if (result.status === "not_found") notFound();

  let hrCase: HrCase;
  let isDemo = false;
  if (result.status === "ok") {
    hrCase = result.detail.hrCase;
  } else {
    const demo = getCase(params.id);
    if (!demo) notFound();
    hrCase = demo;
    isDemo = true;
  }

  return (
    <div className="space-y-6">
      <Button asChild variant="ghost" size="sm" className="-ml-2 w-fit text-muted-foreground">
        <Link href={`/dossiers/${hrCase.id}`}>
          <ArrowLeft className="size-4" /> Retour au dossier
        </Link>
      </Button>

      <PageHeader title={`Modifier — ${hrCase.title}`} description="Mettez à jour les informations du dossier.">

      </PageHeader>

      <EditCaseForm hrCase={hrCase} />
    </div>
  );
}
