import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChatInterface } from '@/components/ChatInterface';
import { ArrowLeft, Download, FileText, AlertTriangle, Shield, Scale, BookOpen } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Header from '@/components/Header';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

interface Document {
  id: string;
  title: string;
  original_filename: string;
  file_type: string;
  file_size: number;
  created_at: string;
}

const Workspace = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const documentId = searchParams.get('docId');
  const [document, setDocument] = useState<Document | null>(null);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (documentId) {
      fetchDocument();
    } else {
      setIsLoading(false);
    }
  }, [documentId]);

  const fetchDocument = async () => {
    try {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('id', documentId)
        .single();

      if (error) throw error;
      setDocument(data);
    } catch (error) {
      console.error('Error fetching document:', error);
      toast({
        title: "Error",
        description: "Failed to fetch document details",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getUserId = () => {
    return user?.id || '00000000-0000-0000-0000-000000000001';
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral">
        <Header />
        <div className="container mx-auto px-6 py-8">
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading workspace...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral">
      <Header />
      
      <div className="container mx-auto px-6 py-8 max-w-7xl">
        {/* Header Section */}
        <div className="mb-8">
          <Button
            onClick={() => navigate('/dashboard')}
            variant="ghost"
            className="mb-4 text-neutral-dark"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-neutral-dark">Your Legal Document Workspace</h1>
            <p className="text-neutral-foreground text-lg">
              Review, chat, and download insights from your document
            </p>
            
            {document && (
              <div className="flex items-center gap-4 text-sm text-neutral-foreground mt-4 p-4 bg-card rounded-lg shadow-subtle">
                <FileText className="h-4 w-4" />
                <span className="font-medium">{document.original_filename}</span>
                <span>•</span>
                <span>{formatFileSize(document.file_size)}</span>
                <span>•</span>
                <span>{new Date(document.created_at).toLocaleDateString()}</span>
              </div>
            )}
          </div>
        </div>

        {/* Main Content - Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Chat Interface */}
          <div className="space-y-6">
            <Card className="shadow-card border-0">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl text-neutral-dark flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-primary" />
                  Ask Questions About Your Document
                </CardTitle>
                <p className="text-neutral-foreground text-sm">
                  Interactive AI-powered chat interface where you can ask legal questions and get grounded answers with citations.
                </p>
              </CardHeader>
              <CardContent className="p-0">
                <div className="h-[600px]">
                  <ChatInterface userId={getUserId()} />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Document Summary */}
          <div className="space-y-6">
            <Card className="shadow-card border-0">
              <CardHeader>
                <CardTitle className="text-xl text-neutral-dark flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  Detailed Summary
                </CardTitle>
                <p className="text-neutral-foreground text-sm">
                  Structured, well-organized summary of your legal document with key insights.
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Key Clauses Section */}
                <Collapsible defaultOpen>
                  <CollapsibleTrigger className="flex items-center justify-between w-full p-4 bg-muted rounded-lg hover:bg-muted/80 transition-colors">
                    <div className="flex items-center gap-2">
                      <Scale className="h-4 w-4 text-primary" />
                      <span className="font-medium text-neutral-dark">Key Clauses</span>
                    </div>
                    <div className="text-xs text-neutral-foreground">Click to expand</div>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="mt-2 p-4 bg-card rounded-lg border">
                    <div className="space-y-3 text-sm text-neutral-foreground">
                      <p>• <strong>Payment Terms:</strong> Analysis of payment schedules, due dates, and penalty clauses</p>
                      <p>• <strong>Termination Clauses:</strong> Conditions under which the agreement can be terminated</p>
                      <p>• <strong>Liability Limitations:</strong> Scope and extent of liability coverage and exclusions</p>
                      <p>• <strong>Governing Law:</strong> Jurisdiction and applicable legal framework</p>
                    </div>
                  </CollapsibleContent>
                </Collapsible>

                {/* Risks Section */}
                <Collapsible>
                  <CollapsibleTrigger className="flex items-center justify-between w-full p-4 bg-muted rounded-lg hover:bg-muted/80 transition-colors">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-destructive" />
                      <span className="font-medium text-neutral-dark">Identified Risks</span>
                    </div>
                    <div className="text-xs text-neutral-foreground">Click to expand</div>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="mt-2 p-4 bg-card rounded-lg border">
                    <div className="space-y-3 text-sm text-neutral-foreground">
                      <p>• <strong>High Risk:</strong> Unlimited liability exposure in certain scenarios</p>
                      <p>• <strong>Medium Risk:</strong> Ambiguous language in dispute resolution clauses</p>
                      <p>• <strong>Low Risk:</strong> Standard commercial terms with industry benchmarks</p>
                    </div>
                  </CollapsibleContent>
                </Collapsible>

                {/* Obligations Section */}
                <Collapsible>
                  <CollapsibleTrigger className="flex items-center justify-between w-full p-4 bg-muted rounded-lg hover:bg-muted/80 transition-colors">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-primary" />
                      <span className="font-medium text-neutral-dark">Your Obligations</span>
                    </div>
                    <div className="text-xs text-neutral-foreground">Click to expand</div>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="mt-2 p-4 bg-card rounded-lg border">
                    <div className="space-y-3 text-sm text-neutral-foreground">
                      <p>• <strong>Performance Standards:</strong> Quality benchmarks and delivery requirements</p>
                      <p>• <strong>Reporting Requirements:</strong> Regular updates and documentation needed</p>
                      <p>• <strong>Compliance Obligations:</strong> Regulatory and industry standards to maintain</p>
                      <p>• <strong>Confidentiality:</strong> Information protection and non-disclosure requirements</p>
                    </div>
                  </CollapsibleContent>
                </Collapsible>

                {/* Recommendations Section */}
                <Collapsible>
                  <CollapsibleTrigger className="flex items-center justify-between w-full p-4 bg-muted rounded-lg hover:bg-muted/80 transition-colors">
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-4 w-4 text-primary" />
                      <span className="font-medium text-neutral-dark">Recommendations</span>
                    </div>
                    <div className="text-xs text-neutral-foreground">Click to expand</div>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="mt-2 p-4 bg-card rounded-lg border">
                    <div className="space-y-3 text-sm text-neutral-foreground">
                      <p>• <strong>Review Clause 12:</strong> Consider adding specific performance metrics</p>
                      <p>• <strong>Legal Consultation:</strong> Consult with specialized counsel on IP provisions</p>
                      <p>• <strong>Insurance Coverage:</strong> Verify adequate coverage for identified liabilities</p>
                      <p>• <strong>Amendment Needed:</strong> Clarify dispute resolution mechanism</p>
                    </div>
                  </CollapsibleContent>
                </Collapsible>

                {/* Download Button */}
                <div className="pt-4">
                  <Button className="w-full bg-primary hover:bg-primary/90" size="lg">
                    <Download className="h-4 w-4 mr-2" />
                    Download PDF Summary
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Workspace;