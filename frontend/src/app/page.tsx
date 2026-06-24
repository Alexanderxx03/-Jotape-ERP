import Hero from "@/components/Hero";
import CategoriesShowcase from "@/components/CategoriesShowcase";
import FeaturedProducts from "@/components/FeaturedProducts";
import QualityBanner from "@/components/QualityBanner";
import BrandStory from "@/components/BrandStory";
import Location from "@/components/Location";

export default function Home() {
  return (
    <>
      <Hero />
      <CategoriesShowcase />
      <FeaturedProducts />
      <QualityBanner />
      <BrandStory />
      <Location />
    </>
  );
}
