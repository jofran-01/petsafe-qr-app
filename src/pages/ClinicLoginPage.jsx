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

const ClinicLoginPage = () => {
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
    } else if (data.user?.user_metadata?.user_type !== 'clinica') {
        await signOut();
        setLoading(false);
        toast({
          variant: 'destructive',
          title: 'Acesso Negado',
          description: 'Esta página é exclusiva para clínicas. Use o login de tutor.',
        });
    } else {
      setLoading(false);
      toast({
        title: 'Login bem-sucedido!',
        description: 'Bem-vindo(a) de volta ao seu painel.',
      });
      navigate('/dashboard');
    }
  };

  return (
    <>
      <Helmet>
        <title>Login da Clínica - PetSafe QR</title>
        <meta name="description" content="Acesse o painel da sua clínica no PetSafe QR para gerenciar pets, agendamentos e muito mais." />
      </Helmet>
      <AuthLayout
        imageDescription="A cute and fluffy cat looking curiously at the camera"
        imageAlt="Cute cat"
        imageUrl="https://www.whiskas.com.br/cdn-cgi/image/format=auto,q=90/sites/g/files/fnmzdf2156/files/2024-10/gato-siames.jpg"
      >
        <div className="grid gap-2 text-center mb-6">
            <h1 className="text-3xl font-bold">Login da Clínica</h1>
            <p className="text-balance text-muted-foreground">
                Acesse seu painel para gerenciar seus pacientes.
            </p>
        </div>
        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="clinica@email.com" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <div className="flex items-center">
              <Label htmlFor="password">Senha</Label>
              {/* <Link to="/forgot-password"className="ml-auto inline-block text-sm underline">
                Esqueceu sua senha?
              </Link> */}
            </div>
            <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Entrar'}
          </Button>
        </form>
        <div className="mt-4 text-center text-sm">
          Não tem uma conta?{' '}
          <Link to="/cadastro" className="underline">
            Cadastre-se
          </Link>
        </div>
        <div className="mt-2 text-center text-sm">
          É um tutor?{' '}
          <Link to="/tutor/login" className="underline">
            Acesse aqui
          </Link>
        </div>
      </AuthLayout>
    </>
  );
};

export default ClinicLoginPage;