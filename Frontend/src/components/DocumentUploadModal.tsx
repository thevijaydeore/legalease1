import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import DocumentUpload from "@/components/DocumentUpload";
import ResultsDisplay from "@/components/ResultsDisplay";

interface DocumentUploadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DocumentUploadModal({ open, onOpenChange }: DocumentUploadModalProps) {
  const [processedContent, setProcessedContent] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const handleProcessDocument = async (content: string) => {
    setIsProcessing(true);
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    setProcessedContent(content);
    setIsProcessing(false);
  };

  const handleBackToHome = () => {
    setProcessedContent("");
    setIsProcessing(false);
    onOpenChange(false);
  };

  const handleStartOver = () => {
    setProcessedContent("");
    setIsProcessing(false);
  };

  // Create mock analysis from processed content
  const createMockAnalysis = (content: string) => ({
    summary: `This document appears to be a legal agreement. Based on the analysis of your document content: ${content.substring(0, 200)}...`,
    keyTerms: [
      "Contract Terms - Key provisions and conditions outlined in the agreement",
      "Payment Terms - Financial obligations and payment schedules",
      "Termination Clause - Conditions under which the agreement may be ended"
    ],
    yourResponsibilities: [
      "Comply with all terms and conditions as outlined in the document",
      "Make timely payments as specified in the payment schedule",
      "Provide necessary documentation and information as required"
    ],
    otherPartyResponsibilities: [
      "Deliver services or products as agreed upon",
      "Maintain confidentiality of sensitive information",
      "Honor warranty and support obligations"
    ],
    importantDates: [
      { date: "Contract Start Date", description: "When the agreement becomes effective" },
      { date: "Payment Due Dates", description: "Regular payment schedule intervals" },
      { date: "Termination Notice Period", description: "Required notice period for contract termination" }
    ],
    riskFlags: [
      { level: "medium" as const, description: "Review termination clauses carefully to understand exit conditions" },
      { level: "low" as const, description: "Ensure all payment terms are clearly understood and manageable" }
    ]
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-6xl max-h-[95vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader className="space-y-2">
          <DialogTitle className="text-lg sm:text-xl">
            {processedContent ? "Analysis Results" : "Upload Document for Analysis"}
          </DialogTitle>
        </DialogHeader>
        <div className="mt-4">
          {processedContent ? (
            <ResultsDisplay 
              analysis={createMockAnalysis(processedContent)} 
              onStartOver={handleStartOver}
            />
          ) : (
            <DocumentUpload 
              onProcessDocument={handleProcessDocument}
              isProcessing={isProcessing}
              onBackToHome={handleBackToHome}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}