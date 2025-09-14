import { Home, Briefcase, UserCheck } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const useCases = [
  {
    icon: Home,
    title: "Lease Review",
    description: "Quickly understand rent terms, notice periods, and obligations before signing."
  },
  {
    icon: Briefcase,
    title: "Business Contracts",
    description: "Review NDAs and service agreements without calling your lawyer every time."
  },
  {
    icon: UserCheck,
    title: "Employment Contracts",
    description: "Know your rights, benefits, and non-compete clauses in plain English."
  }
];

const UseCasesSection = () => {
  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            How People Use LegalEase
          </h2>
        </div>
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {useCases.map((useCase, index) => (
            <Card key={index} className="text-center p-6 border-0 shadow-card hover:shadow-elegant transition-all duration-300">
              <CardContent className="pt-6">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-primary/10 rounded-full mb-4">
                  <useCase.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-3">{useCase.title}</h3>
                <p className="text-muted-foreground leading-relaxed">
                  {useCase.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default UseCasesSection;