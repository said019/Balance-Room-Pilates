import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import ClassTypes from "@/components/ClassTypes";
import Schedule from "@/components/Schedule";
import Instructors from "@/components/Instructors";
import Pricing from "@/components/Pricing";
import Testimonials from "@/components/Testimonials";
import Location from "@/components/Location";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      <Hero />
      <ClassTypes />
      <Schedule />
      <Instructors />
      <Pricing />
      <Testimonials />
      <Location />
      <Footer />
    </main>
  );
};

export default Index;
