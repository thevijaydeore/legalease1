import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import { ChatInterface } from '@/components/ChatInterface';
import { DocumentProcessor } from '@/components/DocumentProcessor';
import { DocumentGrid } from '@/components/DocumentGrid';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, Upload, MessageSquare, FileText, Zap } from 'lucide-react';

const RAG = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [activeTab, setActiveTab] = useState('chat');

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleBackToDashboard = () => {
    navigate('/dashboard');
  };

  const handleDocumentReady = (documentId: string) => {
    // Switch to chat tab when document is ready
    setActiveTab('chat');
  };

  const getUserId = () => {
    return user?.id || '00000000-0000-0000-0000-000000000001'; // Guest fallback
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-accent/5">
      <Header />
      
      <div className="container mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <Button
              onClick={handleBackToDashboard}
              variant="ghost"
              className="mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
            <h1 className="text-3xl font-bold">RAG - Chat with Documents</h1>
            <p className="text-muted-foreground mt-2">
              Upload documents, process them with AI, and have intelligent conversations about your content.
            </p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="upload" className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Upload
            </TabsTrigger>
            <TabsTrigger value="process" className="flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Process
            </TabsTrigger>
            <TabsTrigger value="documents" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Documents
            </TabsTrigger>
            <TabsTrigger value="chat" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Chat
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Upload Documents</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground mb-4">
                    Upload documents to get started with RAG processing.
                  </p>
                  <Button onClick={() => navigate('/upload')}>
                    Go to Upload Page
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="process" className="space-y-6">
            <DocumentProcessor 
              userId={getUserId()} 
              onDocumentReady={handleDocumentReady}
            />
          </TabsContent>

          <TabsContent value="documents" className="space-y-6">
            <DocumentGrid user={user} onOpenUploadModal={() => navigate('/upload')} />
          </TabsContent>

          <TabsContent value="chat" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <ChatInterface userId={getUserId()} />
              </div>
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">How to use RAG</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="bg-primary/10 text-primary rounded-full p-1 mt-0.5">
                        <span className="text-xs font-bold px-1">1</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Upload Documents</p>
                        <p className="text-xs text-muted-foreground">Start by uploading your documents</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="bg-primary/10 text-primary rounded-full p-1 mt-0.5">
                        <span className="text-xs font-bold px-1">2</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Process with AI</p>
                        <p className="text-xs text-muted-foreground">Let AI chunk and embed your content</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="bg-primary/10 text-primary rounded-full p-1 mt-0.5">
                        <span className="text-xs font-bold px-1">3</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Chat & Ask</p>
                        <p className="text-xs text-muted-foreground">Ask questions about your documents</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Example Questions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="text-xs text-muted-foreground space-y-1">
                      <p>• "Summarize the main points"</p>
                      <p>• "What are the key findings?"</p>
                      <p>• "Find information about [topic]"</p>
                      <p>• "Compare sections A and B"</p>
                      <p>• "What does this document say about X?"</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default RAG;