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
    <section className="py-32 bg-background">
      <div className="container mx-auto px-6">
        <div className="text-center mb-20">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            How People Use LegalEase
          </h2>
        </div>
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {useCases.map((useCase, index) => (
            <Card key={index} className="text-center p-8 border-0 bg-white shadow-card hover:shadow-feature transition-all duration-300 rounded-2xl">
              <CardContent className="pt-6">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-2xl mb-6">
                  <useCase.icon className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-4">{useCase.title}</h3>
                <p className="text-muted-foreground leading-relaxed text-base">
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