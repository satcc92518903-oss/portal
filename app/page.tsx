import Hero from '@/components/hero';
import Features from '@/components/features';
import Gallery from '@/components/gallery';
import CTA from '@/components/cta';

export const metadata = {
  title: 'Ocean Dreams - Paper Cut Artistry',
  description: 'Explore the beauty of ocean-inspired paper cutting art',
};

export default function Home() {
  return (
    <main className="w-full overflow-hidden bg-background">
      <Hero />
      <Features />
      <Gallery />
      <CTA />
    </main>
  );
}
