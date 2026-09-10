import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { renderPrintFile } from "@/lib/print/render";
import { productById } from "@/lib/shop/products";
import { DEFAULT_PLACEMENT, type Placement } from "@/lib/shop/placement";
import { designIdOf } from "@/lib/shop/ready";

export const runtime = "nodejs";

/**
 * The print file for one order line, as a download.
 *
 * Under /admin, so `proxy.ts` guards it with the same basic auth as every other
 * admin route — the file contains a customer's photograph and must never be
 * reachable by guessing an id.
 *
 * This is what makes an order fulfillable TODAY. The supplier's documented API
 * cannot be handed artwork at all — it orders products that already exist in
 * their catalogue — so until that is resolved the flow is: open the order,
 * download the file, upload it in their panel. Manual, but real, which is more
 * than the shop could do an hour ago. See docs/printondemand-panel.md.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ lineId: string }> }
) {
  const { lineId } = await params;

  const line = await prisma.orderLine.findUnique({
    where: { id: lineId },
    select: {
      productId: true,
      title: true,
      photoKey: true,
      designId: true,
      placement: true,
      text: true,
      variants: true,
    },
  });
  if (!line) {
    return NextResponse.json({ error: "Няма такъв ред" }, { status: 404 });
  }

  const product = productById(line.productId);
  if (!product?.printArea) {
    return NextResponse.json(
      { error: "Този продукт няма печатна зона" },
      { status: 400 }
    );
  }

  // Older lines predate the designId column; a ready-made product carries the
  // design in its own id, so fall back to that rather than refusing to print.
  const designId = line.designId ?? designIdOf(line.productId) ?? undefined;

  const variants = (line.variants ?? {}) as Record<string, string>;
  const colorHex = product.variants.reduce<string | undefined>(
    (found, axis) => found ?? axis.swatch?.[variants[axis.label] ?? ""],
    undefined
  );

  try {
    const file = await renderPrintFile({
      area: product.printArea,
      placement: {
        ...DEFAULT_PLACEMENT,
        ...((line.placement ?? {}) as Partial<Placement>),
      },
      photoKey: line.photoKey ?? undefined,
      designId,
      text: line.text ?? undefined,
      colorHex,
    });

    const name = `${line.productId}-${lineId.slice(-6)}.png`;
    return new NextResponse(new Uint8Array(file.png), {
      headers: {
        "Content-Type": "image/png",
        "Content-Disposition": `attachment; filename="${name}"`,
        // What the printer needs to know, without opening the file.
        "X-Print-Size": `${file.widthPx}x${file.heightPx}`,
        "X-Print-Mm": `${product.printArea.widthMm}x${product.printArea.heightMm}`,
        "X-Print-Dpi": String(file.effectiveDpi ?? "vector"),
        "X-Print-Method": file.embroidery ? "embroidery" : "dtf",
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    console.error("print render failed", lineId, err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Печатният файл не се генерира" },
      { status: 500 }
    );
  }
}
