"use client";

import { useActionState, useState } from "react";
import { motion } from "framer-motion";
import { CircleCheck, Loader2, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { submitReview, type ReviewFormState } from "@/app/actions/reviews";

export function ReviewForm() {
  const [state, action, pending] = useActionState<ReviewFormState, FormData>(
    submitReview,
    {}
  );
  const [rating, setRating] = useState(5);
  const [hover, setHover] = useState(0);
  const err = (f: string) => state.fieldErrors?.[f];

  if (state.ok) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        className="rounded-xl bg-sand p-10 text-center ring-1 ring-border"
      >
        <span className="mx-auto grid size-14 place-items-center rounded-full bg-forest/10 text-forest">
          <CircleCheck className="size-7" />
        </span>
        <h2 className="mt-5 font-heading text-2xl font-bold">Благодарим ти! ❤️</h2>
        <p className="mt-3 text-muted-foreground">
          Отзивът ти е изпратен и ще се появи в сайта веднага след като го прегледаме.
        </p>
      </motion.div>
    );
  }

  return (
    <form action={action} className="space-y-6 rounded-xl bg-sand p-6 ring-1 ring-border sm:p-8">
      {/* rating */}
      <div className="space-y-2">
        <Label>Твоята оценка</Label>
        <input type="hidden" name="rating" value={rating} />
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setRating(n)}
              onMouseEnter={() => setHover(n)}
              onMouseLeave={() => setHover(0)}
              aria-label={`${n} от 5 звезди`}
              className="transition-transform hover:scale-110"
            >
              <Star
                className={`size-8 ${
                  n <= (hover || rating)
                    ? "fill-clay text-clay"
                    : "fill-border text-border"
                }`}
              />
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="authorName">Име</Label>
          <Input
            id="authorName"
            name="authorName"
            placeholder="напр. Мария И."
            className="h-12 rounded-lg"
          />
          {err("authorName") && (
            <p className="text-sm text-destructive">{err("authorName")}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="city">Град (по избор)</Label>
          <Input
            id="city"
            name="city"
            placeholder="напр. София"
            className="h-12 rounded-lg"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="text">Разкажи ни</Label>
        <Textarea
          id="text"
          name="text"
          rows={5}
          placeholder="Как мина поръчката? Хареса ли се подаръкът?"
          className="rounded-lg"
        />
        {err("text") && <p className="text-sm text-destructive">{err("text")}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="orderNumber">Номер на поръчка (по избор)</Label>
        <Input
          id="orderNumber"
          name="orderNumber"
          inputMode="numeric"
          placeholder="напр. 128"
          className="h-12 rounded-lg sm:max-w-48"
        />
        <p className="text-xs text-muted-foreground">
          Помага ни да отбележим отзива като потвърдена покупка.
        </p>
      </div>

      {state.error && (
        <p className="rounded-lg bg-destructive/10 p-4 text-sm text-destructive">
          {state.error}
        </p>
      )}

      <Button
        type="submit"
        size="lg"
        disabled={pending}
        className="h-12 w-full rounded-lg text-sm font-semibold"
      >
        {pending ? (
          <>
            <Loader2 className="size-5 animate-spin" /> Изпращаме...
          </>
        ) : (
          "Изпрати отзив"
        )}
      </Button>
      <p className="text-center text-xs text-muted-foreground">
        Отзивите се публикуват след преглед. Не публикувай лични данни.
      </p>
    </form>
  );
}
