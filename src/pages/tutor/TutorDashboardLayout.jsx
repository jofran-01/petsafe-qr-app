
import React from 'react';
import { Outlet, useLocation, Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Home, PawPrint, LogOut, Settings, HeartHandshake as Handshake, User, ClipboardList, CreditCard } from 'lucide-react';

const TutorDashboardLayout = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { user, signOut } = useAuth();

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
                     <p className="text-sm text-muted-foreground truncate mb-2">{user?.email}</p>
                     <Button variant="ghost" className="w-full justify-start" onClick={handleSignOut}>
                        <LogOut className="mr-2 h-4 w-4" />
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

export default TutorDashboardLayout;
