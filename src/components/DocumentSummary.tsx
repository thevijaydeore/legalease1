import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { FileText, RefreshCw, Download, Eye } from 'lucide-react';
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
  file_size: number;
}

interface DocumentSummaryProps {
  userId: string;
  onSelectDocument: (documentId: string) => void;
  selectedDocumentId?: string;
}

export const DocumentSummary: React.FC<DocumentSummaryProps> = ({ 
  userId, 
  onSelectDocument,
  selectedDocumentId 
}) => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [documentSummaries, setDocumentSummaries] = useState<Record<string, string>>({});
  const { toast } = useToast();

  useEffect(() => {
    fetchDocuments();
  }, [userId]);

  const fetchDocuments = async () => {
    try {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('user_id', userId)
        .eq('processing_status', 'ready')
        .eq('embedding_status', 'completed')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setDocuments(data || []);
      
      // Generate summaries for ready documents
      (data || []).forEach(doc => {
        generateDocumentSummary(doc.id, doc.title);
      });
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

  const generateDocumentSummary = async (documentId: string, title: string) => {
    // For now, generate a simple summary based on document title and metadata
    // In a full implementation, this would use the RAG system to generate real summaries
    const mockSummary = `This document "${title}" has been processed and is ready for chat. It contains structured information that can be queried using natural language. You can ask questions about specific sections, request summaries, or analyze the content in detail.`;
    
    setDocumentSummaries(prev => ({
      ...prev,
      [documentId]: mockSummary
    }));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileTypeColor = (fileType: string) => {
    if (fileType.includes('pdf')) return 'bg-red-100 text-red-800';
    if (fileType.includes('word') || fileType.includes('doc')) return 'bg-blue-100 text-blue-800';
    if (fileType.includes('text')) return 'bg-green-100 text-green-800';
    return 'bg-gray-100 text-gray-800';
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Document Summary</CardTitle>
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
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Document Summary ({documents.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {documents.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No processed documents yet.</p>
            <p className="text-sm mt-2">Process some documents to see summaries here!</p>
          </div>
        ) : (
          <ScrollArea className="h-[400px]">
            <div className="space-y-4">
              {documents.map((doc) => (
                <div 
                  key={doc.id} 
                  className={`border rounded-lg p-4 cursor-pointer transition-colors hover:bg-muted/50 ${
                    selectedDocumentId === doc.id ? 'ring-2 ring-primary bg-primary/5' : ''
                  }`}
                  onClick={() => onSelectDocument(doc.id)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h3 className="font-medium line-clamp-1">{doc.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        {doc.original_filename}
                      </p>
                    </div>
                    <Badge 
                      variant="secondary" 
                      className={`ml-2 ${getFileTypeColor(doc.file_type)}`}
                    >
                      {doc.file_type.split('/')[1]?.toUpperCase() || 'FILE'}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-4 text-xs text-muted-foreground mb-2">
                    <span>{formatFileSize(doc.file_size)}</span>
                    <span>{doc.chunks_count} chunks</span>
                    <span>{new Date(doc.created_at).toLocaleDateString()}</span>
                  </div>

                  <Separator className="my-2" />
                  
                  <div className="text-sm">
                    <p className="text-muted-foreground">
                      {documentSummaries[doc.id] || 'Generating summary...'}
                    </p>
                  </div>

                  {selectedDocumentId === doc.id && (
                    <div className="mt-3 pt-3 border-t">
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">
                          <Eye className="h-3 w-3 mr-1" />
                          View Details
                        </Button>
                        <Button size="sm" variant="outline">
                          <Download className="h-3 w-3 mr-1" />
                          Download
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
};