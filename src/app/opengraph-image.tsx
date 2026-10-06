import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { SITE } from "@/lib/site";

export const alt = `${SITE.name} · Paquete semanal de ${SITE.paqueteTamano}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Composición centrada: WhatsApp a veces recorta la vista previa a un cuadrado central,
// así que logo, titular y CTA deben caber en los ~630 px del centro.
export default async function OpengraphImage() {
  const logo = await readFile(join(process.cwd(), "public/images/Logo.png"));
  const logoSrc = `data:image/png;base64,${logo.toString("base64")}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 22,
          backgroundColor: "#161616",
          backgroundImage: "radial-gradient(circle at 50% 30%, rgba(249,195,164,0.25), transparent 60%)",
          color: "#DCDAD9",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={logoSrc} width={190} height={190} alt="" />
        <div
          style={{
            display: "flex",
            padding: "8px 22px",
            borderRadius: 999,
            backgroundColor: "rgba(249,195,164,0.16)",
            color: "#F9C3A4",
            fontSize: 28,
          }}
        >
          {`PAQUETE SEMANAL · ${SITE.paqueteTamano}`}
        </div>
        <div style={{ display: "flex", fontSize: 64, color: "#ffffff" }}>
          Estrenos y promos
        </div>
        <div style={{ display: "flex", fontSize: 28, color: "#95999E" }}>
          Películas · Series · Anime · Novelas · Realities
        </div>
        <div
          style={{
            display: "flex",
            marginTop: 6,
            padding: "12px 30px",
            borderRadius: 16,
            backgroundColor: "#25D366",
            color: "#0b0b0b",
            fontSize: 30,
          }}
        >
          Pide por WhatsApp
        </div>
      </div>
    ),
    size,
  );
}
