import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChatInterface } from '@/components/ChatInterface';
import { ArrowLeft, Download, FileText, AlertTriangle, Shield, Scale, BookOpen, RefreshCw } from 'lucide-react';
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
  summary_data?: any; // JSON data from Supabase
  summary_generated?: boolean;
}

interface SummaryData {
  key_clauses: string[];
  risks: Array<{level: string; description: string}>;
  obligations: string[];
  recommendations: string[];
}

const Workspace = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const documentId = searchParams.get('docId');
  const [document, setDocument] = useState<Document | null>(null);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRegenerating, setIsRegenerating] = useState(false);
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

  const regenerateSummary = async () => {
    if (!document || !documentId) return;
    
    setIsRegenerating(true);
    try {
      // First, clean up and reprocess the document if it has corrupted chunks
      console.log('Cleaning up document and reprocessing...');
      const cleanupResponse = await supabase.functions.invoke('cleanup-and-reprocess', {
        body: {
          documentId: documentId,
          userId: getUserId()
        }
      });

      if (cleanupResponse.error) {
        console.error('Cleanup error:', cleanupResponse.error);
        throw new Error('Failed to clean up document');
      }

      // Wait a moment for processing to complete
      console.log('Waiting for document processing...');
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Check if processing completed
      let attempts = 0;
      let processingCompleted = false;
      
      while (attempts < 10 && !processingCompleted) {
        const { data: docCheck } = await supabase
          .from('documents')
          .select('processing_status, embedding_status')
          .eq('id', documentId)
          .single();
        
        if (docCheck?.processing_status === 'chunked' && docCheck?.embedding_status === 'completed') {
          processingCompleted = true;
          break;
        }
        
        await new Promise(resolve => setTimeout(resolve, 2000));
        attempts++;
      }

      if (!processingCompleted) {
        throw new Error('Document processing did not complete in time');
      }

      // Now generate the summary
      console.log('Generating summary...');
      const { error } = await supabase.functions.invoke('generate-document-summary', {
        body: {
          documentId: documentId,
          userId: getUserId()
        }
      });

      if (error) throw error;

      // Refresh the document data to get the updated summary
      await fetchDocument();
      
      toast({
        title: "Success",
        description: "Document summary has been regenerated successfully",
      });
    } catch (error) {
      console.error('Error regenerating summary:', error);
      toast({
        title: "Error",
        description: "Failed to regenerate document summary. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsRegenerating(false);
    }
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
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl text-neutral-dark flex items-center gap-2">
                      <FileText className="h-5 w-5 text-primary" />
                      Detailed Summary
                    </CardTitle>
                    <p className="text-neutral-foreground text-sm">
                      Structured, well-organized summary of your legal document with key insights.
                    </p>
                  </div>
                  {document?.summary_generated && (
                    <Button
                      onClick={regenerateSummary}
                      disabled={isRegenerating}
                      variant="outline"
                      size="sm"
                      className="ml-4"
                    >
                      <RefreshCw className={`h-4 w-4 mr-2 ${isRegenerating ? 'animate-spin' : ''}`} />
                      {isRegenerating ? 'Regenerating...' : 'Regenerate'}
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {document?.summary_generated ? (
                  <>
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
                          {(document.summary_data as SummaryData)?.key_clauses?.map((clause, index) => (
                            <p key={index}>• {clause}</p>
                          )) || <p>No key clauses identified</p>}
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
                          {(document.summary_data as SummaryData)?.risks?.map((risk, index) => (
                            <p key={index}>• <strong>{risk.level} Risk:</strong> {risk.description}</p>
                          )) || <p>No risks identified</p>}
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
                          {(document.summary_data as SummaryData)?.obligations?.map((obligation, index) => (
                            <p key={index}>• {obligation}</p>
                          )) || <p>No specific obligations identified</p>}
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
                          {(document.summary_data as SummaryData)?.recommendations?.map((recommendation, index) => (
                            <p key={index}>• {recommendation}</p>
                          )) || <p>No specific recommendations available</p>}
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  </>
                ) : (
                  <div className="text-center py-8">
                    <div className="animate-pulse">
                      <div className="h-4 bg-muted rounded w-3/4 mx-auto mb-2"></div>
                      <div className="h-4 bg-muted rounded w-1/2 mx-auto"></div>
                    </div>
                    <p className="text-neutral-foreground mt-4">
                      Generating detailed document analysis...
                    </p>
                  </div>
                )}

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