import SEO from "../components/SEO";
import Hero from "../components/Hero";
import TrendingBar from "../components/TrendingBar";
import LatestNews from "../components/LatestNews";
import CategorySection from "../components/CategorySection";
import Newsletter from "../components/Newsletter";
import { SITE } from "../lib/seo";

export default function HomePage() {
  return (
    <>
      <SEO />
      <Hero />
      <TrendingBar />
      <LatestNews />
      <CategorySection />
      <Newsletter />
    </>
  );
}
