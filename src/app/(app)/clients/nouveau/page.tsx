import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { NewClientForm } from "@/components/clients/new-client-form";

export default function NouveauClientPage() {
  return (
    <div className="space-y-6">
      <Button asChild variant="ghost" size="sm" className="-ml-2 w-fit text-muted-foreground">
        <Link href="/clients">
          <ArrowLeft className="size-4" /> Retour aux clients
        </Link>
      </Button>

      <PageHeader title="Nouveau client" description="Ajoutez une entreprise que vous accompagnez." />

      <NewClientForm />
    </div>
  );
}
