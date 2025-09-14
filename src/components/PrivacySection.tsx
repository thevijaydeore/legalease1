import { Shield } from "lucide-react";

const PrivacySection = () => {
  return (
    <section className="py-20 bg-secondary/30">
      <div className="container mx-auto px-6">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-6">
            <Shield className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Your Privacy Comes First
          </h2>
          <p className="text-xl text-muted-foreground leading-relaxed">
            We do not store your legal documents or use them to train our models. 
            Your data is processed securely and deleted after use.
          </p>
        </div>
      </div>
    </section>
  );
};

export default PrivacySection;