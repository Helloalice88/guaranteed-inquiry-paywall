
import { Toaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useEffect } from "react";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import PaymentPage from "./pages/PaymentPage";
import ResponsePage from "./pages/ResponsePage";
import PaymentSuccess from "./pages/PaymentSuccess";
import { supabase } from "./lib/supabase";

const queryClient = new QueryClient();

const App = () => {
  useEffect(() => {
    // Écouter les changements d'authentification
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Auth state changed:', event, session?.user?.id);
        
        // Optionnel: Rediriger automatiquement après login
        if (event === 'SIGNED_IN' && session) {
          // L'utilisateur vient de se connecter
          console.log('User signed in:', session.user.email);
        }
        
        if (event === 'SIGNED_OUT') {
          // L'utilisateur vient de se déconnecter
          console.log('User signed out');
        }
      }
    );

    // Cleanup
    return () => subscription.unsubscribe();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        {/* Toast notifications */}
        <Toaster 
          position="top-right" 
          richColors 
          expand 
          closeButton
          toastOptions={{
            duration: 5000,
            style: {
              background: 'white',
              border: '1px solid #e2e8f0',
              color: '#1f2937',
            },
          }}
        />
        
        <BrowserRouter>
          <Routes>
            {/* Page d'accueil */}
            <Route path="/" element={<Index />} />
            
            {/* Authentification */}
            <Route path="/auth" element={<Auth />} />
            
            {/* Dashboard utilisateur */}
            <Route path="/dashboard" element={<Dashboard />} />
            
            {/* Page de paiement */}
            <Route path="/pay/:userId" element={<PaymentPage />} />
            
            {/* Page de réponse pour les utilisateurs */}
            <Route path="/respond/:messageId" element={<ResponsePage />} />
            
            {/* Page de succès après paiement */}
            <Route path="/payment-success" element={<PaymentSuccess />} />
            
            {/* Routes alternatives/legacy (optionnel) */}
            <Route path="/payment/:userId" element={<PaymentPage />} />
            <Route path="/message/:messageId" element={<ResponsePage />} />
            
            {/* Route 404 - Fallback */}
            <Route path="*" element={
              <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50">
                <div className="text-center p-8">
                  <h1 className="text-4xl font-bold text-gray-800 mb-4">404</h1>
                  <p className="text-gray-600 mb-6">Page non trouvée</p>
                  <a 
                    href="/" 
                    className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Retour à l'accueil
                  </a>
                </div>
              </div>
            } />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
