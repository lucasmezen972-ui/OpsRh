import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { NewCaseForm } from "@/components/cases/new-case-form";

export default function NouveauDossierPage({ searchParams }: { searchParams?: { clientId?: string } }) {
  return (
    <div className="space-y-6">
      <Button asChild variant="ghost" size="sm" className="-ml-2 w-fit text-muted-foreground">
        <Link href="/dossiers">
          <ArrowLeft className="size-4" /> Retour aux dossiers
        </Link>
      </Button>

      <PageHeader title="Nouveau dossier RH" description="Créez un espace de suivi pour une action RH précise." />

      <NewCaseForm defaultClientId={searchParams?.clientId ?? ""} />
    </div>
  );
}
