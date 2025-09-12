import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { useAuth } from '@/contexts/SupabaseAuthContext.jsx';

// Importe suas páginas (mantive todos os seus imports originais)
import LandingPage from '@/pages/LandingPage.jsx';
import ClinicLoginPage from '@/pages/ClinicLoginPage.jsx';
import ClinicSignUpPage from '@/pages/ClinicSignUpPage.jsx';
import TutorLoginPage from '@/pages/TutorLoginPage.jsx';
import TutorSignUpPage from '@/pages/TutorSignUpPage.jsx';
import ClinicDashboardLayout from '@/pages/clinic/ClinicDashboardLayout.jsx';
import ClinicDashboardPage from '@/pages/clinic/ClinicDashboardPage.jsx';
import ClinicPetsPage from '@/pages/clinic/ClinicPetsPage.jsx';
import ClinicMedicalRecordsPage from '@/pages/clinic/ClinicMedicalRecordsPage.jsx';
import PetMedicalRecordPage from '@/pages/clinic/PetMedicalRecordPage.jsx';
import ClinicAppointmentsPage from '@/pages/clinic/ClinicAppointmentsPage.jsx';
import ClinicAgendaPage from '@/pages/clinic/ClinicAgendaPage.jsx';
import ClinicSettingsPage from '@/pages/clinic/ClinicSettingsPage.jsx';
import ClinicReportsPage from '@/pages/clinic/ClinicReportsPage.jsx';
import TutorDashboardLayout from '@/pages/tutor/TutorDashboardLayout.jsx';
import TutorDashboardPage from '@/pages/tutor/TutorDashboardPage.jsx';
import TutorPetsPage from '@/pages/tutor/TutorPetsPage.jsx';
import TutorPartnersPage from '@/pages/tutor/TutorPartnersPage.jsx';
import TutorPetIdCardPage from '@/pages/tutor/TutorPetIdCardPage.jsx';
import TutorAppointmentsPage from '@/pages/tutor/TutorAppointmentsPage.jsx';
import TutorMedicalRecordsPage from '@/pages/tutor/TutorMedicalRecordsPage.jsx';
import TutorPetMedicalRecordPage from '@/pages/tutor/TutorPetMedicalRecordPage.jsx';
import TutorSettingsPage from '@/pages/tutor/TutorSettingsPage.jsx';
import PetPublicPage from '@/pages/PetPublicPage.jsx';
import EmailConfirmationPage from '@/pages/EmailConfirmationPage.jsx';
import ClinicIdCardsPage from '@/pages/clinic/ClinicIdCardsPage.jsx';
import PetIdCardPage from '@/pages/clinic/PetIdCardPage.jsx';
import TutorIdCardsPage from '@/pages/tutor/TutorIdCardsPage.jsx';

// Seu componente PrivateRoute original (está perfeito, não precisa de mudanças)
function PrivateRoute({ children, allowedRoles }) {
    const { user, loading, userRole } = useAuth();
    const location = useLocation();

    if (loading) {
        return (
          <div className="flex h-screen w-full items-center justify-center bg-background">
            <p className="text-lg text-muted-foreground">Carregando sua experiência...</p>
          </div>
        );
    }

    if (!user) {
        const loginPath = location.pathname.startsWith('/tutor') ? '/tutor/login' : '/login';
        return <Navigate to={loginPath} />;
    }
    
    if (!allowedRoles.includes(userRole)) {
        const homePath = userRole === 'tutor' ? '/tutor/dashboard' : '/dashboard';
        return <Navigate to={homePath} />;
    }

    return children;
}

// Componente App principal com a correção integrada
function App() {
    // Pega os estados de `loading` e `session` para controlar o roteamento
    const { loading, session, userRole } = useAuth();

    // ================== CORREÇÃO APLICADA AQUI ==================
    // Enquanto o Supabase verifica a sessão no LocalStorage, exibimos uma tela de carregamento global.
    // Isso impede que qualquer rota seja renderizada prematuramente, resolvendo o bug do logout.
    if (loading) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-background">
                <p className="text-lg text-muted-foreground">Verificando sua sessão...</p>
            </div>
        );
    }
    // ============================================================

    return (
        <>
            <Helmet>
                <title>PetSafe QR - Gestão Inteligente de Pets</title>
                <meta name="description" content="A solução completa para clínicas veterinárias e ONGs gerenciarem a saúde e identificação de pets com carteirinhas e QR Codes." />
                <meta property="og:title" content="PetSafe QR - Gestão Inteligente de Pets" />
                <meta property="og:description" content="A solução completa para clínicas veterinárias e ONGs gerenciarem a saúde e identificação de pets com carteirinhas e QR Codes." />
            </Helmet>
            <Routes>
                {/* Rotas Públicas que não mudam */}
                <Route path="/pet/:id" element={<PetPublicPage />} />
                <Route path="/confirm-email" element={<EmailConfirmationPage />} />

                {/* ================== ROTAS DE AUTH ATUALIZADAS ================== */}
                {/* Se o usuário já está logado, ele é redirecionado para o dashboard apropriado ao tentar acessar uma página de login/cadastro. */}
                <Route path="/login" element={session ? <Navigate to={userRole === 'clinica' ? '/dashboard' : '/tutor/dashboard'} /> : <ClinicLoginPage />} />
                <Route path="/cadastro" element={session ? <Navigate to={userRole === 'clinica' ? '/dashboard' : '/tutor/dashboard'} /> : <ClinicSignUpPage />} />
                <Route path="/tutor/login" element={session ? <Navigate to={userRole === 'tutor' ? '/tutor/dashboard' : '/dashboard'} /> : <TutorLoginPage />} />
                <Route path="/tutor/cadastro" element={session ? <Navigate to={userRole === 'tutor' ? '/tutor/dashboard' : '/dashboard'} /> : <TutorSignUpPage />} />
                
                {/* Rota Raiz (Landing Page) ou redirecionamento se logado */}
                <Route path="/" element={session ? <Navigate to={userRole === 'clinica' ? '/dashboard' : '/tutor/dashboard'} /> : <LandingPage />} />
                {/* ================================================================= */}

                {/* Rotas Privadas da Clínica (Seu código original, mantido intacto) */}
                <Route path="/dashboard" element={<PrivateRoute allowedRoles={['clinica']}><ClinicDashboardLayout /></PrivateRoute>}>
                    <Route index element={<ClinicDashboardPage />} />
                    <Route path="pets" element={<ClinicPetsPage />} />
                    <Route path="prontuarios" element={<ClinicMedicalRecordsPage />} />
                    <Route path="prontuarios/:id" element={<PetMedicalRecordPage />} />
                    <Route path="solicitacoes" element={<ClinicAppointmentsPage />} />
                    <Route path="agenda" element={<ClinicAgendaPage />} />
                    <Route path="relatorios" element={<ClinicReportsPage />} />
                    <Route path="configuracoes" element={<ClinicSettingsPage />} />
                    <Route path="carteirinhas" element={<ClinicIdCardsPage />} />
                    <Route path="pets/:id/carteirinha" element={<PetIdCardPage />} />
                </Route>

                {/* Rotas Privadas do Tutor (Seu código original, mantido intacto) */}
                <Route path="/tutor/dashboard" element={<PrivateRoute allowedRoles={['tutor']}><TutorDashboardLayout /></PrivateRoute>}>
                    <Route index element={<TutorDashboardPage />} />
                    <Route path="pets" element={<TutorPetsPage />} />
                    <Route path="parceiros" element={<TutorPartnersPage />} />
                    <Route path="carteirinhas" element={<TutorIdCardsPage />} />
                    <Route path="pets/:id/carteirinha" element={<TutorPetIdCardPage />} />
                    <Route path="consultas" element={<TutorAppointmentsPage />} />
                    <Route path="prontuarios" element={<TutorMedicalRecordsPage />} />
                    <Route path="prontuarios/:id" element={<TutorPetMedicalRecordPage />} />
                    <Route path="configuracoes" element={<TutorSettingsPage />} />
                </Route>

            </Routes>
        </>
    );
}

export default App;
