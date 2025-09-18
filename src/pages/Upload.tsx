import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import DocumentUpload from "@/components/DocumentUpload";
import ResultsDisplay from "@/components/ResultsDisplay";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { User, Session } from '@supabase/supabase-js';

type UploadState = 'upload' | 'results';

interface DocumentAnalysis {
  summary: string;
  keyTerms: string[];
  yourResponsibilities: string[];
  otherPartyResponsibilities: string[];
  importantDates: Array<{ date: string; description: string }>;
  riskFlags: Array<{ level: 'low' | 'medium' | 'high'; description: string }>;
}

const Upload = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [currentView, setCurrentView] = useState<UploadState>('upload');
  const [isProcessing, setIsProcessing] = useState(false);
  const [analysis, setAnalysis] = useState<DocumentAnalysis | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const simulateAIProcessing = async (content: string): Promise<DocumentAnalysis> => {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    return {
      summary: "This appears to be a residential lease agreement for a 2-bedroom apartment. The lease term is 12 months with monthly rent of $2,400. The document includes standard residential lease clauses covering security deposits, maintenance responsibilities, and termination conditions. Key areas requiring attention include pet policies, subletting restrictions, and early termination penalties.",
      keyTerms: [
        "Security Deposit: $2,400 (refundable upon satisfactory condition)",
        "Monthly Rent: $2,400 due on the 1st of each month",
        "Late Fee: $75 if rent is more than 5 days late",
        "Pet Deposit: Additional $500 for approved pets only",
        "Utilities: Tenant responsible for electricity, gas, and internet"
      ],
      yourResponsibilities: [
        "Pay rent by the 1st of each month",
        "Maintain cleanliness and reasonable care of the property",
        "Report maintenance issues within 48 hours",
        "Obtain written approval before making any modifications",
        "Provide 30 days written notice before moving out",
        "Allow landlord access for inspections with 24-hour notice"
      ],
      otherPartyResponsibilities: [
        "Maintain structural integrity and major systems",
        "Handle repairs for normal wear and tear",
        "Provide habitable living conditions",
        "Return security deposit within 30 days of move-out",
        "Give 24-hour notice before entering (except emergencies)",
        "Comply with local housing laws and regulations"
      ],
      importantDates: [
        { date: "Move-in Date", description: "Lease begins, first month's rent and security deposit due" },
        { date: "Monthly Due Date", description: "Rent payment due on the 1st of each month" },
        { date: "Grace Period", description: "5-day grace period before late fees apply" },
        { date: "Notice Period", description: "30 days written notice required for termination" }
      ],
      riskFlags: [
        { 
          level: 'high' as const, 
          description: "Early termination clause requires payment of 2 months' rent as penalty. This is above average and could be costly if you need to break the lease."
        },
        { 
          level: 'medium' as const, 
          description: "Subletting is completely prohibited without written consent. This limits your flexibility if circumstances change."
        },
        { 
          level: 'low' as const, 
          description: "Security deposit amount equals one month's rent, which is standard for this type of property."
        }
      ]
    };
  };

  const handleProcessDocument = async (content: string) => {
    console.log('=== HANDLE PROCESS DOCUMENT DEBUG ===');
    console.log('Received content:', content);
    console.log('Contains Document ID?', content.includes('Document ID:'));
    
    // For uploaded documents, redirect to RAG page for processing
    if (content.includes('Document ID:')) {
      console.log('✅ Redirecting to RAG page...');
      toast({
        title: "Document Uploaded!",
        description: "Redirecting to RAG page for processing...",
      });
      navigate('/rag');
      return;
    }

    console.log('📄 Processing as pasted text (legacy flow)...');
    // For pasted text, use legacy processing
    setIsProcessing(true);
    
    try {
      toast({
        title: "Processing Document",
        description: "AI is analyzing your document. This may take a few moments...",
      });

      const result = await simulateAIProcessing(content);
      setAnalysis(result);
      setCurrentView('results');
      
      toast({
        title: "Analysis Complete!",
        description: "Your document has been successfully analyzed.",
      });
    } catch (error) {
      toast({
        title: "Analysis Failed",
        description: "There was an error processing your document. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleStartOver = () => {
    setCurrentView('upload');
    setAnalysis(null);
  };

  const handleBackToHome = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen">
      <Header />
      <main>
        {currentView === 'upload' && (
          <DocumentUpload 
            onProcessDocument={handleProcessDocument}
            isProcessing={isProcessing}
            onBackToHome={handleBackToHome}
          />
        )}
        {currentView === 'results' && analysis && (
          <ResultsDisplay 
            analysis={analysis}
            onStartOver={handleStartOver}
          />
        )}
      </main>
    </div>
  );
};

export default Upload;