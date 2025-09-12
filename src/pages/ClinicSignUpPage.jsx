
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

const ClinicSignUpPage = () => {
    const { toast } = useToast();
    const { signUp } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        nome_clinica: '',
        email: '',
        telefone: '',
        endereco: '',
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
                nome_clinica: formData.nome_clinica,
                telefone: formData.telefone,
                endereco: formData.endereco,
                user_type: 'clinica'
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
            navigate('/login');
        }
    };


    return (
        <>
            <Helmet>
                <title>Cadastro de Clínica - PetSafe QR</title>
                <meta name="description" content="Cadastre sua clínica ou ONG no PetSafe QR e comece a modernizar a gestão dos seus pacientes." />
            </Helmet>
            <AuthLayout
              imageDescription="A cute and fluffy cat looking curiously at the camera"
              imageAlt="Cute cat"
              imageUrl="https://www.whiskas.com.br/cdn-cgi/image/format=auto,q=90/sites/g/files/fnmzdf2156/files/2024-10/gato-siames.jpg"
            >
              <div className="grid gap-2 text-center mb-6">
                  <h1 className="text-3xl font-bold">Crie sua Conta de Clínica</h1>
                  <p className="text-balance text-muted-foreground">
                      Preencha os dados para cadastrar sua clínica ou ONG.
                  </p>
              </div>
              <form onSubmit={handleSubmit} className="grid gap-4">
                  <div className="grid gap-2">
                      <Label htmlFor="nome_clinica">Nome da Clínica</Label>
                      <Input id="nome_clinica" placeholder="Clínica Vet Top" required onChange={handleChange} value={formData.nome_clinica} />
                  </div>
                  <div className="grid gap-2">
                      <Label htmlFor="email">Email</Label>
                      <Input id="email" type="email" placeholder="contato@vettop.com" required onChange={handleChange} value={formData.email} />
                  </div>
                  <div className="grid gap-2">
                      <Label htmlFor="telefone">Telefone</Label>
                      <Input id="telefone" type="tel" placeholder="(11) 99999-9999" required onChange={handleChange} value={formData.telefone} />
                  </div>
                  <div className="grid gap-2">
                      <Label htmlFor="endereco">Endereço</Label>
                      <Input id="endereco" placeholder="Rua dos Pets, 123" required onChange={handleChange} value={formData.endereco} />
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
                  <Link to="/login" className="underline">
                      Faça login
                  </Link>
              </div>
            </AuthLayout>
        </>
    );
};

export default ClinicSignUpPage;
