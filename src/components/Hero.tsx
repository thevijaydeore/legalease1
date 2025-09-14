import { Button } from "@/components/ui/button";
import heroImage from "@/assets/hero-legal-ai.jpg";

const Hero = ({ onGetStarted }: { onGetStarted: () => void }) => {
  return (
    <section className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-primary/5 to-purple-50">
      <div className="container mx-auto px-6 py-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="text-center lg:text-left">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Understand <span className="bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">Any Legal Document</span>
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground mb-8 leading-relaxed">
              Your AI-powered legal assistant that simplifies complex agreements into clear, actionable insights.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Button 
                variant="hero" 
                size="lg" 
                onClick={onGetStarted}
                className="text-lg px-8 py-6"
              >
                Try LegalEase
              </Button>
            </div>
            <div className="mt-8 flex items-center gap-6 text-sm text-muted-foreground justify-center lg:justify-start">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                Privacy First
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                No Storage
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                Instant Results
              </div>
            </div>
          </div>
          <div className="relative">
            <img 
              src={heroImage} 
              alt="AI Legal Document Simplification Visualization"
              className="w-full h-auto rounded-2xl shadow-card"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-primary/10 to-transparent rounded-2xl"></div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;