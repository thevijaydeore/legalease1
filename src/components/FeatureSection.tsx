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
    <section className="py-20 bg-background">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Your AI-Powered Legal Guide
          </h2>
        </div>
        <div className="grid md:grid-cols-2 gap-12 max-w-4xl mx-auto">
          {features.map((feature, index) => (
            <div key={index} className="flex gap-4">
              <div className="flex-shrink-0">
                <feature.icon className="w-6 h-6 text-primary mt-1" />
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeatureSection;