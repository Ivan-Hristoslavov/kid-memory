"use client";

import { useActionState } from "react";
import { Check, Loader2, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { requestAccessLink, type AccessState } from "@/app/actions/my-posters";

/** Asks for the email a customer ordered with and mails back a one-time link. */
export function AccessRequestForm() {
  const [state, action, pending] = useActionState<AccessState, FormData>(
    requestAccessLink,
    {}
  );

  if (state.ok) {
    return (
      <p className="bg-card ring-1 ring-border mx-auto flex max-w-md items-center justify-center gap-2 rounded-xl p-5 text-center font-semibold text-emerald-700">
        <Check className="size-5" />
        Ако имаме поръчки на този имейл, връзката вече пътува към теб.
      </p>
    );
  }

  return (
    <form action={action} className="mx-auto flex max-w-md gap-2">
      <Input
        name="email"
        type="email"
        required
        placeholder="имейлът от поръчката"
        aria-label="Имейл"
        className="h-12 rounded-xl"
      />
      <Button type="submit" size="lg" disabled={pending} className="shrink-0 rounded-xl">
        {pending ? <Loader2 className="size-5 animate-spin" /> : <Mail className="size-5" />}
        Изпрати
      </Button>
    </form>
  );
}
