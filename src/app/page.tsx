import { getHomeData } from "@/lib/catalog";
import { getCatalogo, getTopValorados } from "@/lib/catalogQuery";
import { FILTROS_VACIOS } from "@/lib/categories";
import { waLink } from "@/lib/whatsapp";
import PromoStrip from "@/components/home/PromoStrip";
import HomeHero from "@/components/home/HomeHero";
import OffersRow from "@/components/home/OffersRow";
import MoodChips from "@/components/home/MoodChips";
import Top10Row from "@/components/home/Top10Row";
import CatalogoInicio from "@/components/home/catalogo/CatalogoInicio";
import PideloBlock from "@/components/home/PideloBlock";

// HTML cacheado en la CDN y regenerado cada 5 min.
export const revalidate = 300;

export default async function HomePage() {
  const [data, catalogo, top] = await Promise.all([getHomeData(), getCatalogo(FILTROS_VACIOS, 1), getTopValorados(10)]);
  const strip = data.promosStrip[0];

  return (
    <>
      {strip && (
        <PromoStrip
          promo={strip}
          href={waLink(data.whatsappUrl, strip.cta_mensaje ?? `Hola 👋 me interesa: ${strip.titulo}`)}
        />
      )}
      <HomeHero data={data} />
      <OffersRow promos={data.promosCard} whatsappUrl={data.whatsappUrl} />
      <MoodChips />
      <Top10Row items={top} />
      <CatalogoInicio inicial={catalogo} whatsappUrl={data.whatsappUrl} />
      <PideloBlock whatsappUrl={data.whatsappUrl} />
    </>
  );
}
