import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, Plus, ChevronLeft, ChevronRight, CalendarDays, List } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Helmet } from 'react-helmet';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import AppointmentForm from '@/components/AppointmentForm.jsx';
import { Badge } from '@/components/ui/badge';

// Importações do FullCalendar
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';

// --- Funções de Estilo (sem alterações) ---
const statusColors = {
  'Agendado': 'bg-yellow-500', 'Confirmado': 'bg-green-500', 'Pendente': 'bg-orange-500',
  'Cancelado': 'bg-slate-500', 'Finalizado': 'bg-blue-500',
};
const getStatusVariant = (status) => {
    switch (status) {
        case 'Confirmado': return 'success'; case 'Agendado': return 'warning';
        case 'Finalizado': return 'default'; case 'Cancelado': return 'destructive';
        default: return 'secondary';
    }
};

// --- Componente Principal ---
const ClinicAgendaPage = () => {
    const { user } = useAuth();
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [selectedAppointment, setSelectedAppointment] = useState(null);
    const [currentDate, setCurrentDate] = useState(new Date());
    
    // Estado para controlar a visualização: 'list' (lista diária) ou 'grid' (calendário mensal)
    const [view, setView] = useState('list'); 
    
    // Estados para a visão de LISTA
    const [dailyAppointments, setDailyAppointments] = useState([]);
    const [filteredDailyAppointments, setFilteredDailyAppointments] = useState([]);
    const [filters, setFilters] = useState({
        status: { 'Agendado': true, 'Confirmado': true, 'Finalizado': false, 'Cancelado': false },
        appointmentType: { 'Consulta': true, 'Vacina': true, 'Retorno': true, 'Cirurgia': true, 'Banho & Tosa': true, 'Pessoal': true },
    });

    // Estados para a visão de GRID (FullCalendar)
    const [calendarEvents, setCalendarEvents] = useState([]);

    // Busca dados para a VISÃO DE LISTA
    const fetchDailyAppointments = useCallback(async (date) => {
        if (!user) return;
        setLoading(true);
        try {
            const dateString = date.toISOString().split('T')[0];
            const { data, error } = await supabase.from('agendamentos')
                .select(`id, data_agendamento, horario, duracao_minutos, status, tipo_agendamento, tipo_consulta, descricao_interna, observacoes, animal_id, animais ( nome ), tutor_id, usuarios_tutores ( nome ), nome_animal_novo`)
                .eq('clinica_id', user.id).eq('data_agendamento', dateString);
            if (error) throw error;
            setDailyAppointments(data.sort((a, b) => a.horario.localeCompare(b.horario)));
        } catch (error) {
            toast({ variant: "destructive", title: "Erro ao buscar agendamentos", description: error.message });
        } finally {
            setLoading(false);
        }
    }, [user, toast]);

    // Busca dados para a VISÃO DE GRID (FullCalendar)
    const fetchAllAppointmentsForCalendar = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        try {
            const { data, error } = await supabase.from('agendamentos')
                .select(`id, data_agendamento, horario, duracao_minutos, status, tipo_agendamento, tipo_consulta, descricao_interna, animal_id, animais ( nome ), nome_animal_novo`);
            if (error) throw error;
            const formattedEvents = data.map(appt => ({
                id: appt.id,
                title: appt.tipo_agendamento === 'Pessoal' ? appt.descricao_interna : `${appt.tipo_consulta}: ${appt.nome_animal_novo || appt.animais?.nome || 'Pet'}`,
                start: `${appt.data_agendamento}T${appt.horario}`,
                end: new Date(new Date(`${appt.data_agendamento}T${appt.horario}`).getTime() + appt.duracao_minutos * 60000),
                allDay: false,
                extendedProps: appt,
                backgroundColor: statusColors[appt.status] || '#a1a1aa',
                borderColor: statusColors[appt.status] || '#a1a1aa',
            }));
            setCalendarEvents(formattedEvents);
        } catch (error) {
            toast({ variant: "destructive", title: "Erro ao carregar calendário", description: error.message });
        } finally {
            setLoading(false);
        }
    }, [user, toast]);

    // Decide qual função de busca chamar baseado na visão atual
    useEffect(() => {
        if (view === 'list') {
            fetchDailyAppointments(currentDate);
        } else {
            fetchAllAppointmentsForCalendar();
        }
    }, [view, currentDate, fetchDailyAppointments, fetchAllAppointmentsForCalendar]);

    // Filtra os agendamentos da lista diária
    useEffect(() => {
        if (view === 'list') {
            const activeStatusFilters = Object.keys(filters.status).filter(key => filters.status[key]);
            const activeTypeFilters = Object.keys(filters.appointmentType).filter(key => filters.appointmentType[key]);
            const newFiltered = dailyAppointments.filter(appt => {
                const statusMatch = activeStatusFilters.includes(appt.status);
                const typeMatch = appt.tipo_agendamento === 'Pessoal' ? activeTypeFilters.includes('Pessoal') : activeTypeFilters.includes(appt.tipo_consulta);
                return statusMatch && typeMatch;
            });
            setFilteredDailyAppointments(newFiltered);
        }
    }, [dailyAppointments, filters, view]);

    // --- Funções de Manipulação de Eventos ---
    const handleFilterChange = (type, key) => setFilters(prev => ({ ...prev, [type]: { ...prev[type], [key]: !prev[type][key] } }));
    const handleEventClick = (clickInfo) => {
        const apptData = clickInfo.event ? clickInfo.event.extendedProps : clickInfo;
        setSelectedAppointment(apptData);
        setIsFormOpen(true);
    };
    const handleFormSave = () => {
        setIsFormOpen(false);
        setSelectedAppointment(null);
        if (view === 'list') fetchDailyAppointments(currentDate);
        else fetchAllAppointmentsForCalendar();
    };
    const handleFormCancel = () => { setIsFormOpen(false); setSelectedAppointment(null); };
    const handleNewAppointment = () => { setSelectedAppointment(null); setIsFormOpen(true); };
    const changeDate = (amount) => setCurrentDate(prev => { const newDate = new Date(prev); newDate.setDate(newDate.getDate() + amount); return newDate; });
    const goToToday = () => setCurrentDate(new Date());

    // --- Componentes e Funções Auxiliares ---
    const FilterSection = ({ title, filterGroup, type }) => (
        <div className="mb-4">
            <h3 className="font-semibold mb-2">{title}</h3>
            <div className="space-y-2">
                {Object.keys(filterGroup).map(key => (
                    <div key={key} className="flex items-center space-x-2">
                        <Checkbox id={`${type}-${key}`} checked={filterGroup[key]} onCheckedChange={() => handleFilterChange(type, key)} />
                        <label htmlFor={`${type}-${key}`} className="text-sm font-medium leading-none">{key}</label>
                    </div>
                ))}
            </div>
        </div>
    );
    const getFormattedTime = (timeString, duration) => {
        if (!timeString) return '';
        const [hours, minutes] = timeString.split(':').map(Number);
        const start = new Date(); start.setHours(hours, minutes, 0);
        const end = new Date(start.getTime() + duration * 60000);
        const format = (date) => date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        return `${format(start)} - ${format(end)}`;
    };

    return (
        <>
            <Helmet><title>Agenda - PetSafe QR</title></Helmet>
            <div className="flex flex-col md:flex-row gap-6 h-[calc(100vh-8rem)]">
                <aside className="w-full md:w-64 bg-card p-4 rounded-lg overflow-y-auto flex-shrink-0">
                    <Button className="w-full mb-6" onClick={handleNewAppointment}><Plus className="mr-2 h-4 w-4"/> Agendar</Button>
                    <FilterSection title="Tipos de Atendimento" filterGroup={filters.appointmentType} type="appointmentType" />
                    <div className='my-4 border-t'></div>
                    <FilterSection title="Situações" filterGroup={filters.status} type="status" />
                </aside>

                <main className="flex-1 flex flex-col">
                    <div className="flex items-center justify-between p-4 bg-card rounded-t-lg border-b">
                        <h2 className="text-lg font-semibold">
                            {view === 'list' ? currentDate.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' }) : 'Visão Mensal'}
                        </h2>
                        <div className="flex items-center gap-2">
                            {view === 'list' && (
                                <>
                                    <Button variant="outline" onClick={() => changeDate(-1)}><ChevronLeft className="h-4 w-4" /></Button>
                                    <Button variant="outline" onClick={goToToday}>Hoje</Button>
                                    <Button variant="outline" onClick={() => changeDate(1)}><ChevronRight className="h-4 w-4" /></Button>
                                </>
                            )}
                            <div className="flex items-center rounded-md border p-1">
                                <Button variant={view === 'list' ? 'secondary' : 'ghost'} size="sm" onClick={() => setView('list')}><List className="h-4 w-4"/></Button>
                                <Button variant={view === 'grid' ? 'secondary' : 'ghost'} size="sm" onClick={() => setView('grid')}><CalendarDays className="h-4 w-4"/></Button>
                            </div>
                        </div>
                    </div>

                    {view === 'list' ? (
                        <Card className="flex-1 rounded-t-none">
                            <CardContent className="p-0 h-full overflow-y-auto">
                                {loading ? (
                                    <div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
                                ) : (
                                    <div className="divide-y">
                                        {filteredDailyAppointments.length > 0 ? filteredDailyAppointments.map(appt => (
                                            <div key={appt.id} className="flex items-center p-4 gap-4 hover:bg-muted cursor-pointer" onClick={() => handleEventClick(appt)}>
                                                <span className={`w-2 h-12 rounded-full ${statusColors[appt.status] || 'bg-gray-400'}`}></span>
                                                <div className="w-32 text-sm font-medium">{getFormattedTime(appt.horario, appt.duracao_minutos)}</div>
                                                <div className="flex-1">
                                                    <p className="font-semibold">{appt.tipo_agendamento === 'Pessoal' ? appt.descricao_interna : `${appt.tipo_consulta}: ${appt.nome_animal_novo || appt.animais?.nome || 'Pet'} (${appt.usuarios_tutores?.nome || 'Tutor'})`}</p>
                                                    <p className="text-sm text-muted-foreground">{appt.observacoes}</p>
                                                </div>
                                                <div><Badge variant={getStatusVariant(appt.status)}>{appt.status}</Badge></div>
                                            </div>
                                        )) : (
                                            <div className="flex justify-center items-center h-full text-muted-foreground"><p>Nenhum agendamento para hoje.</p></div>
                                        )}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    ) : (
                        <Card className="flex-1 rounded-t-none p-4">
                            {loading ? (
                                <div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
                            ) : (
                                <div className="h-full w-full">
                                    <FullCalendar
                                        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                                        initialView="dayGridMonth"
                                        headerToolbar={{ left: 'prev,next today', center: 'title', right: 'dayGridMonth,timeGridWeek,timeGridDay' }}
                                        events={calendarEvents}
                                        locale='pt-br'
                                        buttonText={{ today: 'Hoje', month: 'Mês', week: 'Semana', day: 'Dia' }}
                                        height="100%"
                                        eventClick={handleEventClick}
                                    />
                                </div>
                            )}
                        </Card>
                    )}
                </main>
            </div>

            <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader><DialogTitle>{selectedAppointment ? 'Editar Agendamento' : 'Novo Agendamento'}</DialogTitle></DialogHeader>
                    <AppointmentForm appointment={selectedAppointment} onSave={handleFormSave} onCancel={handleFormCancel} />
                </DialogContent>
            </Dialog>
        </>
    );
};

export default ClinicAgendaPage;
