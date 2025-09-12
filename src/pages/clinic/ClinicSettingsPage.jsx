
import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Upload, X } from 'lucide-react';
import { Helmet } from 'react-helmet';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTheme } from '@/components/theme-provider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const ClinicSettingsPage = () => {
    const { user, refreshUser } = useAuth();
    const { toast } = useToast();
    const { setTheme } = useTheme();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [clinicData, setClinicData] = useState({
        tipo_cadastro: 'juridica',
        razao_social: '',
        nome_fantasia: '',
        responsavel: '',
        cnpj: '',
        cpf: '',
        inscricao_estadual: '',
        inscricao_municipal: '',
        telefone: '',
        telefone2: '',
        email: '',
        site: '',
        cep: '',
        estado: '',
        cidade: '',
        cod_ibge: '',
        tipo_endereco: '',
        endereco: '',
        numero: '',
        complemento: '',
        bairro: '',
        logo_url: '',
    });
    const [logoFile, setLogoFile] = useState(null);
    const [logoPreview, setLogoPreview] = useState('');

    const fetchClinicData = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('usuarios_clinicas')
                .select('*')
                .eq('id', user.id)
                .single();

            if (error && error.code !== 'PGRST116') throw error;

            if (data) {
                const updatedData = { ...clinicData, ...data, tipo_cadastro: data.tipo_cadastro || 'juridica' };
                setClinicData(updatedData);
                if (data.logo_url) {
                    setLogoPreview(data.logo_url);
                }
            } else {
                 setClinicData(prev => ({ ...prev, email: user.email }));
            }
        } catch (error) {
            toast({ variant: 'destructive', title: 'Erro ao carregar dados', description: error.message });
        } finally {
            setLoading(false);
        }
    }, [user, toast]);

    useEffect(() => {
        fetchClinicData();
    }, [fetchClinicData]);

    const handleInputChange = (e) => {
        const { id, value } = e.target;
        setClinicData(prev => ({ ...prev, [id]: value }));
    };

    const handleSelectChange = (id, value) => {
        setClinicData(prev => ({ ...prev, [id]: value }));
    };

    const handleLogoChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setLogoFile(file);
            setLogoPreview(URL.createObjectURL(file));
        }
    };
    
    const handleRemoveLogo = () => {
        setLogoFile(null);
        setLogoPreview('');
        setClinicData(prev => ({ ...prev, logo_url: null }));
    };

    const handleSaveChanges = async () => {
        setSaving(true);
        try {
            let logoUrlToSave = clinicData.logo_url;

            if (logoFile) {
                const filePath = `public/${user.id}/${Date.now()}-${logoFile.name}`;
                const { error: uploadError } = await supabase.storage
                    .from('clinic-logos')
                    .upload(filePath, logoFile, { upsert: true });

                if (uploadError) throw uploadError;

                const { data: { publicUrl } } = supabase.storage
                    .from('clinic-logos')
                    .getPublicUrl(filePath);
                logoUrlToSave = publicUrl;
            } else if (logoPreview === '') {
                logoUrlToSave = null;
            }

            const dataToUpdate = { ...clinicData, logo_url: logoUrlToSave };
            delete dataToUpdate.created_at;
            delete dataToUpdate.updated_at;
            delete dataToUpdate.id;
            delete dataToUpdate.email;

            const { error } = await supabase
                .from('usuarios_clinicas')
                .update(dataToUpdate)
                .eq('id', user.id);

            if (error) throw error;
            
            await refreshUser();
            await fetchClinicData();
            toast({ title: 'Sucesso!', description: 'Configurações salvas com sucesso.' });
        } catch (error) {
            toast({ variant: 'destructive', title: 'Erro ao salvar', description: error.message });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <div className="flex justify-center items-center h-full"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>;
    }

    return (
        <>
            <Helmet>
                <title>Configurações - PetSafe QR</title>
            </Helmet>
            <Tabs defaultValue="company">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="company">Empresa</TabsTrigger>
                    <TabsTrigger value="appearance">Aparência</TabsTrigger>
                </TabsList>
                <TabsContent value="company">
                    <Card>
                        <CardHeader>
                            <CardTitle>Configurações da Empresa</CardTitle>
                            <CardDescription>Gerencie as informações da sua empresa.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="p-4 mb-4 bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 rounded-md dark:bg-yellow-900/20 dark:text-yellow-300 dark:border-yellow-600">
                                <p><strong>Dica!</strong> As informações preenchidas abaixo serão usadas em várias áreas do sistema (inclusive impressões), por isso, preencha-as com muita atenção.</p>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                <div className="md:col-span-1 space-y-4">
                                    <Label>Logotipo</Label>
                                    <div className="w-48 h-48 border-2 border-dashed rounded-lg flex items-center justify-center bg-muted relative">
                                        {logoPreview ? (
                                            <img src={logoPreview} alt="Logo Preview" className="w-full h-full object-contain rounded-lg p-2" />
                                        ) : (
                                            <span className="text-muted-foreground text-sm text-center p-2">Sua Marca Aqui</span>
                                        )}
                                    </div>
                                    <div className="flex gap-2">
                                        <Button asChild variant="outline" size="sm">
                                            <label htmlFor="logo-upload" className="cursor-pointer">
                                                <Upload className="mr-2 h-4 w-4" /> Enviar
                                                <input id="logo-upload" type="file" className="hidden" accept="image/*" onChange={handleLogoChange} />
                                            </label>
                                        </Button>
                                        {logoPreview && (
                                          <Button variant="destructive" size="sm" onClick={handleRemoveLogo}>
                                              <X className="mr-2 h-4 w-4" /> Remover
                                          </Button>
                                        )}
                                    </div>
                                </div>
                                <div className="md:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="md:col-span-3">
                                        <Label htmlFor="tipo_cadastro">Tipo de Cadastro</Label>
                                        <Select value={clinicData.tipo_cadastro || 'juridica'} onValueChange={(value) => handleSelectChange('tipo_cadastro', value)}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Selecione o tipo" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="juridica">Pessoa Jurídica</SelectItem>
                                                <SelectItem value="fisica">Pessoa Física</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {clinicData.tipo_cadastro === 'juridica' ? (
                                        <>
                                            <div className="md:col-span-2">
                                                <Label htmlFor="razao_social">Razão Social *</Label>
                                                <Input id="razao_social" value={clinicData.razao_social || ''} onChange={handleInputChange} />
                                            </div>
                                            <div>
                                                <Label htmlFor="nome_fantasia">Nome Fantasia *</Label>
                                                <Input id="nome_fantasia" value={clinicData.nome_fantasia || ''} onChange={handleInputChange} />
                                            </div>
                                            <div>
                                                <Label htmlFor="responsavel">Responsável *</Label>
                                                <Input id="responsavel" value={clinicData.responsavel || ''} onChange={handleInputChange} />
                                            </div>
                                            <div>
                                                <Label htmlFor="cnpj">CNPJ *</Label>
                                                <Input id="cnpj" value={clinicData.cnpj || ''} onChange={handleInputChange} />
                                            </div>
                                            <div>
                                                <Label htmlFor="inscricao_estadual">Inscrição Estadual</Label>
                                                <Input id="inscricao_estadual" value={clinicData.inscricao_estadual || ''} onChange={handleInputChange} />
                                            </div>
                                            <div>
                                                <Label htmlFor="inscricao_municipal">Inscrição Municipal</Label>
                                                <Input id="inscricao_municipal" value={clinicData.inscricao_municipal || ''} onChange={handleInputChange} />
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <div className="md:col-span-2">
                                                <Label htmlFor="nome_clinica">Nome *</Label>
                                                <Input id="nome_clinica" value={clinicData.nome_clinica || ''} onChange={handleInputChange} />
                                            </div>
                                            <div>
                                                <Label htmlFor="cpf">CPF *</Label>
                                                <Input id="cpf" value={clinicData.cpf || ''} onChange={handleInputChange} />
                                            </div>
                                        </>
                                    )}

                                    <div className="md:col-span-3 border-t pt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div>
                                            <Label htmlFor="telefone">Telefone 1 *</Label>
                                            <Input id="telefone" value={clinicData.telefone || ''} onChange={handleInputChange} />
                                        </div>
                                        <div>
                                            <Label htmlFor="telefone2">Telefone 2</Label>
                                            <Input id="telefone2" value={clinicData.telefone2 || ''} onChange={handleInputChange} />
                                        </div>
                                        <div className="md:col-span-1">
                                            <Label htmlFor="email">E-mail *</Label>
                                            <Input id="email" type="email" value={clinicData.email || ''} onChange={handleInputChange} disabled />
                                        </div>
                                        <div className="md:col-span-2">
                                            <Label htmlFor="site">Site</Label>
                                            <Input id="site" value={clinicData.site || ''} onChange={handleInputChange} />
                                        </div>
                                    </div>

                                    <div className="md:col-span-3 border-t pt-4 grid grid-cols-1 md:grid-cols-4 gap-4">
                                        <div>
                                            <Label htmlFor="cep">CEP</Label>
                                            <Input id="cep" value={clinicData.cep || ''} onChange={handleInputChange} />
                                        </div>
                                        <div>
                                            <Label htmlFor="estado">Estado</Label>
                                            <Input id="estado" value={clinicData.estado || ''} onChange={handleInputChange} />
                                        </div>
                                        <div>
                                            <Label htmlFor="cidade">Cidade</Label>
                                            <Input id="cidade" value={clinicData.cidade || ''} onChange={handleInputChange} />
                                        </div>
                                        <div>
                                            <Label htmlFor="cod_ibge">Cód IBGE</Label>
                                            <Input id="cod_ibge" value={clinicData.cod_ibge || ''} onChange={handleInputChange} />
                                        </div>
                                        <div className="md:col-span-2">
                                            <Label htmlFor="endereco">Endereço</Label>
                                            <Input id="endereco" value={clinicData.endereco || ''} onChange={handleInputChange} />
                                        </div>
                                        <div>
                                            <Label htmlFor="numero">Nº</Label>
                                            <Input id="numero" value={clinicData.numero || ''} onChange={handleInputChange} />
                                        </div>
                                        <div>
                                            <Label htmlFor="bairro">Bairro</Label>
                                            <Input id="bairro" value={clinicData.bairro || ''} onChange={handleInputChange} />
                                        </div>
                                        <div className="md:col-span-2">
                                            <Label htmlFor="complemento">Complemento</Label>
                                            <Input id="complemento" value={clinicData.complemento || ''} onChange={handleInputChange} />
                                        </div>
                                    </div>
                                    <div className="md:col-span-3 flex justify-end">
                                        <Button onClick={handleSaveChanges} disabled={saving}>
                                            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Gravar'}
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="appearance">
                    <Card>
                        <CardHeader>
                            <CardTitle>Aparência</CardTitle>
                            <CardDescription>Personalize a aparência do sistema.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-2">
                                <Label>Tema</Label>
                                <p className="text-sm text-muted-foreground">Selecione o tema para o seu painel.</p>
                                <div className="flex items-center space-x-2 pt-2">
                                    <Button variant="outline" onClick={() => setTheme('light')}>Claro</Button>
                                    <Button variant="outline" onClick={() => setTheme('dark')}>Escuro</Button>
                                    <Button variant="outline" onClick={() => setTheme('system')}>Padrão do Sistema</Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </>
    );
};

export default ClinicSettingsPage;
