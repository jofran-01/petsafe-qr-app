import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/customSupabaseClient';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowLeft, HeartPulse, Stethoscope, Syringe, Pill, Download, Bug } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Helmet } from 'react-helmet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import jsPDF from 'jspdf';
import { useAuth } from '@/contexts/SupabaseAuthContext';

// ================== COMPONENTE AddRecordForm COM A CORREÇÃO ==================
const AddRecordForm = ({ petId, onRecordAdded, recordType }) => {
    const { user } = useAuth();
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({});

    // CORREÇÃO 1: Reseta o formulário quando o tipo de registro (aba) muda
    useEffect(() => {
        setFormData({});
    }, [recordType]);

    const fields = {
        consultations: [
            { id: 'diagnostico', label: 'Diagnóstico', type: 'textarea' },
            { id: 'tratamento', label: 'Tratamento', type: 'textarea' },
            { id: 'medicamentos_prescritos', label: 'Medicamentos Prescritos', type: 'textarea' },
            { id: 'exames_realizados', label: 'Exames Realizados', type: 'textarea' },
            { id: 'proxima_consulta_data', label: 'Próxima Consulta', type: 'date' },
        ],
        vaccines: [
            { id: 'nome_vacina', label: 'Nome da Vacina', required: true },
            { id: 'data_aplicacao', label: 'Data de Aplicação', type: 'date', required: true },
            { id: 'data_vencimento', label: 'Próxima Dose / Vencimento', type: 'date' },
            { id: 'lote', label: 'Lote' },
        ],
        deworming: [
            { id: 'produto', label: 'Produto Utilizado', required: true },
            { id: 'data_aplicacao', label: 'Data de Aplicação', type: 'date', required: true },
            { id: 'proxima_dose', label: 'Próxima Dose', type: 'date' },
        ],
        antiparasitics: [
            { id: 'produto', label: 'Produto Utilizado', required: true },
            { id: 'data_aplicacao', label: 'Data de Aplicação', type: 'date', required: true },
            { id: 'proxima_dose', label: 'Próxima Dose', type: 'date' },
        ],
    };

    const tableName = {
        consultations: 'consultas',
        vaccines: 'vacinas',
        deworming: 'vermifugacao',
        antiparasitics: 'antiparasitarios',
    };
    
    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.id]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        const table = tableName[recordType];
        if(!table) {
            setLoading(false);
            return;
        }

        try {
            // CORREÇÃO 2: Monta o payload de dados condicionalmente
            let payload = {
                animal_id: petId,
                ...formData,
            };

            // Adiciona campos específicos apenas para consultas
            if (recordType === 'consultations') {
                payload.clinica_id = user.id;
                payload.data_consulta = new Date().toISOString();
            }
            
            const { error } = await supabase.from(table).insert(payload);

            if (error) throw error;
            toast({ title: 'Sucesso!', description: 'Registro adicionado ao prontuário.' });
            onRecordAdded();
            setFormData({});
        } catch (error) {
            toast({ variant: 'destructive', title: 'Erro ao salvar registro', description: error.message });
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {fields[recordType]?.map(field => (
                <div key={field.id} className="grid gap-2">
                    <Label htmlFor={field.id}>{field.label} {field.required && '*'}</Label>
                    {field.type === 'textarea' ? (
                        <Textarea id={field.id} value={formData[field.id] || ''} onChange={handleChange} />
                    ) : (
                        <Input id={field.id} type={field.type || 'text'} value={formData[field.id] || ''} onChange={handleChange} required={field.required} />
                    )}
                </div>
            ))}
            <Button type="submit" disabled={loading} className="w-full">
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Salvar Registro'}
            </Button>
        </form>
    );
};

// ================== COMPONENTE RecordList (SEU CÓDIGO ORIGINAL) ==================
const RecordList = ({ records, title, fields, renderBadge }) => (
    <div className="space-y-4">
         {records.length > 0 ? records.map(record => (
            <Card key={record.id} className="bg-card/50">
                <CardHeader className="pb-4">
                    <CardTitle className="text-base flex justify-between items-center">
                        <span>{fields.title(record)}</span>
                        {renderBadge && renderBadge(record)}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {fields.details.map(detail => (
                        <p key={detail.label} className="text-sm text-muted-foreground">
                            <strong>{detail.label}:</strong> {detail.value(record) || 'N/A'}
                        </p>
                    ))}
                </CardContent>
            </Card>
        )) : <p className="text-center text-muted-foreground py-8">Nenhum registro encontrado.</p>}
    </div>
);

// ================== COMPONENTE PetMedicalRecordPage (SEU CÓDIGO ORIGINAL) ==================
const PetMedicalRecordPage = () => {
    const { id } = useParams();
    const { toast } = useToast();
    const navigate = useNavigate();
    const [pet, setPet] = useState(null);
    const [records, setRecords] = useState({ consultations: [], vaccines: [], deworming: [], antiparasitics: [] });
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('consultations');
    const reportRef = useRef(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase.from('animais').select(`*, usuarios_tutores(nome, email)`).eq('id', id).single();
            if (error) throw error;
            setPet(data);

            const [consultationsRes, vaccinesRes, dewormingRes, antiparasiticsRes] = await Promise.all([
                supabase.from('consultas').select('*, usuarios_clinicas(nome_clinica)').eq('animal_id', id).order('data_consulta', { ascending: false }),
                supabase.from('vacinas').select('*').eq('animal_id', id).order('data_aplicacao', { ascending: false }),
                supabase.from('vermifugacao').select('*').eq('animal_id', id).order('data_aplicacao', { ascending: false }),
                supabase.from('antiparasitarios').select('*').eq('animal_id', id).order('data_aplicacao', { ascending: false }),
            ]);

            setRecords({
                consultations: consultationsRes.data || [],
                vaccines: vaccinesRes.data || [],
                deworming: dewormingRes.data || [],
                antiparasitics: antiparasiticsRes.data || [],
            });

        } catch (error) {
            toast({ variant: 'destructive', title: 'Erro ao buscar prontuário', description: error.message });
        } finally {
            setLoading(false);
        }
    }, [id, toast]);

    useEffect(() => { fetchData(); }, [fetchData]);
    
    const handleExportPDF = () => {
        if (!pet) return;
        const doc = new jsPDF();
        // Lógica de geração de PDF precisa ser implementada aqui
        doc.text(`Prontuário de ${pet.nome}`, 10, 10);
        doc.save(`prontuario_completo_${pet.nome}.pdf`);
        toast({ title: "PDF Gerado", description: "O prontuário completo foi exportado." });
    };

    if (loading) return <div className="flex justify-center items-center h-full"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>;
    if (!pet) return <div className="text-center"><h1 className="text-2xl font-bold">Pet não encontrado</h1><Button onClick={() => navigate('/dashboard/prontuarios')} className="mt-4">Voltar</Button></div>;
    
    return (
        <div ref={reportRef}>
        <Helmet><title>{`Prontuário de ${pet.nome} - PetSafe QR`}</title></Helmet>
        <div className="flex items-center justify-between mb-4">
            <Button variant="outline" onClick={() => navigate('/dashboard/prontuarios')}><ArrowLeft className="mr-2 h-4 w-4"/> Voltar</Button>
            <Button onClick={handleExportPDF}><Download className="mr-2 h-4 w-4" /> Exportar PDF</Button>
        </div>
        
        <Card className="mb-6">
            <CardHeader className="flex flex-col md:flex-row items-start md:items-center gap-4">
                <img 
                  src={pet.foto_url || 'https://ylyahsovfcolgdwisbll.supabase.co/storage/v1/object/public/pet-avatars/default-pet-avatar.png'} 
                  alt={`Foto de ${pet.nome}`} 
                  className="w-24 h-24 rounded-full object-cover border-4 border-primary" 
                />
                <div className="flex-1">
                    <CardTitle className="text-3xl font-bold text-primary">{pet.nome}</CardTitle>
                    <CardDescription>{pet.especie} - {pet.raca}</CardDescription>
                    <CardDescription>Tutor: {pet.usuarios_tutores?.nome || 'Não informado'}</CardDescription>
                </div>
            </CardHeader>
        </Card>

        <div className="grid md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="grid w-full grid-cols-4">
                        <TabsTrigger value="consultations"><Stethoscope className="mr-1 h-4 w-4"/>Consultas</TabsTrigger>
                        <TabsTrigger value="vaccines"><Syringe className="mr-1 h-4 w-4"/>Vacinas</TabsTrigger>
                        <TabsTrigger value="deworming"><Pill className="mr-1 h-4 w-4"/>Vermífugos</TabsTrigger>
                        <TabsTrigger value="antiparasitics"><Bug className="mr-1 h-4 w-4"/>Antiparasit.</TabsTrigger>
                    </TabsList>
                    <TabsContent value="consultations" className="mt-4">
                        <RecordList 
                            records={records.consultations}
                            title="Consultas"
                            fields={{
                                title: (r ) => `Consulta de ${new Date(r.data_consulta).toLocaleDateString()}`,
                                details: [
                                    { label: 'Diagnóstico', value: (r) => r.diagnostico },
                                    { label: 'Tratamento', value: (r) => r.tratamento },
                                ]
                            }}
                            renderBadge={(r) => <Badge variant="outline">{r.usuarios_clinicas?.nome_clinica}</Badge>}
                        />
                    </TabsContent>
                     <TabsContent value="vaccines" className="mt-4">
                        <RecordList records={records.vaccines} title="Vacinas" fields={{
                             title: (r) => r.nome_vacina,
                             details: [
                                { label: 'Aplicação', value: (r) => new Date(r.data_aplicacao).toLocaleDateString() },
                                { label: 'Vencimento', value: (r) => r.data_vencimento ? new Date(r.data_vencimento).toLocaleDateString() : 'N/A' },
                                { label: 'Lote', value: (r) => r.lote },
                             ]
                        }} />
                    </TabsContent>
                    <TabsContent value="deworming" className="mt-4">
                        <RecordList records={records.deworming} title="Vermífugos" fields={{
                             title: (r) => r.produto,
                             details: [
                                { label: 'Aplicação', value: (r) => new Date(r.data_aplicacao).toLocaleDateString() },
                                { label: 'Próxima Dose', value: (r) => r.proxima_dose ? new Date(r.proxima_dose).toLocaleDateString() : 'N/A' },
                             ]
                        }} />
                    </TabsContent>
                     <TabsContent value="antiparasitics" className="mt-4">
                        <RecordList records={records.antiparasitics} title="Antiparasitários" fields={{
                             title: (r) => r.produto,
                             details: [
                                { label: 'Aplicação', value: (r) => new Date(r.data_aplicacao).toLocaleDateString() },
                                { label: 'Próxima Dose', value: (r) => r.proxima_dose ? new Date(r.proxima_dose).toLocaleDateString() : 'N/A' },
                             ]
                        }} />
                    </TabsContent>
                </Tabs>
            </div>
            <div className="md:col-span-1 space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Adicionar Registro</CardTitle>
                    </CardHeader>
                    <CardContent>
                         <AddRecordForm petId={id} onRecordAdded={fetchData} recordType={activeTab} />
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader><CardTitle className="text-lg flex items-center"><HeartPulse className="mr-2 h-5 w-5"/>Informações de Saúde</CardTitle></CardHeader>
                    <CardContent className="space-y-2 text-sm">
                        <p><strong>Doenças Crônicas:</strong> {pet.doencas_cronicas || "N/A"}</p>
                        <p><strong>Alergias:</strong> {pet.alergias || "N/A"}</p>
                    </CardContent>
                </Card>
            </div>
        </div>
        </div>
    );
};

export default PetMedicalRecordPage;
