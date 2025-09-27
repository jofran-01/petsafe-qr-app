import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Trash2 } from 'lucide-react';
import { Helmet } from 'react-helmet';
import { useTheme } from '@/components/theme-provider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useNavigate } from 'react-router-dom';

const TutorSettingsPage = () => {
  const { user, refreshUser } = useAuth();
  const { toast } = useToast();
  const { setTheme } = useTheme();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [formData, setFormData] = useState({
    nome: '',
    telefone: '',
    endereco: '',
    cidade: '',
    estado: '',
    cep: '',
  });

  useEffect(() => {
    const fetchTutorProfile = async () => {
        if(!user) return;
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('usuarios_tutores')
                .select('*')
                .eq('id', user.id)
                .single();
            if (error) throw error;
            if (data) {
                setFormData({
                    nome: data.nome || user.user_metadata.nome || '',
                    telefone: data.telefone || user.user_metadata.telefone || '',
                    endereco: data.endereco || '',
                    cidade: data.cidade || '',
                    estado: data.estado || '',
                    cep: data.cep || '',
                });
            }
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Erro ao buscar perfil",
                description: error.message,
            });
        } finally {
            setLoading(false);
        }
    };
    fetchTutorProfile();
  }, [user, toast]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error: profileError } = await supabase
        .from('usuarios_tutores')
        .update({
          nome: formData.nome,
          telefone: formData.telefone,
          endereco: formData.endereco,
          cidade: formData.cidade,
          estado: formData.estado,
          cep: formData.cep,
        })
        .eq('id', user.id);
      if (profileError) throw profileError;
      
      const { error: authError } = await supabase.auth.updateUser({
        data: {
          nome: formData.nome,
          telefone: formData.telefone,
        }
      });
      if (authError) throw authError;
      
      await refreshUser();

      toast({
        title: "Sucesso!",
        description: "Suas informações foram atualizadas.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro ao atualizar informações",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    toast({
      title: "Função não implementada",
      description: "A exclusão de conta via API não é recomendada por segurança. Esta ação deve ser feita pelo administrador do Supabase.",
      variant: "destructive"
    });
    setDeleting(false);
  };

  return (
    <>
      <Helmet>
        <title>Configurações - PetSafe QR</title>
      </Helmet>
      <Tabs defaultValue="profile">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="profile">Meu Perfil</TabsTrigger>
          <TabsTrigger value="appearance">Aparência</TabsTrigger>
          <TabsTrigger value="account">Conta</TabsTrigger>
        </TabsList>
        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Meu Perfil</CardTitle>
              <CardDescription>
                Atualize suas informações de contato e endereço.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="nome">Nome Completo</Label>
                  <Input id="nome" value={formData.nome} onChange={handleChange} />
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="telefone">Telefone</Label>
                      <Input id="telefone" value={formData.telefone} onChange={handleChange} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cep">CEP</Label>
                      <Input id="cep" value={formData.cep} onChange={handleChange} />
                    </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endereco">Endereço Completo</Label>
                  <Input id="endereco" value={formData.endereco} onChange={handleChange} placeholder="Rua, Número, Complemento"/>
                </div>
                 <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="cidade">Cidade</Label>
                      <Input id="cidade" value={formData.cidade} onChange={handleChange} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="estado">Estado</Label>
                      <Input id="estado" value={formData.estado} onChange={handleChange} />
                    </div>
                </div>
                <Button type="submit" disabled={loading}>
                  {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Salvar Alterações'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="appearance">
          <Card>
            <CardHeader>
              <CardTitle>Aparência</CardTitle>
              <CardDescription>
                Personalize a aparência do sistema.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Tema</Label>
                <p className="text-sm text-muted-foreground">Selecione o tema para o seu portal.</p>
                <div className="flex items-center space-x-2 pt-2">
                    <Button variant="outline" onClick={() => setTheme('light')}>Claro</Button>
                    <Button variant="outline" onClick={() => setTheme('dark')}>Escuro</Button>
                   
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="account">
          <Card>
            <CardHeader>
              <CardTitle>Gerenciar Conta</CardTitle>
              <CardDescription>
                Ações permanentes relacionadas à sua conta.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2 p-4 border border-destructive rounded-lg">
                <Label className="text-destructive">Excluir Conta</Label>
                <p className="text-sm text-muted-foreground">
                  Esta ação é irreversível. Todos os seus dados e de seus pets serão permanentemente removidos.
                </p>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="destructive" className="mt-2">
                      <Trash2 className="mr-2 h-4 w-4" /> Excluir minha conta
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Você tem certeza absoluta?</DialogTitle>
                      <DialogDescription>
                        Isso excluirá permanentemente sua conta e removerá seus dados de nossos servidores.
                      </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                      <DialogTrigger asChild><Button variant="outline">Cancelar</Button></DialogTrigger>
                      <Button variant="destructive" onClick={handleDeleteAccount} disabled={deleting}>
                        {deleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Sim, excluir conta'}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </>
  );
};

export default TutorSettingsPage;