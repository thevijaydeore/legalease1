import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  FileText, 
  Calendar, 
  AlertTriangle, 
  CheckCircle, 
  Users, 
  ArrowLeft, 
  Download, 
  Copy 
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface DocumentAnalysis {
  summary: string;
  keyTerms: string[];
  yourResponsibilities: string[];
  otherPartyResponsibilities: string[];
  importantDates: Array<{ date: string; description: string }>;
  riskFlags: Array<{ level: 'low' | 'medium' | 'high'; description: string }>;
}

interface ResultsDisplayProps {
  analysis: DocumentAnalysis;
  onStartOver: () => void;
}

const ResultsDisplay = ({ analysis, onStartOver }: ResultsDisplayProps) => {
  const { toast } = useToast();

  const handleCopyResults = () => {
    const formattedResults = `
Document Analysis Summary

OVERVIEW:
${analysis.summary}

KEY TERMS:
${analysis.keyTerms.map(term => `• ${term}`).join('\n')}

YOUR RESPONSIBILITIES:
${analysis.yourResponsibilities.map(resp => `• ${resp}`).join('\n')}

OTHER PARTY RESPONSIBILITIES:
${analysis.otherPartyResponsibilities.map(resp => `• ${resp}`).join('\n')}

IMPORTANT DATES:
${analysis.importantDates.map(date => `• ${date.date}: ${date.description}`).join('\n')}

RISK FLAGS:
${analysis.riskFlags.map(risk => `• ${risk.level.toUpperCase()}: ${risk.description}`).join('\n')}
    `;

    navigator.clipboard.writeText(formattedResults.trim());
    toast({
      title: "Results copied!",
      description: "Document analysis has been copied to your clipboard.",
    });
  };

  const getRiskBadgeVariant = (level: string) => {
    switch (level) {
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      default: return 'outline';
    }
  };

  return (
    <section className="min-h-screen bg-gradient-to-b from-background to-muted/20 py-12">
      <div className="container mx-auto px-6">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <Button variant="ghost" onClick={onStartOver}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Analyze Another Document
            </Button>
            <div className="flex gap-3">
              <Button variant="outline" onClick={handleCopyResults}>
                <Copy className="w-4 h-4 mr-2" />
                Copy Results
              </Button>
              <Button variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Download PDF
              </Button>
            </div>
          </div>

          <div className="grid gap-8">
            {/* Summary Card */}
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <FileText className="w-6 h-6 text-primary" />
                  Document Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg leading-relaxed">{analysis.summary}</p>
              </CardContent>
            </Card>

            {/* Key Terms */}
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                  Key Terms & Definitions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3">
                  {analysis.keyTerms.map((term, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 bg-muted/40 rounded-lg">
                      <div className="w-2 h-2 rounded-full bg-primary mt-2"></div>
                      <span className="text-sm">{term}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Responsibilities Grid */}
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="shadow-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <Users className="w-6 h-6 text-blue-600" />
                    Your Responsibilities
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {analysis.yourResponsibilities.map((responsibility, index) => (
                      <div key={index} className="flex items-start gap-3">
                        <div className="w-2 h-2 rounded-full bg-blue-600 mt-2"></div>
                        <span className="text-sm">{responsibility}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <Users className="w-6 h-6 text-purple-600" />
                    Other Party Responsibilities
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {analysis.otherPartyResponsibilities.map((responsibility, index) => (
                      <div key={index} className="flex items-start gap-3">
                        <div className="w-2 h-2 rounded-full bg-purple-600 mt-2"></div>
                        <span className="text-sm">{responsibility}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Important Dates */}
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <Calendar className="w-6 h-6 text-orange-600" />
                  Important Dates & Deadlines
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  {analysis.importantDates.map((dateItem, index) => (
                    <div key={index} className="flex items-center gap-4 p-4 bg-orange-50 rounded-lg border-l-4 border-orange-600">
                      <Calendar className="w-5 h-5 text-orange-600" />
                      <div>
                        <div className="font-semibold text-orange-900">{dateItem.date}</div>
                        <div className="text-sm text-orange-700">{dateItem.description}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Risk Flags */}
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                  Risk Flags & Important Notes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analysis.riskFlags.map((risk, index) => (
                    <div key={index} className="flex items-start gap-4 p-4 rounded-lg border-l-4 border-red-300 bg-red-50">
                      <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <Badge variant={getRiskBadgeVariant(risk.level)}>
                            {risk.level.toUpperCase()} RISK
                          </Badge>
                        </div>
                        <p className="text-sm text-red-700">{risk.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Disclaimer */}
            <Card className="border-amber-200 bg-amber-50">
              <CardContent className="p-6">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-6 h-6 text-amber-600 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-amber-900 mb-2">Important Disclaimer</h4>
                    <p className="text-sm text-amber-800 leading-relaxed">
                      This analysis is provided for informational purposes only and does not constitute legal advice. 
                      For legal matters, please consult with a qualified attorney who can provide guidance specific 
                      to your situation and jurisdiction.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ResultsDisplay;