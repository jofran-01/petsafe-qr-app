import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Helmet } from 'react-helmet';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import AppointmentForm from '@/components/AppointmentForm.jsx';
import { Badge } from '@/components/ui/badge';

const statusColors = {
  'Agendado': 'bg-yellow-500',
  'Confirmado': 'bg-green-500',
  'Pendente': 'bg-orange-500',
  'Cancelado': 'bg-slate-500',
  'Finalizado': 'bg-blue-500',
};

const getStatusVariant = (status) => {
    switch (status) {
        case 'Confirmado': return 'success';
        case 'Agendado': return 'warning';
        case 'Finalizado': return 'default';
        case 'Cancelado': return 'destructive';
        default: return 'secondary';
    }
};

const ClinicAgendaPage = () => {
    const { user } = useAuth();
    const { toast } = useToast();
    const [allAppointments, setAllAppointments] = useState([]);
    const [filteredAppointments, setFilteredAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [selectedAppointment, setSelectedAppointment] = useState(null);
    const [currentDate, setCurrentDate] = useState(new Date());

    const [filters, setFilters] = useState({
        status: {
            'Agendado': true,
            'Confirmado': true,
            'Finalizado': false,
            'Cancelado': false,
        },
        appointmentType: {
            'Consulta': true,
            'Vacina': true,
            'Retorno': true,
            'Cirurgia': true,
            'Banho & Tosa': true,
            'Pessoal': true,
        },
    });

    const fetchAppointments = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        try {
            const dateString = currentDate.toISOString().split('T')[0];
            const { data, error } = await supabase
                .from('agendamentos')
                .select(`
                    id, data_agendamento, horario, duracao_minutos, status, emergencia, tipo_agendamento,
                    tipo_consulta, descricao_interna, observacoes,
                    animal_id, animais ( nome ),
                    tutor_id, usuarios_tutores ( nome ),
                    responsavel_id,
                    nome_animal_novo 
                `) // <== ADICIONADO `nome_animal_novo` AO SELECT
                .eq('clinica_id', user.id)
                .eq('data_agendamento', dateString);

            if (error) throw error;
            
            const sortedData = data.sort((a, b) => a.horario.localeCompare(b.horario));
            setAllAppointments(sortedData);

        } catch (error) {
            toast({ variant: "destructive", title: "Erro ao buscar agendamentos", description: error.message });
        } finally {
            setLoading(false);
        }
    }, [user, toast, currentDate]);

    useEffect(() => {
        fetchAppointments();
    }, [fetchAppointments]);

    useEffect(() => {
        // Lógica de filtragem (sem alterações)
        const activeStatusFilters = Object.keys(filters.status).filter(key => filters.status[key]);
        const activeTypeFilters = Object.keys(filters.appointmentType).filter(key => filters.appointmentType[key]);

        const newFilteredAppointments = allAppointments.filter(appt => {
            const statusMatch = activeStatusFilters.includes(appt.status);
            
            let typeMatch = false;
            if (appt.tipo_agendamento === 'Pessoal') {
                typeMatch = activeTypeFilters.includes('Pessoal');
            } else {
                 typeMatch = activeTypeFilters.includes(appt.tipo_consulta);
            }
            
            return statusMatch && typeMatch;
        });

        setFilteredAppointments(newFilteredAppointments);
    }, [allAppointments, filters]);


    const handleFilterChange = (type, key) => {
        setFilters(prev => ({
            ...prev,
            [type]: {
                ...prev[type],
                [key]: !prev[type][key]
            }
        }));
    };

    const handleEventClick = (appointment) => {
        setSelectedAppointment(appointment);
        setIsFormOpen(true);
    };

    const handleFormSave = () => {
        setIsFormOpen(false);
        setSelectedAppointment(null);
        fetchAppointments(); // Recarrega os dados para refletir as mudanças
    };

    const handleFormCancel = () => {
        setIsFormOpen(false);
        setSelectedAppointment(null);
    };
    
    const handleNewAppointment = () => {
        setSelectedAppointment(null);
        setIsFormOpen(true);
    }
    
    const changeDate = (amount) => {
        setCurrentDate(prev => {
            const newDate = new Date(prev);
            newDate.setDate(newDate.getDate() + amount);
            return newDate;
        });
    };
    
    const goToToday = () => {
        setCurrentDate(new Date());
    };

    const FilterSection = ({ title, filterGroup, type }) => (
        <div className="mb-4">
            <h3 className="font-semibold mb-2">{title}</h3>
            <div className="space-y-2">
                {Object.keys(filterGroup).map(key => (
                    <div key={key} className="flex items-center space-x-2">
                        <Checkbox
                            id={`${type}-${key}`}
                            checked={filterGroup[key]}
                            onCheckedChange={() => handleFilterChange(type, key)}
                        />
                        <label htmlFor={`${type}-${key}`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                            {key}
                        </label>
                    </div>
                ))}
            </div>
        </div>
    );
    
    const getFormattedTime = (timeString, duration) => {
        if (!timeString) return '';
        const [hours, minutes] = timeString.split(':').map(Number);
        const start = new Date();
        start.setHours(hours, minutes, 0);
        const end = new Date(start.getTime() + duration * 60000);
        const format = (date) => date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        return `${format(start)} - ${format(end)}`;
    };

    return (
        <>
            <Helmet>
                <title>Agenda - PetSafe QR</title>
            </Helmet>
            <div className="flex flex-col md:flex-row gap-6 h-[calc(100vh-8rem)]">
                {/* Barra lateral de filtros (sem alterações) */}
                <aside className="w-full md:w-64 bg-card p-4 rounded-lg overflow-y-auto">
                     <Button className="w-full mb-6" onClick={handleNewAppointment}><Plus className="mr-2 h-4 w-4"/> Agendar</Button>
                    <FilterSection title="Tipos de Atendimento" filterGroup={filters.appointmentType} type="appointmentType" />
                    <div className='my-4 border-t'></div>
                    <FilterSection title="Situações" filterGroup={filters.status} type="status" />
                </aside>

                <main className="flex-1 flex flex-col">
                    {/* Cabeçalho da agenda (sem alterações) */}
                    <div className="flex items-center justify-between p-4 bg-card rounded-t-lg border-b">
                         <h2 className="text-lg font-semibold">{currentDate.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}</h2>
                         <div className="flex items-center gap-2">
                             <Button variant="outline" onClick={() => changeDate(-1)}><ChevronLeft className="h-4 w-4" /></Button>
                             <Button variant="outline" onClick={goToToday}>Hoje</Button>
                             <Button variant="outline" onClick={() => changeDate(1)}><ChevronRight className="h-4 w-4" /></Button>
                         </div>
                    </div>
                    <Card className="flex-1 rounded-t-none">
                        <CardContent className="p-0 h-full overflow-y-auto">
                            {loading ? (
                                <div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
                            ) : (
                                <div className="divide-y">
                                    {filteredAppointments.length > 0 ? filteredAppointments.map(appt => (
                                        <div key={appt.id} className="flex items-center p-4 gap-4 hover:bg-muted cursor-pointer" onClick={() => handleEventClick(appt)}>
                                            <span className={`w-2 h-12 rounded-full ${statusColors[appt.status] || 'bg-gray-400'}`}></span>
                                            <div className="w-32 text-sm font-medium">
                                                {getFormattedTime(appt.horario, appt.duracao_minutos)}
                                            </div>
                                            <div className="flex-1">
                                                {/* ================== LÓGICA DE EXIBIÇÃO ATUALIZADA ================== */}
                                                <p className="font-semibold">{
                                                  appt.tipo_agendamento === 'Pessoal' 
                                                    ? appt.descricao_interna 
                                                    : `${appt.tipo_consulta}: ${appt.nome_animal_novo || appt.animais?.nome || 'Pet sem nome'} (${appt.usuarios_tutores?.nome || 'Tutor não informado'})`  
                                                }</p>
                                                <p className="text-sm text-muted-foreground">{appt.observacoes}</p>
                                            </div>
                                            <div>
                                                 <Badge variant={getStatusVariant(appt.status)}>{appt.status}</Badge>
                                            </div>
                                        </div>
                                    )) : (
                                        <div className="flex justify-center items-center h-full text-muted-foreground">
                                            <p>Nenhum agendamento para hoje.</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </main>
            </div>

            {/* Modal de agendamento (sem alterações) */}
            <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>{selectedAppointment ? 'Editar Agendamento' : 'Novo Agendamento'}</DialogTitle>
                    </DialogHeader>
                    <AppointmentForm
                        appointment={selectedAppointment}
                        onSave={handleFormSave}
                        onCancel={handleFormCancel}
                    />
                </DialogContent>
            </Dialog>
        </>
    );
};

export default ClinicAgendaPage;
