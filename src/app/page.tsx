import Header from "@/components/layout/Header";
import AnnouncementBar from "@/components/home/AnnouncementBar";
import HomeHero from "@/components/home/HomeHero";
import BestSellers from "@/components/home/BestSellers";
import Categories from "@/components/home/Categories";
import WhyChooseUs from "@/components/home/WhyChooseUs";
import FeaturedProducts from "@/components/home/FeaturedProducts";
import ComboPacks from "@/components/home/ComboPacks";
import TestimonialsSection from "@/components/home/TestimonialsSection";
import KolliHillsStory from "@/components/home/KolliHillsStory";
import UsageIdeas from "@/components/home/UsageIdeas";
import ShoppingConfidence from "@/components/home/ShoppingConfidence";
import Newsletter from "@/components/home/Newsletter";
import Footer from "@/components/home/Footer";
import { getCombos } from "@/lib/homeData";

// Discover -> Explore -> Trust -> Shop -> Add to cart.
export default function Home() {
  return (
    <>
      <Header />
      <AnnouncementBar />
      <main className="space-y-16 pb-16 sm:space-y-20 lg:space-y-24 lg:pb-24">
        <HomeHero />
        <BestSellers />
        <Categories />
        <WhyChooseUs />
        <FeaturedProducts />
        <ComboPacks combos={getCombos()} />
        <TestimonialsSection />
        <KolliHillsStory />
        <UsageIdeas />
        <ShoppingConfidence />
        <Newsletter />
      </main>
      <Footer />
    </>
  );
}
