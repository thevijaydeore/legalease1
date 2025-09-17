import { Upload, FileText, Eye, Download } from "lucide-react";

const features = [
  {
    icon: Upload,
    title: "Upload Your Legal Documents",
    description: "Upload lease agreements, NDAs, employment contracts, or paste text directly. LegalEase will extract and process them securely in seconds."
  },
  {
    icon: FileText,
    title: "Instant Plain-Language Summaries",
    description: "No legal jargon. Get easy-to-read explanations of obligations, rights, deadlines, and risks."
  },
  {
    icon: Eye,
    title: "See the Key Clauses Clearly",
    description: "Get confidence in what you're signing. We highlight important clauses and provide clear explanations with context."
  },
  {
    icon: Download,
    title: "Learn and Act with Confidence",
    description: "Understand your documents anytime, anywhere. Download, share, or save summaries for reference."
  }
];

const FeatureSection = () => {
  return (
    <section className="py-32 bg-background">
      <div className="container mx-auto px-6">
        <div className="text-center mb-20">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Your AI-Powered Legal Guide
          </h2>
        </div>
        <div className="max-w-6xl mx-auto space-y-8">
          {features.map((feature, index) => (
            <div key={index} className="bg-card-dark rounded-3xl p-8 md:p-12 shadow-feature">
              <div className="grid md:grid-cols-2 gap-8 items-center">
                <div>
                  <div className="inline-flex items-center justify-center w-14 h-14 bg-primary/10 rounded-2xl mb-6">
                    <feature.icon className="w-7 h-7 text-primary" />
                  </div>
                  <h3 className="text-2xl md:text-3xl font-bold text-card-dark-foreground mb-4">
                    {feature.title}
                  </h3>
                  <p className="text-lg text-card-dark-foreground/80 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
                <div className="bg-card-dark-foreground/5 rounded-2xl p-8 min-h-[200px] flex items-center justify-center">
                  <div className="text-card-dark-foreground/40 text-center">
                    <feature.icon className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p className="text-sm">Feature visualization</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeatureSection;