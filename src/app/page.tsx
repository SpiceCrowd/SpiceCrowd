import Header from "@/components/layout/Header";
import AnnouncementBar from "@/components/home/AnnouncementBar";
import HeroCarousel from "@/components/home/HeroCarousel";
import FeaturedProducts from "@/components/home/FeaturedProducts";
import Categories from "@/components/home/Categories";
import ComboPacks from "@/components/home/ComboPacks";
import WhyChooseUs from "@/components/home/WhyChooseUs";
import Newsletter from "@/components/home/Newsletter";
import ReviewStrip from "@/components/home/ReviewStrip";
import TestimonialsSection from "@/components/home/TestimonialsSection";
import CustomerReelsCarousel from "@/components/home/CustomerReelsCarousel";
import ReviewMarquee from "@/components/reviews/ReviewMarquee";
import HomeTabsSections from "@/components/home/HomeTabsSections";
import Footer from "@/components/home/Footer";

export default function Home() {
  return (
    <>
      <Header />
      <AnnouncementBar />
      <main className="space-y-24">
        <HeroCarousel />
        <ReviewMarquee />
        <FeaturedProducts />
        <ReviewStrip />
        <Categories />
        <ComboPacks />
        <HomeTabsSections />
        <WhyChooseUs />
        <CustomerReelsCarousel />
        <Newsletter />
        <TestimonialsSection />
      </main>
      <Footer />
    </>
  );
}

