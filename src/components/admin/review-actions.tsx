"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import { Check, Star, Trash2, Undo2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { moderateReview, type AdminState } from "@/app/actions/admin-extra";

const OPS = {
  approve: { label: "Одобри", icon: Check, variant: "default" as const },
  reject: { label: "Отхвърли", icon: X, variant: "outline" as const },
  pending: { label: "Върни за преглед", icon: Undo2, variant: "outline" as const },
  feature: { label: "Открояване", icon: Star, variant: "outline" as const },
  delete: { label: "Изтрий", icon: Trash2, variant: "outline" as const },
};

export function ReviewActions({
  id,
  ops,
  featured,
}: {
  id: string;
  ops: (keyof typeof OPS)[];
  featured?: boolean;
}) {
  const [state, action, pending] = useActionState<AdminState, FormData>(moderateReview, {});

  useEffect(() => {
    if (state.error) toast.error(state.error);
    if (state.ok && state.message) toast.success(state.message);
  }, [state]);

  return (
    <div className="flex flex-wrap gap-2">
      {ops.map((op) => {
        const meta = OPS[op];
        return (
          <form key={op} action={action}>
            <input type="hidden" name="id" value={id} />
            <input type="hidden" name="op" value={op} />
            <Button
              type="submit"
              size="sm"
              variant={meta.variant}
              disabled={pending}
              className={`rounded-full ${
                op === "delete" ? "text-destructive hover:text-destructive" : ""
              } ${op === "feature" && featured ? "border-amber-400 text-amber-600" : ""}`}
            >
              <meta.icon className="size-3.5" />
              {op === "feature" && featured ? "Премахни открояване" : meta.label}
            </Button>
          </form>
        );
      })}
    </div>
  );
}
