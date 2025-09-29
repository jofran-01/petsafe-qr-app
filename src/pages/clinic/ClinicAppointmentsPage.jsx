import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Check, X, CalendarClock } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Helmet } from 'react-helmet';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';

const ClinicAppointmentsPage = () => {
    const { user } = useAuth();
    const { toast } = useToast();
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false); // Novo estado para o loading dos botões
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [time, setTime] = useState('');
    const [date, setDate] = useState('');
    const [rejectionReason, setRejectionReason] = useState('');
    const [isRejection, setIsRejection] = useState(false);

    const fetchRequests = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        try {
            // ================== MUDANÇA 1: Buscar o ID do animal ==================
            const { data, error } = await supabase
                .from('agendamentos')
                .select(`
                    id,
                    data_agendamento,
                    observacoes,
                    animal_id, 
                    animais ( nome ),
                    usuarios_tutores ( nome, email )
                `)
                .eq('clinica_id', user.id)
                .eq('status', 'Pendente');

            if (error) throw error;
            setRequests(data);
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Erro ao buscar solicitações",
                description: error.message,
            });
        } finally {
            setLoading(false);
        }
    }, [user, toast]);

    useEffect(() => {
        fetchRequests();
    }, [fetchRequests]);
    
    const handleOpenDialog = (request, rejection = false) => {
        setSelectedRequest(request);
        setDate(request.data_agendamento || new Date().toISOString().split('T')[0]);
        setTime('');
        setRejectionReason('');
        setIsRejection(rejection);
        setIsDialogOpen(true);
    };

    // ================== MUDANÇA 2: Lógica de aprovação atualizada ==================
    const handleUpdateStatus = async (status) => {
        if (!selectedRequest) return;
        setUpdating(true);

        if (status === 'Confirmado') {
            if (!time || !date) {
                toast({ variant: 'destructive', title: 'Erro', description: 'Por favor, defina a data e o horário para confirmar.' });
                setUpdating(false);
                return;
            }

            try {
                // Tenta associar o pet à clínica (só funciona se clinica_id for nulo)
                await supabase
                    .from('animais')
                    .update({ clinica_id: user.id })
                    .eq('id', selectedRequest.animal_id)
                    .is('clinica_id', null);

                // Atualiza o status do agendamento
                const { error: appointmentError } = await supabase
                    .from('agendamentos')
                    .update({ status: 'Confirmado', horario: time, data_agendamento: date })
                    .eq('id', selectedRequest.id);

                if (appointmentError) throw appointmentError;

                toast({
                    title: "Sucesso!",
                    description: "Agendamento confirmado e paciente vinculado à clínica."
                });

            } catch (error) {
                toast({ variant: "destructive", title: "Erro ao aprovar", description: error.message });
            }
        
        } else if (status === 'Recusado') {
            try {
                const { error } = await supabase
                    .from('agendamentos')
                    .update({ status: 'Recusado', motivo_recusa: rejectionReason })
                    .eq('id', selectedRequest.id);
                if (error) throw error;
                toast({ title: "Solicitação Recusada." });
            } catch (error) {
                 toast({ variant: "destructive", title: "Erro ao recusar", description: error.message });
            }
        }

        setUpdating(false);
        fetchRequests();
        setIsDialogOpen(false);
        setSelectedRequest(null);
    };

    return (
        <>
            <Helmet>
                <title>Solicitações de Agendamento - PetSafe QR</title>
            </Helmet>
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-4">
                        <CalendarClock className="h-8 w-8" />
                        <div>
                            <CardTitle>Solicitações de Agendamento</CardTitle>
                            <CardDescription>
                                Aprove ou recuse os pedidos de consulta dos tutores.
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                     {loading ? (
                        <div className="flex justify-center items-center h-40"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
                     ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Pet</TableHead>
                                    <TableHead>Tutor</TableHead>
                                    <TableHead>Data Sugerida</TableHead>
                                    <TableHead className="text-right">Ações</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {requests.length > 0 ? requests.map(req => (
                                    <TableRow key={req.id}>
                                        <TableCell className="font-medium">{req.animais.nome}</TableCell>
                                        <TableCell>{req.usuarios_tutores.nome}</TableCell>
                                        <TableCell>{new Date(req.data_agendamento + 'T00:00:00').toLocaleDateString()}</TableCell>
                                        <TableCell className="text-right">
                                            <Button onClick={() => handleOpenDialog(req)}>Analisar</Button>
                                        </TableCell>
                                    </TableRow>
                                )) : (
                                    <TableRow>
                                        <TableCell colSpan={4} className="h-24 text-center">Nenhuma solicitação pendente.</TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                     )}
                </CardContent>
            </Card>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                    {selectedRequest && (
                        <>
                            <DialogHeader>
                                <DialogTitle>{isRejection ? 'Recusar Solicitação' : 'Analisar Solicitação'}</DialogTitle>
                                <DialogDescription>
                                    <p><b>Pet:</b> {selectedRequest.animais.nome}</p>
                                    <p><b>Tutor:</b> {selectedRequest.usuarios_tutores.nome} ({selectedRequest.usuarios_tutores.email})</p>
                                    <p><b>Observações do Tutor:</b> {selectedRequest.observacoes || 'Nenhuma'}</p>
                                </DialogDescription>
                            </DialogHeader>
                            {isRejection ? (
                                <div className="grid gap-4 py-4">
                                     <div className="grid gap-2">
                                        <Label htmlFor="rejectionReason">Motivo da Recusa (opcional)</Label>
                                        <Textarea id="rejectionReason" value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value)} />
                                    </div>
                                </div>
                            ) : (
                                <div className="grid gap-4 py-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="grid gap-2">
                                            <Label htmlFor="date">Data da Consulta</Label>
                                            <Input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="time">Horário da Consulta</Label>
                                            <Input id="time" type="time" value={time} onChange={(e) => setTime(e.target.value)} />
                                        </div>
                                    </div>
                                </div>
                            )}
                            {/* ================== MUDANÇA 3: Botões com estado de loading ================== */}
                            <DialogFooter>
                                <Button variant="ghost" onClick={() => setIsDialogOpen(false)} disabled={updating}>Cancelar</Button>
                                {isRejection ? (
                                     <Button variant="destructive" onClick={() => handleUpdateStatus('Recusado')} disabled={updating}>
                                        {updating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <X className="mr-2 h-4 w-4" />}
                                        Confirmar Recusa
                                     </Button>
                                ) : (
                                    <div className="flex gap-2">
                                        <Button variant="destructive" onClick={() => setIsRejection(true)} disabled={updating}><X className="mr-2 h-4 w-4" />Recusar</Button>
                                        <Button className="bg-green-600 hover:bg-green-700" onClick={() => handleUpdateStatus('Confirmado')} disabled={updating}>
                                            {updating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
                                            Aprovar
                                        </Button>
                                    </div>
                                )}
                            </DialogFooter>
                        </>
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
};

export default ClinicAppointmentsPage;
