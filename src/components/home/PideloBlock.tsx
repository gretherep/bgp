import { waLink } from "@/lib/whatsapp";
import WhatsAppIcon from "@/components/icons/WhatsAppIcon";

// Cierre del Inicio: recupera a quien no encontró lo que buscaba.
export default function PideloBlock({ whatsappUrl }: { whatsappUrl: string | null }) {
  return (
    <section className="mx-auto max-w-[1600px] px-4 pb-16 sm:px-6 lg:px-10">
      <div className="relative isolate overflow-hidden rounded-3xl border border-white/10 bg-surface px-6 py-10 text-center sm:px-10 sm:py-12">
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10"
          style={{ backgroundImage: "radial-gradient(50% 80% at 50% 0%, rgba(249,195,164,0.14), transparent 70%)" }}
        />
        <p className="text-3xl" aria-hidden="true">🔎</p>
        <h2 className="mt-2 text-2xl font-black tracking-tight text-white sm:text-3xl">¿No encuentras lo que buscas?</h2>
        <p className="mx-auto mt-2 max-w-xl text-sm text-white/65 sm:text-base">
          Dinos el nombre de la película, serie o novela y te confirmamos si podemos conseguirla.
        </p>
        <a
          href={waLink(whatsappUrl, "Hola 👋 busco un título que no está en el catálogo:")}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-whatsapp px-6 py-3 text-sm font-black text-black shadow-lg shadow-whatsapp/25 transition hover:-translate-y-0.5 hover:brightness-110 active:scale-[0.97]"
        >
          <WhatsAppIcon className="h-[18px] w-[18px]" />
          Pídelo por WhatsApp
        </a>
      </div>
    </section>
  );
}
