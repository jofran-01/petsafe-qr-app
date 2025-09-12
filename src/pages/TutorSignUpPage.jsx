
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Helmet } from 'react-helmet';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import AuthLayout from './AuthLayout';

const TutorSignUpPage = () => {
    const { toast } = useToast();
    const { signUp } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        nome: '',
        email: '',
        telefone: '',
        password: '',
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.id]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        const { error } = await signUp(formData.email, formData.password, {
            data: {
                nome: formData.nome,
                telefone: formData.telefone,
                user_type: 'tutor'
            },
            options: {
              emailRedirectTo: `${window.location.origin}/confirm-email`
            }
        });

        setLoading(false);
        if (error) {
          toast({
            variant: "destructive",
            title: "Falha no cadastro",
            description: error.message,
          })
        } else {
            toast({
                title: "Cadastro quase concluído!",
                description: "Enviamos um e-mail de confirmação para você. Por favor, verifique sua caixa de entrada.",
            });
            navigate('/tutor/login');
        }
    };


    return (
        <>
            <Helmet>
                <title>Cadastro de Tutor - PetSafe QR</title>
                <meta name="description" content="Cadastre-se como tutor no PetSafe QR para gerenciar a saúde e os agendamentos dos seus pets." />
            </Helmet>
            <AuthLayout
              showImage={false}
            >
              <div className="grid gap-2 text-center mb-6">
                  <h1 className="text-3xl font-bold">Crie sua Conta de Tutor</h1>
                  <p className="text-balance text-muted-foreground">
                      Preencha seus dados para começar a usar o portal.
                  </p>
              </div>
              <form onSubmit={handleSubmit} className="grid gap-4">
                  <div className="grid gap-2">
                      <Label htmlFor="nome">Nome Completo</Label>
                      <Input id="nome" placeholder="Seu Nome" required onChange={handleChange} value={formData.nome} />
                  </div>
                  <div className="grid gap-2">
                      <Label htmlFor="email">Email</Label>
                      <Input id="email" type="email" placeholder="seu@email.com" required onChange={handleChange} value={formData.email} />
                  </div>
                  <div className="grid gap-2">
                      <Label htmlFor="telefone">Telefone</Label>
                      <Input id="telefone" type="tel" placeholder="(11) 99999-9999" required onChange={handleChange} value={formData.telefone} />
                  </div>
                  <div className="grid gap-2">
                      <Label htmlFor="password">Senha</Label>
                      <Input id="password" type="password" required onChange={handleChange} value={formData.password} />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                      {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Criar Conta'}
                  </Button>
              </form>
              <div className="mt-4 text-center text-sm">
                  Já tem uma conta?{' '}
                  <Link to="/tutor/login" className="underline">
                      Faça login
                  </Link>
              </div>
            </AuthLayout>
        </>
    );
};

export default TutorSignUpPage;
