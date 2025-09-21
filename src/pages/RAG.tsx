import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

import Header from '@/components/Header';
import { DocumentProcessor } from '@/components/DocumentProcessor';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, Zap } from 'lucide-react';

const RAG = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const location = useLocation();
  const [autoDocId, setAutoDocId] = useState<string | null>(null);

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

  // Parse docId from URL for auto-processing
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const docId = params.get('docId');
    if (docId) {
      setAutoDocId(docId);
    }
  }, [location.search]);

  const handleBackToDashboard = () => {
    navigate('/dashboard');
  };

  const handleDocumentReady = (documentId: string) => {
    // Redirect to workspace when document is ready
    navigate(`/workspace?docId=${documentId}`);
  };

  const getUserId = () => {
    return user?.id || '00000000-0000-0000-0000-000000000001'; // Guest fallback
  };

  return (
    <div className="min-h-screen bg-neutral">
      <Header />
      
      <div className="container mx-auto px-6 py-8 max-w-4xl">
        <div className="mb-8">
          <Button
            onClick={handleBackToDashboard}
            variant="ghost"
            className="mb-4 text-neutral-dark"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Zap className="h-6 w-6 text-primary" />
              <h1 className="text-3xl font-bold text-neutral-dark">Document Processing</h1>
            </div>
            <p className="text-neutral-foreground text-lg max-w-2xl mx-auto">
              Your document is being analyzed and prepared for intelligent conversation. 
              This process includes text extraction and embedding generation for optimal AI performance.
            </p>
          </div>
        </div>

        <div className="max-w-2xl mx-auto">
          <DocumentProcessor 
            userId={getUserId()} 
            onDocumentReady={handleDocumentReady}
            autoProcessDocumentId={autoDocId || undefined}
          />
        </div>
      </div>
    </div>
  );
};

export default RAG;