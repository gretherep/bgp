// Versiones livianas del póster, generadas en el navegador de la admin al subirlo
// (mismos tamaños que scripts/posters-variantes.mjs para los pósters que ya existían).

export type VariantesLocales = { thumb: Blob; md: Blob; color: string };

async function cargar(file: Blob): Promise<ImageBitmap> {
  return createImageBitmap(file);
}

/** Recorte "cover" a w×h (como object-fit: cover) y codificado a WebP. */
async function recorte(img: ImageBitmap, w: number, h: number, calidad: number): Promise<Blob | null> {
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  const escala = Math.max(w / img.width, h / img.height);
  const sw = w / escala;
  const sh = h / escala;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(img, (img.width - sw) / 2, (img.height - sh) / 2, sw, sh, 0, 0, w, h);
  const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/webp", calidad));
  // Safari viejo devuelve PNG si no sabe WebP: mejor no subir nada y dejar el original.
  return blob?.type === "image/webp" ? blob : null;
}

function colorMedio(img: ImageBitmap): string {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 1;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(img, 0, 0, 1, 1);
  const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
  return `rgb(${r},${g},${b})`;
}

/** null si el navegador no puede generarlas (el sitio usa el original hasta que corra el script). */
export async function generarVariantes(file: Blob): Promise<VariantesLocales | null> {
  try {
    const img = await cargar(file);
    const [thumb, md] = await Promise.all([recorte(img, 320, 480, 0.55), recorte(img, 480, 720, 0.6)]);
    const color = colorMedio(img);
    img.close();
    return thumb && md ? { thumb, md, color } : null;
  } catch {
    return null;
  }
}
