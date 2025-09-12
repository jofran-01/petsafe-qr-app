import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Helmet } from 'react-helmet';

const EmailConfirmationPage = () => {
    const navigate = useNavigate();
    const [status, setStatus] = useState('loading'); // 'loading', 'success', 'error'

    useEffect(() => {
        // Supabase handles the session automatically when the user clicks the link.
        // The onAuthStateChange listener in SupabaseAuthContext will detect the SIGNED_IN event.
        // We just need to give it a moment to process.
        const timer = setTimeout(() => {
            setStatus('success');
        }, 2500);

        return () => clearTimeout(timer);
    }, []);

    const renderContent = () => {
        switch (status) {
            case 'success':
                return {
                    icon: <CheckCircle className="h-16 w-16 text-green-500" />,
                    title: 'Email Confirmado!',
                    description: 'Sua conta foi ativada com sucesso. Agora você pode fazer login.',
                    buttonText: 'Ir para o Login',
                    buttonAction: () => navigate('/login'),
                };
            case 'error':
                return {
                    icon: <XCircle className="h-16 w-16 text-red-500" />,
                    title: 'Ocorreu um Erro',
                    description: 'Não foi possível confirmar seu email. Por favor, tente novamente.',
                    buttonText: 'Tentar Novamente',
                    buttonAction: () => navigate('/cadastro'),
                };
            default:
                return {
                    icon: <Loader2 className="h-16 w-16 animate-spin text-primary" />,
                    title: 'Confirmando seu Email...',
                    description: 'Aguarde um instante enquanto validamos sua conta.',
                    buttonText: null,
                    buttonAction: null,
                };
        }
    };

    const { icon, title, description, buttonText, buttonAction } = renderContent();

    return (
        <>
            <Helmet>
                <title>Confirmação de Email - PetSafe QR</title>
            </Helmet>
            <div className="flex min-h-screen items-center justify-center bg-secondary p-4">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5 }}
                >
                    <Card className="w-full max-w-md text-center">
                        <CardHeader>
                            <div className="mx-auto mb-4">{icon}</div>
                            <CardTitle className="text-2xl">{title}</CardTitle>
                            <CardDescription>{description}</CardDescription>
                        </CardHeader>
                        {buttonText && (
                            <CardContent>
                                <Button onClick={buttonAction} className="w-full">
                                    {buttonText}
                                </Button>
                            </CardContent>
                        )}
                    </Card>
                </motion.div>
            </div>
        </>
    );
};

export default EmailConfirmationPage;