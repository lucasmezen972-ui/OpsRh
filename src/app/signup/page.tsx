import { redirect } from "next/navigation";
import { Suspense } from "react";
import { Card } from "@/components/ui/card";
import { isAuthenticated } from "@/lib/supabase/session";
import { AuthForm } from "@/app/login/auth-form";

export default async function SignupPage() {
  if (await isAuthenticated()) redirect("/dashboard");

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-6">
      <Card className="w-full max-w-md p-8">
        <Suspense>
          <AuthForm initialMode="signup" />
        </Suspense>
      </Card>
    </div>
  );
}
