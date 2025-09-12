import React, { useState } from 'react';
import { Outlet, useLocation, Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Home, PawPrint, Calendar, Settings, Stethoscope, FileText, UserPlus, CreditCard, Menu, X, LogOut } from 'lucide-react';

const ClinicDashboardLayout = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { user, signOut } = useAuth();
    
    // ================== LÓGICA PARA O MENU RESPONSIVO ==================
    // 1. Estado para controlar se a barra lateral está aberta ou fechada no mobile.
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    // =================================================================

    const handleSignOut = async () => {
        await signOut();
        navigate('/login');
    };

    const navItems = [
        { path: '/dashboard', icon: Home, label: 'Início' },
        { path: '/dashboard/agenda', icon: Calendar, label: 'Agenda' },
        { path: '/dashboard/solicitacoes', icon: PawPrint, label: 'Agendamentos' },
        { path: '/dashboard/prontuarios', icon: Stethoscope, label: 'Prontuários' },
        { path: '/dashboard/pets', icon: UserPlus, label: 'Pacientes' },
        { path: '/dashboard/carteirinhas', icon: CreditCard, label: 'Carteirinhas' },
        { path: '/dashboard/relatorios', icon: FileText, label: 'Relatórios' },
        { path: '/dashboard/configuracoes', icon: Settings, label: 'Configurações' },
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
                        <Link key={item.path} to={item.path} onClick={() => setIsSidebarOpen(false)}> {/* Fecha o menu ao clicar em um item */}
                            <Button
                                variant={location.pathname === item.path || (item.path !== '/dashboard' && location.pathname.startsWith(item.path)) ? 'secondary' : 'ghost'}
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
            {/* Em telas de desktop (md: e maiores), ela é fixa e visível. */}
            <aside className="w-64 flex-shrink-0 bg-card border-r p-4 flex-col justify-between hidden md:flex">
                <SidebarContent />
            </aside>

            {/* Em telas de celular, ela é um menu flutuante. */}
            {isSidebarOpen && (
                <div className="fixed inset-0 z-40 flex md:hidden">
                    {/* A barra lateral em si */}
                    <aside className="w-64 bg-card border-r p-4 flex flex-col justify-between">
                        <SidebarContent />
                    </aside>
                    {/* Overlay que fecha o menu ao clicar fora */}
                    <div className="flex-1 bg-black/30" onClick={() => setIsSidebarOpen(false)}></div>
                </div>
            )}
            {/* ================================================================= */}

            <main className="flex-1 flex flex-col overflow-y-auto">
                {/* ================== CABEÇALHO DO CONTEÚDO ================== */}
                {/* Este cabeçalho agora contém o botão de menu para mobile. */}
                <header className="flex items-center justify-end md:justify-end p-4 bg-card border-b sticky top-0 z-30">
                    <button 
                        className="p-2 rounded-md text-muted-foreground md:hidden mr-auto" // Esconde o botão em telas de desktop
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                    >
                        <Menu className="h-6 w-6" />
                    </button>
                    {/* Você pode adicionar outros itens aqui, como um avatar do usuário */}
                </header>
                {/* ================================================================= */}

                <div className="p-6">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

export default ClinicDashboardLayout;
