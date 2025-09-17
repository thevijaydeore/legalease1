import { Button } from "@/components/ui/button";

const Hero = ({ onGetStarted }: { onGetStarted: () => void }) => {
  return (
    <section className="relative min-h-screen flex items-center justify-center bg-white">
      <div className="container mx-auto px-6 py-32">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl md:text-7xl font-bold mb-8 tracking-tight">
            Understand <span className="text-primary">any</span> legal document
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground mb-12 leading-relaxed max-w-3xl mx-auto">
            Your AI-powered legal assistant that simplifies complex agreements into clear, actionable insights.
          </p>
          <div className="flex justify-center mb-16">
            <Button 
              variant="hero" 
              size="lg" 
              onClick={onGetStarted}
              className="text-lg px-12 py-6 h-auto rounded-full"
            >
              Try LegalEase →
            </Button>
          </div>
          <div className="flex items-center justify-center gap-8 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-primary"></div>
              Privacy First
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-primary"></div>
              No Storage
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-primary"></div>
              Instant Results
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;