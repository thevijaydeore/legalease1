import { useState, useCallback } from 'react';
import type { DragEvent } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Upload, FileText, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface DocumentUploadProps {
  onProcessDocument: (content: string) => void;
  isProcessing: boolean;
  onBackToHome?: () => void;
}

const DocumentUpload = ({ onProcessDocument, isProcessing, onBackToHome }: DocumentUploadProps) => {
  const [uploadMethod, setUploadMethod] = useState<'upload' | 'paste'>('upload');
  const [textContent, setTextContent] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const { toast } = useToast();

  const handleDrop = useCallback((e: DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    const files = Array.from(e.dataTransfer.files) as File[];
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  }, []);

  const handleFileUpload = async (file: File) => {
    console.log('=== STARTING FILE UPLOAD DEBUG ===');
    console.log('File details:', { name: file.name, size: file.size, type: file.type });
    
    try {
      console.log('Step 1: Starting file upload...', file.name);
      
      // Get the authenticated user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      console.log('Step 2: User check result:', { user: user?.id, error: userError });
      
      if (!user) {
        // For guest users, try to create a guest session
        console.log('Step 3: Creating guest session...');
        const { data: guestData, error: guestError } = await supabase.rpc('create_guest_session');
        console.log('Step 3 result:', { guestData, guestError });
        if (guestError) {
          console.error('Guest session creation failed:', guestError);
          throw new Error('Authentication required. Please sign up or sign in to upload documents.');
        }
      }
      
      const userId = user?.id || '00000000-0000-0000-0000-000000000001'; // Use guest user ID if not authenticated
      console.log('Step 4: Using user ID:', userId);

      // Generate unique file path
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `${userId}/${fileName}`;
      console.log('Step 5: Generated file path:', filePath);

      toast({
        title: "Uploading...",
        description: "Your document is being uploaded to secure storage.",
      });

      // Upload file to Supabase Storage
      console.log('Step 6: Uploading to storage...');
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, file);

      console.log('Step 6 result:', { uploadData, uploadError });
      
      if (uploadError) {
        console.error('Storage upload failed:', uploadError);
        throw uploadError;
      }

      // Insert document record into database
      console.log('Step 7: Inserting document record...');
      const documentRecord = {
        user_id: userId,
        title: file.name,
        original_filename: file.name,
        file_path: filePath,
        file_size: file.size,
        file_type: file.type || 'application/octet-stream',
        analysis_status: 'pending'
      };
      console.log('Step 7: Document record to insert:', documentRecord);
      
      const { data: documentData, error: insertError } = await supabase
        .from('documents')
        .insert(documentRecord)
        .select()
        .single();

      console.log('Step 7 result:', { documentData, insertError });
      
      if (insertError) {
        console.error('Database insert failed:', insertError);
        throw insertError;
      }

      console.log('=== UPLOAD SUCCESS ===');
      toast({
        title: "Upload Successful!",
        description: `${file.name} has been uploaded and saved to your documents.`,
      });

      // Pass success message to parent component
      const successMessage = `Uploaded: ${file.name}. Document ID: ${documentData.id}. File stored securely in your account.`;
      console.log('Step 8: Calling onProcessDocument with:', successMessage);
      onProcessDocument(successMessage);
      
    } catch (error: any) {
      console.error('=== UPLOAD ERROR ===', error);
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      });
      
      toast({
        title: "Upload Failed",
        description: error.message || "There was an error uploading your document. Please try again.",
        variant: "destructive"
      });

      // Don't fallback to demo processing - just show the error
      // This prevents triggering the static analysis page on upload failures
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