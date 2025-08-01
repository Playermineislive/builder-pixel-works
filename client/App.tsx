import "./global.css";

import { Toaster } from "@/components/ui/toaster";
import { createRoot } from "react-dom/client";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { EncryptionProvider } from "./contexts/EncryptionContext";
import { TranslationProvider } from "./contexts/TranslationContext";
import { ContactProvider } from "./contexts/ContactContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import Index from "./pages/Index";
import ContactsList from "./pages/ContactsList";
import GroupChat from "./pages/GroupChat";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <EncryptionProvider>
        <TranslationProvider>
          <ContactProvider>
            <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/contacts" element={<ContactsList onSelectContact={() => {}} onCreateGroup={() => {}} onBack={() => {}} />} />
                <Route path="/invite/:code" element={<Index />} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
            </TooltipProvider>
          </ContactProvider>
        </TranslationProvider>
      </EncryptionProvider>
    </AuthProvider>
  </QueryClientProvider>
);

createRoot(document.getElementById("root")!).render(<App />);
