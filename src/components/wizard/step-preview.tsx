"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Download, RefreshCw, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ProtectedImage } from "@/components/shared/protected-image";
import { GENERATING_PHASES, GeneratingScene } from "./generating-scene";
import { SaveDraft } from "./save-draft";
import { postJson } from "@/lib/fetch-json";
import { trackFunnel } from "@/components/site/analytics";
import { useWizard } from "@/lib/store/wizard";

export function StepPreview() {
  const wizard = useWizard();
  const router = useRouter();
  const displayName =
    wizard.children.map((c) => c.name).filter(Boolean).join(" и ") || "детето";
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");
  const [phase, setPhase] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const started = useRef(false);

  const generate = useCallback(async () => {
    setGenerating(true);
    setError("");
    setPhase(0);
    setElapsed(0);
    try {
      const { ok, data, error: respError } = await postJson<{
        orderId: string;
        previewUrl: string;
        finalUrl?: string;
      }>("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          children: wizard.children.map((c) => ({
            name: c.name,
            age: Number(c.age),
            gender: c.gender,
            words: c.words,
          })),
          photoKey: wizard.photoKey,
          leadEmail: wizard.leadEmail,
          animals: wizard.animals,
          style: wizard.style,
        }),
      });
      if (!ok) throw new Error(respError ?? "Генерирането не успя");
      wizard.setGenerated(data.orderId, data.previewUrl, data.finalUrl ?? "");
      if (wizard.leadEmail) trackFunnel("Lead", { content_name: "Постер генериран" });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Генерирането не успя";
      setError(msg);
      toast.error(msg);
    } finally {
      setGenerating(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wizard.children, wizard.photoKey, wizard.leadEmail, wizard.animals, wizard.style]);

  useEffect(() => {
    if (!started.current && !wizard.previewUrl) {
      started.current = true;
      void generate();
    }
  }, [generate, wizard.previewUrl]);

  // Advance phase text, holding on the final message.
  useEffect(() => {
    if (!generating) return;
    const t = setInterval(
      () => setPhase((p) => Math.min(p + 1, GENERATING_PHASES - 1)),
      4200
    );
    return () => clearInterval(t);
  }, [generating]);

  // Elapsed seconds, so a minute of waiting has a visible heartbeat. The
  // counter is reset where the run starts, not here — resetting inside the
  // effect would be a synchronous setState on every generating flip.
  useEffect(() => {
    if (!generating) return;
    const t = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [generating]);

  const testMode = Boolean(wizard.finalUrl);
  const shownUrl = testMode ? wizard.finalUrl : wizard.previewUrl;

  return (
    <Card className="glass overflow-hidden rounded-[2rem] border-none">
      {/* `relative` anchors the reveal glow below — without it the burst
          positions against some far-off ancestor. */}
      <CardContent className="relative flex flex-col items-center gap-6 p-8">
        {generating && (
          <GeneratingScene phase={phase} name={displayName} elapsed={elapsed} />
        )}

        {!generating && error && (
          <div className="flex flex-col items-center gap-4 py-10 text-center">
            <p className="text-destructive">{error}</p>
            <Button onClick={() => void generate()} className="rounded-full">
              Опитай отново
            </Button>
          </div>
        )}

        {!generating && !error && shownUrl && (
          <>
            {testMode && (
              <span className="rounded-full bg-foreground px-3 py-1 text-xs font-bold text-background">
                ТЕСТ РЕЖИМ · пълно качество, без воден знак
              </span>
            )}
            {/* This is the moment the whole funnel builds to — the parent sees
                their child's face for the first time. A plain fade undersold it,
                so the poster now arrives with a spring and a burst of light. */}
            <motion.div
              aria-hidden
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: [0, 0.9, 0], scale: [0.6, 1.6, 2] }}
              transition={{ duration: 1.4, ease: "easeOut" }}
              className="pointer-events-none absolute top-1/3 h-56 w-56 rounded-full bg-primary/40 blur-3xl"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.82, y: 24 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 120, damping: 16, mass: 0.9 }}
              className="elevate-lg relative w-full max-w-sm overflow-hidden rounded-3xl"
            >
              {testMode ? (
                <Image
                  src={shownUrl}
                  alt={`Постер на ${displayName}`}
                  width={640}
                  height={960}
                  unoptimized
                  className="w-full"
                />
              ) : (
                <ProtectedImage
                  src={shownUrl}
                  alt={`Защитен преглед на постера на ${displayName}`}
                  width={640}
                  height={960}
                />
              )}
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.35 }}
              className="text-center"
            >
              <p className="flex items-center justify-center gap-2 font-heading text-xl font-bold">
                <Sparkles className="size-5 text-primary" />
                Спомeнът на {displayName} е готов!
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                {testMode
                  ? "Тестов преглед — това е финалният файл в пълно качество."
                  : "Това е защитен преглед с воден знак. Финалният постер е в пълно 4K качество, без надписи."}
              </p>
            </motion.div>

            {testMode && (
              <a
                href={wizard.finalUrl}
                download={`biseri-${displayName}.png`}
                className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
              >
                <Download className="size-4" /> Свали финалния файл
              </a>
            )}

            <div className="flex w-full flex-wrap gap-3">
              <Button
                variant="outline"
                size="lg"
                className="rounded-full"
                onClick={() => {
                  wizard.setGenerated("", "", "");
                  wizard.setStep(2);
                }}
              >
                ← Промени
              </Button>
              {/* Without this the only way to retry a weak result was to go
                  back and re-enter everything. */}
              <Button
                variant="outline"
                size="lg"
                className="rounded-full"
                onClick={() => {
                  started.current = true;
                  wizard.setGenerated("", "", "");
                  void generate();
                }}
              >
                <RefreshCw className="size-4" /> Прегенерирай
              </Button>
              <Button
                size="lg"
                className="flex-1 rounded-full text-base shadow-lg shadow-primary/25"
                onClick={() => {
                  trackFunnel("InitiateCheckout", { content_name: "Постер" });
                  router.push(`/order?orderId=${wizard.orderId}`);
                }}
              >
                Поръчай спомена ❤️
              </Button>
            </div>

            {wizard.orderId && (
              <SaveDraft orderId={wizard.orderId} defaultEmail={wizard.leadEmail} />
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
