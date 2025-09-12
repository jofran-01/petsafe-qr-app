import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/customSupabaseClient';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowLeft, FileText, PlusCircle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Helmet } from 'react-helmet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Badge } from '@/components/ui/badge';

const AddHealthRecordForm = ({ petId, onRecordAdded }) => {
    const { user } = useAuth();
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        data_consulta: new Date().toISOString().slice(0, 10),
        peso: '', temperatura: '', frequencia_cardiaca: '', frequencia_respiratoria: '',
        exame_fisico: '', exames_laboratoriais: '', exames_imagem: '',
        diagnostico_principal: '', tratamento_prescrito: '', observacoes: '',
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.id]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const { error } = await supabase.from('prontuarios').insert({
                ...formData,
                animal_id: petId,
                clinica_id: user.id,
                peso: formData.peso || null,
                temperatura: formData.temperatura || null,
                frequencia_cardiaca: formData.frequencia_cardiaca || null,
                frequencia_respiratoria: formData.frequencia_respiratoria || null,
            });
            if (error) throw error;
            toast({ title: 'Sucesso!', description: 'Novo registro de prontuário adicionado.' });
            onRecordAdded();
        } catch (error) {
            toast({ variant: 'destructive', title: 'Erro ao adicionar registro', description: error.message });
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-4">
                 <div className="space-y-2">
                    <Label htmlFor="data_consulta">Data da Consulta</Label>
                    <Input id="data_consulta" type="date" value={formData.data_consulta} onChange={handleChange} required />
                </div>
            </div>
             <Card>
                <CardHeader><CardTitle className="text-lg">Exame Clínico</CardTitle></CardHeader>
                <CardContent className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                     <div className="space-y-2">
                        <Label htmlFor="peso">Peso (kg)</Label>
                        <Input id="peso" type="number" step="0.1" value={formData.peso} onChange={handleChange} />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="temperatura">Temperatura (°C)</Label>
                        <Input id="temperatura" type="number" step="0.1" value={formData.temperatura} onChange={handleChange} />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="frequencia_cardiaca">FC (bpm)</Label>
                        <Input id="frequencia_cardiaca" type="number" value={formData.frequencia_cardiaca} onChange={handleChange} />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="frequencia_respiratoria">FR (rpm)</Label>
                        <Input id="frequencia_respiratoria" type="number" value={formData.frequencia_respiratoria} onChange={handleChange} />
                    </div>
                     <div className="md:col-span-2 lg:col-span-4 space-y-2">
                        <Label htmlFor="exame_fisico">Exame Físico (Ouvidos, olhos, boca, pele, etc.)</Label>
                        <Textarea id="exame_fisico" value={formData.exame_fisico} onChange={handleChange} />
                    </div>
                </CardContent>
            </Card>
             <div className="space-y-2">
                <Label htmlFor="exames_laboratoriais">Exames Laboratoriais (Hemograma, urina, fezes)</Label>
                <Textarea id="exames_laboratoriais" value={formData.exames_laboratoriais} onChange={handleChange} />
            </div>
             <div className="space-y-2">
                <Label htmlFor="exames_imagem">Exames de Imagem (Ultrassom, Raio-X)</Label>
                <Textarea id="exames_imagem" value={formData.exames_imagem} onChange={handleChange} />
            </div>
             <div className="space-y-2">
                <Label htmlFor="diagnostico_principal">Diagnóstico Principal</Label>
                <Textarea id="diagnostico_principal" value={formData.diagnostico_principal} onChange={handleChange} />
            </div>
             <div className="space-y-2">
                <Label htmlFor="tratamento_prescrito">Tratamento Prescrito</Label>
                <Textarea id="tratamento_prescrito" value={formData.tratamento_prescrito} onChange={handleChange} />
            </div>
             <div className="space-y-2">
                <Label htmlFor="observacoes">Observações Gerais</Label>
                <Textarea id="observacoes" value={formData.observacoes} onChange={handleChange} />
            </div>
             <Button type="submit" disabled={loading} className="w-full">
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Salvar Registro'}
            </Button>
        </form>
    );
};

const HealthHistory = ({ petId }) => {
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();

    const fetchRecords = useCallback(async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('prontuarios')
                .select('*')
                .eq('animal_id', petId)
                .order('data_consulta', { ascending: false });
            if (error) throw error;
            setRecords(data);
        } catch(e) {
            toast({ variant: 'destructive', title: 'Erro', description: 'Não foi possível carregar o histórico.'});
        } finally {
            setLoading(false);
        }
    }, [petId, toast]);

    useEffect(() => {
        fetchRecords();
    }, [fetchRecords]);
    
    if (loading) return <div className="flex justify-center items-center h-40"><Loader2 className="h-8 w-8 animate-spin" /></div>;

    return (
        <div className="space-y-4">
            {records.length > 0 ? records.map(record => (
                <Card key={record.id}>
                    <CardHeader>
                        <CardTitle className="text-lg flex justify-between items-center">
                            <span>Consulta de {new Date(record.data_consulta + 'T00:00:00').toLocaleDateString()}</span>
                            <Badge>Ver Detalhes</Badge>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm font-medium">Diagnóstico Principal:</p>
                        <p className="text-sm text-muted-foreground">{record.diagnostico_principal || 'Não informado'}</p>
                    </CardContent>
                </Card>
            )) : <p className="text-center text-muted-foreground py-8">Nenhum prontuário encontrado.</p>}
        </div>
    );
};


const PetDetailsPage = () => {
    const { id } = useParams();
    const { toast } = useToast();
    const navigate = useNavigate();
    const [pet, setPet] = useState(null);
    const [loading, setLoading] = useState(true);
    const [key, setKey] = useState(0);

    const fetchPetDetails = useCallback(async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('animais')
                .select(`*, usuarios_tutores ( nome, email, telefone )`)
                .eq('id', id)
                .single();
            if (error) throw error;
            setPet(data);
        } catch (error) {
            toast({
                variant: 'destructive',
                title: 'Erro ao buscar detalhes do pet',
                description: error.message,
            });
        } finally {
            setLoading(false);
        }
    }, [id, toast]);

    useEffect(() => {
        fetchPetDetails();
    }, [fetchPetDetails, key]);

    if (loading) {
        return <div className="flex justify-center items-center h-full"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>;
    }

    if (!pet) {
        return (
            <div className="text-center">
                <h1 className="text-2xl font-bold">Paciente não encontrado</h1>
                <Button onClick={() => navigate('/dashboard/pets')} className="mt-4">Voltar para a lista</Button>
            </div>
        );
    }
    
    return (
        <>
        <Helmet><title>{`Detalhes de ${pet.nome} - PetSafe QR`}</title></Helmet>
        <div className="flex items-center justify-between mb-4">
            <Button variant="outline" onClick={() => navigate('/dashboard/pets')}><ArrowLeft className="mr-2 h-4 w-4"/> Voltar</Button>
            <Button onClick={() => navigate(`/dashboard/pets/${id}/carteirinha`)}><FileText className="mr-2 h-4 w-4" /> Ver Carteirinha</Button>
        </div>
        
        <Card className="mb-6">
            <CardHeader className="flex flex-row items-center gap-4">
                <img  className="w-24 h-24 rounded-full object-cover border-4 border-primary" alt={`Foto de ${pet.nome}`} src="https://images.unsplash.com/photo-1586208437993-8e298d2f8d50" />
                <div>
                    <CardTitle className="text-3xl font-bold text-primary">{pet.nome}</CardTitle>
                    <CardDescription>{pet.especie} - {pet.raca}</CardDescription>
                </div>
            </CardHeader>
            <CardContent>
                 <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                    <div><span className="font-semibold">Idade:</span> {pet.idade || 'N/A'} anos</div>
                    <div><span className="font-semibold">Peso:</span> {pet.peso || 'N/A'} kg</div>
                    <div><span className="font-semibold">Sexo:</span> {pet.sexo || 'N/A'}</div>
                    <div><span className="font-semibold">Tutor:</span> {pet.usuarios_tutores.nome}</div>
                    <div className="md:col-span-2"><span className="font-semibold">Contato:</span> {pet.usuarios_tutores.email} / {pet.usuarios_tutores.telefone}</div>
                </div>
            </CardContent>
        </Card>

        <Tabs defaultValue="history">
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="history">Histórico do Prontuário</TabsTrigger>
                <TabsTrigger value="add_record"><PlusCircle className="mr-2 h-4 w-4"/>Novo Registro</TabsTrigger>
            </TabsList>
            <TabsContent value="history" className="mt-4">
                <HealthHistory petId={pet.id} key={key} />
            </TabsContent>
            <TabsContent value="add_record" className="mt-4">
                 <Card>
                    <CardHeader>
                        <CardTitle>Adicionar ao Prontuário</CardTitle>
                        <CardDescription>Registre uma nova consulta ou exame para {pet.nome}.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <AddHealthRecordForm petId={pet.id} onRecordAdded={() => setKey(k => k + 1)} />
                    </CardContent>
                </Card>
            </TabsContent>
        </Tabs>
        </>
    );
};

export default PetDetailsPage;