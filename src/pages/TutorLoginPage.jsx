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

const TutorLoginPage = () => {
  const { toast } = useToast();
  const { signIn, signOut } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const { data, error } = await signIn(email, password);
    
    if (error) {
      setLoading(false);
      if (error.message === 'Email not confirmed') {
        toast({
          variant: 'destructive',
          title: 'Email não confirmado',
          description: 'Por favor, verifique sua caixa de entrada e clique no link de confirmação.',
        });
      } else {
        toast({
          variant: 'destructive',
          title: 'Falha no login',
          description: 'Verifique seu e-mail e senha e tente novamente.',
        });
      }
    } else if (data.user?.user_metadata?.user_type !== 'tutor') {
        await signOut();
        setLoading(false);
        toast({
          variant: 'destructive',
          title: 'Acesso Negado',
          description: 'Esta página é exclusiva para tutores. Use o login de clínica.',
        });
    } else {
      setLoading(false);
      toast({
        title: 'Login bem-sucedido!',
        description: 'Bem-vindo(a) de volta ao seu portal.',
      });
      navigate('/tutor/dashboard');
    }
  };

  return (
    <>
      <Helmet>
        <title>Login do Tutor - PetSafe QR</title>
        <meta name="description" content="Acesse o portal do tutor no PetSafe QR para gerenciar seus pets e agendamentos." />
      </Helmet>
       {/* 
         =================================================
         ===> ALTERAÇÃO PRINCIPAL ACONTECE AQUI <===
         =================================================
         - Removidas as props de imagem (imageUrl, imageAlt, imageDescription)
         - Adicionada a prop `showImage={false}`
       */}
       <AuthLayout showImage={false}>
        <div className="grid gap-2 text-center mb-6">
            <h1 className="text-3xl font-bold">Login do Tutor</h1>
            <p className="text-balance text-muted-foreground">
                Acesse seu portal para cuidar do seu pet.
            </p>
        </div>
        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="tutor@email.com" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="grid gap-2">
             <div className="flex items-center">
              <Label htmlFor="password">Senha</Label>
            </div>
            <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Entrar'}
          </Button>
        </form>
        <div className="mt-4 text-center text-sm">
          Não tem uma conta?{' '}
          <Link to="/tutor/cadastro" className="underline">
            Cadastre-se
          </Link>
        </div>
        <div className="mt-2 text-center text-sm">
          É uma clínica?{' '}
          <Link to="/login" className="underline">
            Acesse aqui
          </Link>
        </div>
      </AuthLayout>
    </>
  );
};

export default TutorLoginPage;
