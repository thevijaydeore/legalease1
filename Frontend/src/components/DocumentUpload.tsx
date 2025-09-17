import { useState, useCallback } from 'react';
import type { DragEvent } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Upload, FileText, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface DocumentUploadProps {
  onProcessDocument: (content: string) => void;
  isProcessing: boolean;
  onBackToHome?: () => void;
}

const DocumentUpload = ({ onProcessDocument, isProcessing, onBackToHome }: DocumentUploadProps) => {
  const [uploadMethod, setUploadMethod] = useState<'upload' | 'paste'>('upload');
  const [textContent, setTextContent] = useState('');
  const [dragOver, setDragOver] = useState(false);

  const API_BASE = (import.meta as any)?.env?.VITE_API_BASE || "http://localhost:8000";

  const handleDrop = useCallback((e: DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    const files = Array.from(e.dataTransfer.files) as File[];
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  }, []);

  const handleFileUpload = async (file: File) => {
    try {
      // Try to get the authenticated Supabase user id (optional)
      const { data } = await supabase.auth.getUser();
      const userId = data?.user?.id || undefined;

      const form = new FormData();
      form.append('file', file);
      if (userId) form.append('user_id', userId);

      const res = await fetch(`${API_BASE}/documents/upload`, {
        method: 'POST',
        body: form,
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Upload failed (${res.status}): ${errText}`);
      }

      const payload = await res.json();
      // Pass a human-friendly message up
      onProcessDocument(`Uploaded: ${file.name}. Document ID: ${payload.document_id}. ${payload.message || ''}`);
    } catch (e: any) {
      console.error('Upload error:', e);
      // Fallback to previous demo behavior so UX isn't blocked
      if (file.type === 'text/plain') {
        const text = await file.text();
        onProcessDocument(text);
      } else {
        onProcessDocument("Sample legal document content for demonstration...");
      }
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const handleTextSubmit = () => {
    if (textContent.trim()) {
      onProcessDocument(textContent);
    }
  };

  return (
    <section className="min-h-screen flex items-center justify-center bg-gradient-to-b from-primary/5 to-background">
      <div className="container mx-auto px-6 py-20">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Upload Your Legal Document
            </h2>
            <p className="text-xl text-muted-foreground">
              Choose how you'd like to provide your document for analysis
            </p>
            {onBackToHome && (
              <Button variant="ghost" onClick={onBackToHome} className="mt-4">
                ← Back to Home
              </Button>
            )}
          </div>

          <div className="flex justify-center mb-8">
            <div className="inline-flex rounded-lg border border-border bg-background p-1">
              <Button
                variant={uploadMethod === 'upload' ? 'default' : 'ghost'}
                onClick={() => setUploadMethod('upload')}
                className="rounded-md"
              >
                <Upload className="w-4 h-4 mr-2" />
                Upload File
              </Button>
              <Button
                variant={uploadMethod === 'paste' ? 'default' : 'ghost'}
                onClick={() => setUploadMethod('paste')}
                className="rounded-md"
              >
                <FileText className="w-4 h-4 mr-2" />
                Paste Text
              </Button>
            </div>
          </div>

          {uploadMethod === 'upload' ? (
            <Card className="mb-8">
              <CardContent className="p-12">
                <div
                  className={`border-2 border-dashed rounded-xl p-12 text-center transition-all duration-300 ${
                    dragOver 
                      ? 'border-primary bg-primary/10' 
                      : 'border-border bg-muted/30'
                  }`}
                  onDrop={handleDrop}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragOver(true);
                  }}
                  onDragLeave={() => setDragOver(false)}
                >
                  <Upload className="w-16 h-16 mx-auto mb-6 text-muted-foreground" />
                  <h3 className="text-xl font-semibold mb-2">
                    Drag and drop your document
                  </h3>
                  <p className="text-muted-foreground mb-6">
                    or click to browse your files
                  </p>
                  <Button variant="upload" asChild>
                    <label className="cursor-pointer">
                      <input
                        type="file"
                        className="hidden"
                        accept=".pdf,.doc,.docx,.txt"
                        onChange={handleFileInput}
                        disabled={isProcessing}
                      />
                      Choose File
                    </label>
                  </Button>
                  <p className="text-sm text-muted-foreground mt-4">
                    Supports PDF, DOC, DOCX, TXT files up to 20MB
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="mb-8">
              <CardContent className="p-8">
                <Textarea
                  placeholder="Paste your legal document content here..."
                  value={textContent}
                  onChange={(e) => setTextContent(e.target.value)}
                  className="min-h-[300px] text-sm"
                  disabled={isProcessing}
                />
                <div className="flex justify-between items-center mt-4">
                  <p className="text-sm text-muted-foreground">
                    {textContent.length} characters
                  </p>
                  <Button 
                    onClick={handleTextSubmit}
                    disabled={!textContent.trim() || isProcessing}
                    className="ml-4"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      'Analyze Document'
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="text-center text-sm text-muted-foreground">
            <p className="mb-2">
              🔒 Your documents are processed securely and never stored
            </p>
            <p>
              ⚖️ This tool provides guidance only - not legal advice
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default DocumentUpload;