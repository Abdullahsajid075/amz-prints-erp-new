import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import Hero from './components/sections/Hero';
import Marquee from './components/sections/Marquee';
import Work from './components/sections/Work';
import About from './components/sections/About';
import DesignSystemShowcase from './components/sections/DesignSystemShowcase';
import Contact from './components/sections/Contact';

export default function App() {
  return (
    <div className="relative noise-overlay">
      <Navbar />
      <main>
        <Hero />
        <Marquee />
        <Work />
        <About />
        <DesignSystemShowcase />
        <Contact />
      </main>
      <Footer />
    </div>
  );
}
