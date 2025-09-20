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

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Document Processing</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin" />
            <span className="ml-2">Loading documents...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5" />
          Document Processing
        </CardTitle>
      </CardHeader>
      <CardContent>
        {documents.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            <p>No documents uploaded yet.</p>
            <p className="text-sm mt-2">Upload some documents to get started!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {documents.map((doc) => (
              <div key={doc.id} className="border rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-medium">{doc.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {doc.original_filename} • {doc.file_type}
                    </p>
                    <div className="mt-2 flex items-center gap-2">
                      {getStatusIcon(doc.processing_status, doc.embedding_status)}
                      <Badge variant={getStatusVariant(doc.processing_status, doc.embedding_status)}>
                        {getStatusText(doc.processing_status, doc.embedding_status)}
                      </Badge>
                      {doc.chunks_count > 0 && (
                        <span className="text-xs text-muted-foreground">
                          {doc.chunks_count} chunks
                        </span>
                      )}
                    </div>
                    
                    <Progress 
                      value={getProgress(doc.processing_status, doc.embedding_status)} 
                      className="mt-2 h-2"
                    />
                  </div>
                  
                  <div className="ml-4">
                    {canProcess(doc.processing_status, doc.embedding_status) && (
                      <Button
                        onClick={() => processDocument(doc.id)}
                        disabled={processingDocs.has(doc.id)}
                        size="sm"
                      >
                        {processingDocs.has(doc.id) ? (
                          <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                          <Zap className="h-4 w-4 mr-2" />
                        )}
                        {processingDocs.has(doc.id) ? 'Processing...' : 'Process'}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};