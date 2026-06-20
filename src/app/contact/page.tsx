import Link from "next/link";
import { APP_CONFIG } from "@/lib/app-config";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ContactForm } from "./contact-form";

export default function ContactPage() {
  return (
    <main className="mx-auto max-w-3xl space-y-6 px-4 py-10">
      <Link href="/login" className="text-sm text-primary hover:underline">Ops RH</Link>
      <Card>
        <CardHeader>
          <CardTitle>Contact</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-sm text-muted-foreground">
            Pour toute question commerciale, support ou confidentialité :{" "}
            <a className="text-primary hover:underline" href={`mailto:${APP_CONFIG.contactEmail}`}>{APP_CONFIG.contactEmail}</a>.
          </p>
          <ContactForm />
        </CardContent>
      </Card>
    </main>
  );
}
