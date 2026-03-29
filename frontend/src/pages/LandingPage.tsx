import { Hero } from "../components/sections/Hero";
import { ValueSection } from "../components/sections/ValueSection";
import { AboutSection } from "../components/sections/AboutSection";
import { SocialProof } from "../components/sections/SocialProof";
import { ITMajorsGrid } from "../components/sections/ITMajorsGrid";
import { HowItWorks } from "../components/sections/HowItWorks";
import { TestimonialSection } from "../components/sections/TestimonialSection";
import { JobPreview } from "../components/sections/JobPreview";
import { BlogPreview } from "../components/sections/BlogPreview";
import { MentorPreview } from "../components/sections/MentorPreview";

export function LandingPage() {
  return (
    <main>
      <Hero />
      <ValueSection />
      <AboutSection />
      <SocialProof />
      <ITMajorsGrid />
      <HowItWorks />
      <TestimonialSection />
      <MentorPreview />
      <JobPreview />
      <BlogPreview />
    </main>
  );
}
