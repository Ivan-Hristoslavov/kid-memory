"use client";

import { useActionState, useState } from "react";
import { Check, Loader2, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { emailDraftLink, type DraftState } from "@/app/actions/draft";

/**
 * "Send me the link" on the preview step. The generation is already paid for by
 * the time this shows, so keeping the visitor reachable is much cheaper than
 * letting them close the tab and start over.
 */
export function SaveDraft({ orderId, defaultEmail }: { orderId: string; defaultEmail?: string }) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState<DraftState, FormData>(emailDraftLink, {});

  if (state.ok) {
    return (
      <p className="flex items-center justify-center gap-2 text-sm font-semibold text-emerald-700">
        <Check className="size-4" /> Изпратихме ти връзката. Провери пощата си.
      </p>
    );
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground"
      >
        <Mail className="size-4" /> Изпрати ми връзката, за да реша по-късно
      </button>
    );
  }

  return (
    <form action={action} className="w-full max-w-sm space-y-2">
      <input type="hidden" name="orderId" value={orderId} />
      <div className="flex gap-2">
        <Input
          name="email"
          type="email"
          required
          defaultValue={defaultEmail}
          placeholder="твоят@имейл.bg"
          className="h-11 rounded-2xl"
          aria-label="Имейл за връзката"
        />
        <Button type="submit" disabled={pending} className="h-11 shrink-0 rounded-2xl px-5">
          {pending ? <Loader2 className="size-4 animate-spin" /> : "Изпрати"}
        </Button>
      </div>
      {state.error && <p className="text-sm text-destructive">{state.error}</p>}
      <p className="text-xs text-muted-foreground">
        Изпращаме само тази връзка — без бюлетини.
      </p>
    </form>
  );
}
