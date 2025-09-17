import { Shield } from "lucide-react";

const PrivacySection = () => {
  return (
    <section className="py-32 bg-secondary/50">
      <div className="container mx-auto px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-primary/10 rounded-3xl mb-8">
            <Shield className="w-10 h-10 text-primary" />
          </div>
          <h2 className="text-4xl md:text-5xl font-bold mb-8">
            Your Privacy Comes First
          </h2>
          <p className="text-xl md:text-2xl text-muted-foreground leading-relaxed max-w-3xl mx-auto">
            We do not store your legal documents or use them to train our models. 
            Your data is processed securely and deleted after use.
          </p>
          <div className="mt-12">
            <div className="inline-flex items-center gap-2 bg-primary/5 px-4 py-2 rounded-full">
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
              <span className="text-sm font-medium text-primary">Secure Processing</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PrivacySection;