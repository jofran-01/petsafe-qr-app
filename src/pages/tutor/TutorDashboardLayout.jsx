import React, { useState } from 'react';
import { Outlet, useLocation, Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Home, PawPrint, LogOut, Settings, HeartHandshake as Handshake, User, ClipboardList, CreditCard, Menu } from 'lucide-react';

const TutorDashboardLayout = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { user, signOut } = useAuth();

    // ================== LÓGICA PARA O MENU RESPONSIVO ==================
    // 1. Estado para controlar se a barra lateral está aberta ou fechada no mobile.
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    // =================================================================

    const handleSignOut = async () => {
        await signOut();
        navigate('/tutor/login');
    };

    const navItems = [
        { path: '/tutor/dashboard', icon: Home, label: 'Início' },
        { path: '/tutor/dashboard/pets', icon: PawPrint, label: 'Meus Pets' },
        { path: '/tutor/dashboard/prontuarios', icon: ClipboardList, label: 'Prontuários' },
        { path: '/tutor/dashboard/consultas', icon: User, label: 'Consultas' },
        { path: '/tutor/dashboard/carteirinhas', icon: CreditCard, label: 'Carteirinhas' },
        { path: '/tutor/dashboard/parceiros', icon: Handshake, label: 'Parceiros' },
        { path: '/tutor/dashboard/configuracoes', icon: Settings, label: 'Configurações' },
    ];

    // Componente interno para a barra lateral, para evitar repetição de código
    const SidebarContent = () => (
        <>
            <div>
                <div className="flex items-center gap-2 mb-8 px-2">
                    <img src="/favicon.svg" alt="Logo" className="h-8 w-8" />
                    <h1 className="text-xl font-bold text-primary">PetSafe QR</h1>
                </div>
                <nav className="flex flex-col gap-2">
                    {navItems.map(item => (
                        <Link key={item.path} to={item.path} onClick={() => setIsSidebarOpen(false)}> {/* Fecha o menu ao clicar */}
                            <Button
                                variant={location.pathname === item.path || (item.path !== '/tutor/dashboard' && location.pathname.startsWith(item.path)) ? 'secondary' : 'ghost'}
                                className="w-full justify-start"
                            >
                                <item.icon className="mr-2 h-4 w-4" />
                                {item.label}
                            </Button>
                        </Link>
                    ))}
                </nav>
            </div>
            <div>
                 <p className="text-sm text-muted-foreground truncate mb-2 px-4">{user?.email}</p>
                 <Button variant="ghost" className="w-full justify-start" onClick={handleSignOut}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Sair
                </Button>
            </div>
        </>
    );

    return (
        <div className="min-h-screen w-full flex bg-background">
            {/* ================== BARRA LATERAL ATUALIZADA ================== */}
            {/* Versão para Desktop: Fixa e sempre visível */}
            <aside className="w-64 flex-shrink-0 bg-card border-r p-4 flex-col justify-between hidden md:flex">
                <SidebarContent />
            </aside>

            {/* Versão para Mobile: Menu flutuante que abre e fecha */}
            {isSidebarOpen && (
                <div className="fixed inset-0 z-40 flex md:hidden">
                    <aside className="w-64 bg-card border-r p-4 flex flex-col justify-between">
                        <SidebarContent />
                    </aside>
                    <div className="flex-1 bg-black/30" onClick={() => setIsSidebarOpen(false)}></div>
                </div>
            )}
            {/* ================================================================= */}

            <main className="flex-1 flex flex-col overflow-y-auto">
                {/* ================== CABEÇALHO DO CONTEÚDO ================== */}
                {/* Contém o botão de menu para mobile */}
                <header className="flex items-center justify-end md:justify-end p-4 bg-card border-b sticky top-0 z-30">
                    <button 
                        className="p-2 rounded-md text-muted-foreground md:hidden mr-auto" // Esconde em telas de desktop
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                    >
                        <Menu className="h-6 w-6" />
                    </button>
                    {/* Espaço para outros itens do cabeçalho, se necessário */}
                </header>
                {/* ================================================================= */}

                <div className="p-6">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

export default TutorDashboardLayout;
