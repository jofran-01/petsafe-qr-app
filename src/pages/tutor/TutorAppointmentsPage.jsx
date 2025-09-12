import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { PlusCircle, Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Helmet } from 'react-helmet';
import { Badge } from '@/components/ui/badge';

const TutorAppointmentsPage = () => {
    const { user } = useAuth();
    const { toast } = useToast();
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    
    const [loadingRequest, setLoadingRequest] = useState(false);
    const [formData, setFormData] = useState({
        data_agendamento: '',
        horario: '',
        tipo_consulta: '',
        observacoes: '',
    });
    
    const [clinicEmail, setClinicEmail] = useState('');
    const [petName, setPetName] = useState('');
    const [petNameError, setPetNameError] = useState('');
    const [userPets, setUserPets] = useState([]);

    const fetchAppointments = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('agendamentos')
                .select(`
                    id,
                    data_agendamento,
                    horario,
                    status,
                    animais ( nome ),
                    usuarios_clinicas!agendamentos_clinica_id_fkey ( nome_clinica )
                `)
                .eq('tutor_id', user.id)
                .order('data_agendamento', { ascending: false });

            if (error) throw error;
            setAppointments(data);
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Erro ao buscar agendamentos",
                description: error.message,
            });
        } finally {
            setLoading(false);
        }
    }, [user, toast]);

    const fetchUserPets = useCallback(async () => {
        if (!user) return;
        const { data, error } = await supabase
            .from('animais')
            .select('id, nome')
            .eq('tutor_id', user.id);
        
        if (error) {
            console.error("Erro ao buscar pets do usuário:", error);
        } else {
            setUserPets(data);
        }
    }, [user]);

    useEffect(() => {
        fetchAppointments();
        fetchUserPets();
    }, [fetchAppointments, fetchUserPets]);

    const handleInputChange = (e) => {
        const { id, value } = e.target;
        setFormData(prev => ({ ...prev, [id]: value }));
    };
    
    const handlePetNameChange = (e) => {
        const name = e.target.value;
        setPetName(name);
        if (name && !userPets.find(p => p.nome.toLowerCase() === name.toLowerCase())) {
            setPetNameError('Esse pet não existe.');
        } else {
            setPetNameError('');
        }
    };

    const getStatusVariant = (status) => {
        switch (status) {
            case 'Confirmado': return 'default';
            case 'Pendente': return 'secondary';
            case 'Cancelado': return 'destructive';
            case 'Finalizado': return 'outline';
            default: return 'secondary';
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (petNameError) {
            toast({ variant: "destructive", title: "Verifique o nome do pet."});
            return;
        }

        setLoadingRequest(true);

        try {
            // 1. Find clinic by email
            const { data: clinicData, error: clinicError } = await supabase
                .from('usuarios_clinicas')
                .select('id')
                .eq('email', clinicEmail)
                .single();

            if (clinicError || !clinicData) {
                throw new Error("Clínica não encontrada com este e-mail.");
            }
            
            // 2. Find pet by name (already validated, but we need the ID)
            const selectedPet = userPets.find(p => p.nome.toLowerCase() === petName.toLowerCase());
            if (!selectedPet) {
                 throw new Error("Pet não encontrado. Verifique o nome digitado.");
            }

            // 3. Create appointment
            const { error: appointmentError } = await supabase
                .from('agendamentos')
                .insert({
                    tutor_id: user.id,
                    clinica_id: clinicData.id,
                    animal_id: selectedPet.id,
                    status: 'Pendente',
                    ...formData,
                });

            if (appointmentError) throw appointmentError;

            toast({ title: "Sucesso!", description: "Sua solicitação de agendamento foi enviada." });
            setIsDialogOpen(false);
            fetchAppointments();
            // Reset form
            setFormData({ data_agendamento: '', horario: '', tipo_consulta: '', observacoes: '' });
            setClinicEmail('');
            setPetName('');
            setPetNameError('');

        } catch (error) {
            toast({
                variant: "destructive",
                title: "Erro ao solicitar agendamento",
                description: error.message,
            });
        } finally {
            setLoadingRequest(false);
        }
    };

    return (
        <>
            <Helmet>
                <title>Meus Agendamentos - PetSafe QR</title>
            </Helmet>
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold">Meus Agendamentos</h1>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Solicitar Agendamento
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[480px]">
                        <DialogHeader>
                            <DialogTitle>Solicitar Novo Agendamento</DialogTitle>
                            <DialogDescription>
                                Preencha os dados abaixo para enviar uma solicitação de agendamento para a clínica.
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid gap-2">
                                <Label htmlFor="clinic-email">E-mail da Clínica</Label>
                                <Input
                                    id="clinic-email"
                                    type="email"
                                    placeholder="email@clinica.com"
                                    value={clinicEmail}
                                    onChange={(e) => setClinicEmail(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="pet-name">Nome do Pet</Label>
                                <Input
                                    id="pet-name"
                                    type="text"
                                    placeholder="Bolinha"
                                    value={petName}
                                    onChange={handlePetNameChange}
                                    required
                                />
                                {petNameError && <p className="text-xs text-red-500">{petNameError}</p>}
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="data_agendamento">Data Preferida</Label>
                                    <Input id="data_agendamento" type="date" value={formData.data_agendamento} onChange={handleInputChange} required />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="horario">Horário Preferido</Label>
                                    <Input id="horario" type="time" value={formData.horario} onChange={handleInputChange} required />
                                </div>
                            </div>
                            
                            <div className="grid gap-2">
                                <Label htmlFor="tipo_consulta">Tipo de Atendimento</Label>
                                <Input id="tipo_consulta" placeholder="Ex: Consulta de rotina, Vacinação..." value={formData.tipo_consulta} onChange={handleInputChange} required />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="observacoes">Observações (opcional)</Label>
                                <Textarea id="observacoes" placeholder="Alguma informação adicional para a clínica?" value={formData.observacoes} onChange={handleInputChange} />
                            </div>

                            <Button type="submit" disabled={loadingRequest || !!petNameError} className="w-full">
                                {loadingRequest ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Enviar Solicitação'}
                            </Button>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>Histórico de Agendamentos</CardTitle>
                    <CardDescription>
                        Visualize suas solicitações e agendamentos confirmados.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex justify-center items-center h-40">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Clínica</TableHead>
                                    <TableHead>Pet</TableHead>
                                    <TableHead>Data</TableHead>
                                    <TableHead>Horário</TableHead>
                                    <TableHead className="text-right">Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {appointments.length > 0 ? (
                                    appointments.map((apt) => (
                                        <TableRow key={apt.id}>
                                            <TableCell className="font-medium">{apt.usuarios_clinicas?.nome_clinica || 'N/A'}</TableCell>
                                            <TableCell>{apt.animais?.nome || 'N/A'}</TableCell>
                                            <TableCell>{new Date(apt.data_agendamento + 'T00:00:00').toLocaleDateString('pt-BR')}</TableCell>
                                            <TableCell>{apt.horario}</TableCell>
                                            <TableCell className="text-right">
                                                <Badge variant={getStatusVariant(apt.status)}>{apt.status}</Badge>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-24 text-center">
                                            Nenhum agendamento encontrado.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </>
    );
};

export default TutorAppointmentsPage;