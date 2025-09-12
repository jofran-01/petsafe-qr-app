
import React from 'react';
import { Outlet, useLocation, Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Home, PawPrint, Calendar, Settings, Stethoscope, FileText, UserPlus, CreditCard } from 'lucide-react';

const ClinicDashboardLayout = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { user, signOut } = useAuth();

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

    return (
        <div className="min-h-screen w-full flex bg-background">
            <aside className="w-64 flex-shrink-0 bg-card border-r p-4 flex flex-col justify-between">
                <div>
                    <div className="flex items-center gap-2 mb-8">
                        <img src="/favicon.svg" alt="Logo" className="h-8 w-8" />
                        <h1 className="text-xl font-bold text-primary">PetSafe QR</h1>
                    </div>
                    <nav className="flex flex-col gap-2">
                        {navItems.map(item => (
                            <Link key={item.path} to={item.path}>
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
                     <p className="text-sm text-muted-foreground truncate mb-2">{user?.email}</p>
                     <Button variant="ghost" className="w-full justify-start" onClick={handleSignOut}>
                        Sair
                    </Button>
                </div>
            </aside>
            <main className="flex-1 p-6 overflow-y-auto">
                <Outlet />
            </main>
        </div>
    );
};

export default ClinicDashboardLayout;
