import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { RefreshCw, CheckCircle, XCircle, Clock, Zap } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Document {
  id: string;
  title: string;
  original_filename: string;
  processing_status: string;
  embedding_status: string;
  chunks_count: number;
  created_at: string;
  file_type: string;
}

interface DocumentProcessorProps {
  userId: string;
  onDocumentReady?: (documentId: string) => void;
  autoProcessDocumentId?: string;
}

export const DocumentProcessor: React.FC<DocumentProcessorProps> = ({ 
  userId, 
  onDocumentReady,
  autoProcessDocumentId
}) => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingDocs, setProcessingDocs] = useState<Set<string>>(new Set());
  const { toast } = useToast();
  const [autoTriggeredFor, setAutoTriggeredFor] = useState<string | null>(null);

  useEffect(() => {
    fetchDocuments();
  }, [userId]);

  // Auto-process the target document when available
  useEffect(() => {
    if (!autoProcessDocumentId || autoTriggeredFor === autoProcessDocumentId) return;
    const target = documents.find(d => d.id === autoProcessDocumentId);
    if (!target) return;

    // If already processed, notify and skip
    if (target.processing_status === 'ready' && target.embedding_status === 'completed') {
      onDocumentReady?.(target.id);
      setAutoTriggeredFor(autoProcessDocumentId);
      toast({ title: 'Report Ready', description: 'Document is already processed and ready for chat.' });
      return;
    }

    // If can process, start processing automatically
    if (canProcess(target.processing_status, target.embedding_status)) {
      setAutoTriggeredFor(autoProcessDocumentId);
      toast({ title: 'Starting Processing', description: 'Automatically processing your uploaded document...' });
      processDocument(target.id);
    }
  }, [documents, autoProcessDocumentId, autoTriggeredFor]);

  const fetchDocuments = async () => {
    try {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setDocuments(data || []);
    } catch (error) {
      console.error('Error fetching documents:', error);
      toast({
        title: "Error",
        description: "Failed to fetch documents",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const processDocument = async (documentId: string) => {
    setProcessingDocs(prev => new Set([...prev, documentId]));
    
    try {
      // Step 1: Process document and create chunks
      const { error: processError } = await supabase.functions.invoke('process-document', {
        body: {
          documentId,
          userId
        }
      });

      if (processError) throw processError;

      // Step 2: Generate embeddings and store in Pinecone
      const { error: embeddingError } = await supabase.functions.invoke('generate-embeddings', {
        body: {
          documentId,
          userId
        }
      });

      if (embeddingError) throw embeddingError;

      toast({
        title: "Success",
        description: "Document processed and ready for chat!",
      });

      onDocumentReady?.(documentId);
      await fetchDocuments(); // Refresh the list

    } catch (error) {
      console.error('Error processing document:', error);
      toast({
        title: "Error",
        description: `Failed to process document: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setProcessingDocs(prev => {
        const newSet = new Set(prev);
        newSet.delete(documentId);
        return newSet;
      });
    }
  };

  const getStatusIcon = (processingStatus: string, embeddingStatus: string) => {
    if (processingStatus === 'ready' && embeddingStatus === 'completed') {
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    }
    if (processingStatus === 'failed' || embeddingStatus === 'failed') {
      return <XCircle className="h-4 w-4 text-red-500" />;
    }
    if (processingStatus === 'processing' || embeddingStatus === 'processing') {
      return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />;
    }
    return <Clock className="h-4 w-4 text-yellow-500" />;
  };

  const getStatusText = (processingStatus: string, embeddingStatus: string) => {
    if (processingStatus === 'ready' && embeddingStatus === 'completed') {
      return 'Ready for Chat';
    }
    if (processingStatus === 'failed' || embeddingStatus === 'failed') {
      return 'Processing Failed';
    }
    if (processingStatus === 'processing') {
      return 'Extracting Text...';
    }
    if (embeddingStatus === 'processing') {
      return 'Generating Embeddings...';
    }
    if (processingStatus === 'chunked' && embeddingStatus === 'pending') {
      return 'Ready for Embedding';
    }
    return 'Pending';
  };

  const getStatusVariant = (processingStatus: string, embeddingStatus: string) => {
    if (processingStatus === 'ready' && embeddingStatus === 'completed') {
      return 'default';
    }
    if (processingStatus === 'failed' || embeddingStatus === 'failed') {
      return 'destructive';
    }
    return 'secondary';
  };

  const canProcess = (processingStatus: string, embeddingStatus: string) => {
    return processingStatus === 'pending' || 
           (processingStatus === 'chunked' && embeddingStatus === 'pending') ||
           processingStatus === 'failed' || 
           embeddingStatus === 'failed';
  };

  const getProgress = (processingStatus: string, embeddingStatus: string) => {
    if (processingStatus === 'pending') return 0;
    if (processingStatus === 'processing') return 25;
    if (processingStatus === 'chunked' && embeddingStatus === 'pending') return 50;
    if (embeddingStatus === 'processing') return 75;
    if (processingStatus === 'ready' && embeddingStatus === 'completed') return 100;
    return 0;
  };

  return (
    <div className="space-y-6">
      {isLoading ? (
        <Card className="shadow-card border-0">
          <CardContent className="p-8">
            <div className="flex items-center justify-center">
              <RefreshCw className="h-6 w-6 animate-spin text-primary mr-3" />
              <span className="text-neutral-dark">Loading documents...</span>
            </div>
          </CardContent>
        </Card>
      ) : documents.length === 0 ? (
        <Card className="shadow-card border-0">
          <CardContent className="p-8">
            <div className="text-center text-neutral-foreground">
              <Clock className="h-12 w-12 mx-auto mb-4 text-neutral-foreground/50" />
              <p className="text-lg mb-2">No documents to process</p>
              <p className="text-sm">Upload a document to begin processing</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        documents.map((doc) => (
          <Card key={doc.id} className="shadow-card border-0">
            <CardContent className="p-6">
              <div className="space-y-4">
                {/* Document Info */}
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-neutral-dark text-lg">{doc.original_filename}</h3>
                    <p className="text-sm text-neutral-foreground">
                      {doc.file_type.toUpperCase()} • Uploaded {new Date(doc.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {getStatusIcon(doc.processing_status, doc.embedding_status)}
                    <Badge 
                      variant={getStatusVariant(doc.processing_status, doc.embedding_status)}
                      className="text-xs px-3 py-1"
                    >
                      {getStatusText(doc.processing_status, doc.embedding_status)}
                    </Badge>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-neutral-foreground">Processing Progress</span>
                    <span className="text-neutral-dark font-medium">
                      {getProgress(doc.processing_status, doc.embedding_status)}%
                    </span>
                  </div>
                  <Progress 
                    value={getProgress(doc.processing_status, doc.embedding_status)} 
                    className="h-3 bg-neutral-light"
                  />
                </div>

                {/* Status Details */}
                {(doc.processing_status === 'processing' || doc.embedding_status === 'processing') && (
                  <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-sm">
                      <RefreshCw className="h-4 w-4 animate-spin text-primary" />
                      <span className="text-neutral-dark">
                        {doc.processing_status === 'processing' 
                          ? 'Extracting text and analyzing document structure...' 
                          : 'Creating embeddings for intelligent search and conversation...'
                        }
                      </span>
                    </div>
                  </div>
                )}

                {/* Process Button */}
                {canProcess(doc.processing_status, doc.embedding_status) && (
                  <Button
                    onClick={() => processDocument(doc.id)}
                    disabled={processingDocs.has(doc.id)}
                    className="w-full bg-primary hover:bg-primary/90 text-white"
                    size="lg"
                  >
                    {processingDocs.has(doc.id) ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                        Processing Document...
                      </>
                    ) : (
                      <>
                        <Zap className="h-4 w-4 mr-2" />
                        Start Processing
                      </>
                    )}
                  </Button>
                )}

                {/* Completed Status */}
                {doc.processing_status === 'ready' && doc.embedding_status === 'completed' && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-green-800">
                        Document processed successfully! Redirecting to workspace...
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
};