import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Loader2, UserPlus, Search } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AddPetForm } from '@/components/AddPetForm';
import { Checkbox } from '@/components/ui/checkbox';

const AppointmentForm = ({ appointment, onSave, onCancel }) => {
    const { user } = useAuth();
    const { toast } = useToast();
    const [formData, setFormData] = useState({
        tipo_agendamento: 'Atendimento Cliente',
        emergencia: false,
        tutor_id: null,
        animal_id: null,
        nome_animal_novo: '',
        tipo_atendimento: '',
        duracao_minutos: '30',
        responsavel_id: user.id,
        status: 'Agendado',
        data_agendamento: new Date().toISOString().split('T')[0],
        horario: '',
        descricao_interna: '',
        observacoes: ''
    });
    const [tutorSearch, setTutorSearch] = useState('');
    const [tutorSearchResults, setTutorSearchResults] = useState([]);
    const [selectedTutor, setSelectedTutor] = useState(null);
    const [pets, setPets] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isSearching, setIsSearching] = useState(false);
    const [isAddPetOpen, setIsAddPetOpen] = useState(false);
    const [isNewPet, setIsNewPet] = useState(false);

    useEffect(() => {
        if (appointment) {
            setFormData({
                tipo_agendamento: appointment.tipo_agendamento || 'Atendimento Cliente',
                emergencia: appointment.emergencia || false,
                tutor_id: appointment.tutor_id || null,
                animal_id: appointment.animal_id || null,
                nome_animal_novo: appointment.nome_animal_novo || '',
                tipo_atendimento: appointment.tipo_consulta || '',
                duracao_minutos: String(appointment.duracao_minutos) || '30',
                responsavel_id: appointment.responsavel_id || user.id,
                status: appointment.status || 'Agendado',
                data_agendamento: appointment.data_agendamento || new Date().toISOString().split('T')[0],
                horario: appointment.horario || '',
                descricao_interna: appointment.descricao_interna || '',
                observacoes: appointment.observacoes || ''
            });
            if (appointment.tutor_id && appointment.usuarios_tutores) {
                const tutorData = { id: appointment.tutor_id, nome: appointment.usuarios_tutores.nome };
                setSelectedTutor(tutorData);
                setTutorSearch(tutorData.nome);
            }
            if (appointment.nome_animal_novo) {
                setIsNewPet(true);
            }
        }
    }, [appointment, user.id]);

    useEffect(() => {
        if (selectedTutor) {
            const fetchPets = async () => {
                const { data, error } = await supabase
                    .from('animais')
                    .select('id, nome')
                    .eq('tutor_id', selectedTutor.id);
                if (error) {
                    toast({ variant: 'destructive', title: 'Erro ao buscar pets.' });
                } else {
                    setPets(data);
                }
            };
            fetchPets();
        } else {
            setPets([]);
        }
    }, [selectedTutor, toast]);


    const handleSearchTutor = async () => {
        if (tutorSearch.length < 3) return;
        setIsSearching(true);
        const { data, error } = await supabase
            .from('usuarios_tutores')
            .select('id, nome, email')
            .or(`nome.ilike.%${tutorSearch}%,email.ilike.%${tutorSearch}%`);
        
        if (error) {
            toast({ variant: 'destructive', title: 'Erro na busca.' });
        } else {
            setTutorSearchResults(data);
        }
        setIsSearching(false);
    };

    const handleSelectTutor = (tutor) => {
        setSelectedTutor(tutor);
        setFormData({ ...formData, tutor_id: tutor.id, animal_id: null, nome_animal_novo: '' });
        setTutorSearch(tutor.nome);
        setTutorSearchResults([]);
        setIsNewPet(false);
    };
    
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSelectChange = (name, value) => {
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleNewPetToggle = (checked) => {
        setIsNewPet(checked);
        if (checked) {
            handleSelectChange('animal_id', null);
        } else {
            handleSelectChange('nome_animal_novo', '');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        const submissionData = {
            clinica_id: user.id,
            tipo_agendamento: formData.tipo_agendamento,
            emergencia: formData.emergencia,
            status: formData.status,
            data_agendamento: formData.data_agendamento,
            horario: formData.horario,
            duracao_minutos: parseInt(formData.duracao_minutos, 10),
            responsavel_id: formData.responsavel_id,
            observacoes: formData.observacoes,
            tutor_id: formData.tipo_agendamento === 'Atendimento Cliente' ? formData.tutor_id : null,
            animal_id: formData.tipo_agendamento === 'Atendimento Cliente' && !isNewPet ? formData.animal_id : null,
            nome_animal_novo: formData.tipo_agendamento === 'Atendimento Cliente' && isNewPet ? formData.nome_animal_novo : null,
            tipo_consulta: formData.tipo_agendamento === 'Atendimento Cliente' ? formData.tipo_atendimento : null,
            descricao_interna: formData.tipo_agendamento !== 'Atendimento Cliente' ? formData.descricao_interna : null,
        };

        let error;
        if (appointment) {
            ({ error } = await supabase.from('agendamentos').update(submissionData).eq('id', appointment.id));
        } else {
            ({ error } = await supabase.from('agendamentos').insert([submissionData]));
        }

        if (error) {
            toast({ variant: 'destructive', title: 'Erro ao salvar agendamento', description: error.message });
        } else {
            toast({ title: 'Sucesso!', description: 'Agendamento salvo.' });
            onSave();
        }
        setIsLoading(false);
    };
    
    const onPetAdded = () => {
        setIsAddPetOpen(false);
        if(selectedTutor) {
            const fetchPets = async () => {
                const { data, error } = await supabase
                    .from('animais')
                    .select('id, nome')
                    .eq('tutor_id', selectedTutor.id);
                if (error) {
                    toast({ variant: 'destructive', title: 'Erro ao buscar pets.' });
                } else {
                    setPets(data);
                }
            };
            fetchPets();
        }
    }

    return (
        <>
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <Label>Tipo de Agendamento</Label>
                    <Select value={formData.tipo_agendamento} onValueChange={(v) => handleSelectChange('tipo_agendamento', v)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Atendimento Cliente">Atendimento Cliente</SelectItem>
                            <SelectItem value="Pessoal">Pessoal/Interno</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="flex items-end">
                    <Button type="button" variant={formData.emergencia ? 'destructive' : 'outline'} onClick={() => setFormData(prev => ({...prev, emergencia: !prev.emergencia}))}>
                        {formData.emergencia ? 'É Emergência' : 'Não é Emergência'}
                    </Button>
                </div>
            </div>

            {formData.tipo_agendamento === 'Atendimento Cliente' ? (
                <>
                    <div>
                        <Label htmlFor="tutorSearch">Cliente (Nome ou E-mail)</Label>
                        <div className="flex items-center gap-2">
                           <Input id="tutorSearch" value={tutorSearch} onChange={(e) => setTutorSearch(e.target.value)} placeholder="Digite 3+ letras para buscar"/>
                           <Button type="button" onClick={handleSearchTutor} disabled={isSearching}>{isSearching ? <Loader2 className="h-4 w-4 animate-spin"/> : <Search className="h-4 w-4"/>}</Button>
                           <Dialog open={isAddPetOpen} onOpenChange={setIsAddPetOpen}>
                                <DialogTrigger asChild>
                                    <Button type="button" variant="outline"><UserPlus className="h-4 w-4"/></Button>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-2xl">
                                    <DialogHeader><DialogTitle>Cadastrar Novo Paciente</DialogTitle></DialogHeader>
                                    <AddPetForm onPetAdded={onPetAdded} />
                                </DialogContent>
                            </Dialog>
                        </div>
                        {tutorSearchResults.length > 0 && (
                             <ul className="border rounded-md mt-1 max-h-40 overflow-y-auto bg-card z-10 absolute w-[calc(100%-2rem)]">
                                {tutorSearchResults.map(t => (
                                    <li key={t.id} onClick={() => handleSelectTutor(t)} className="p-2 hover:bg-muted cursor-pointer">
                                        {t.nome} ({t.email})
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                    
                    <div>
                        <Label>Animal</Label>
                        <div className="flex items-center gap-2">
                            <div className="flex-grow">
                                {isNewPet ? (
                                    <Input 
                                        name="nome_animal_novo" 
                                        value={formData.nome_animal_novo} 
                                        onChange={handleChange} 
                                        placeholder="Digite o nome do novo pet"
                                    />
                                ) : (
                                    <Select name="animal_id" value={formData.animal_id || ''} onValueChange={(v) => handleSelectChange('animal_id', v)} disabled={!selectedTutor}>
                                        <SelectTrigger><SelectValue placeholder={selectedTutor ? "Selecione um pet" : "Selecione um tutor primeiro"} /></SelectTrigger>
                                        <SelectContent>
                                            {pets.map(pet => <SelectItem key={pet.id} value={pet.id}>{pet.nome}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                )}
                            </div>
                            <div className="flex items-center space-x-2 pt-2">
                                <Checkbox id="new-pet-toggle" checked={isNewPet} onCheckedChange={handleNewPetToggle} />
                                <Label htmlFor="new-pet-toggle" className="text-sm">Novo Pet</Label>
                            </div>
                        </div>
                    </div>
                     <div>
                        <Label>Tipo de Atendimento</Label>
                        <Select name="tipo_atendimento" value={formData.tipo_atendimento} onValueChange={(v) => handleSelectChange('tipo_atendimento', v)}>
                            <SelectTrigger><SelectValue placeholder="Selecione um tipo" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Consulta">Consulta</SelectItem>
                                <SelectItem value="Vacina">Vacina</SelectItem>
                                <SelectItem value="Retorno">Retorno</SelectItem>
                                <SelectItem value="Cirurgia">Cirurgia</SelectItem>
                                <SelectItem value="Banho & Tosa">Banho & Tosa</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </>
            ) : (
                <div>
                    <Label htmlFor="descricao_interna">Descrição do Agendamento</Label>
                    <Input id="descricao_interna" name="descricao_interna" value={formData.descricao_interna} onChange={handleChange} required />
                </div>
            )}

            <div className="grid grid-cols-2 gap-4">
                 <div>
                    <Label>Duração</Label>
                    <Select name="duracao_minutos" value={formData.duracao_minutos} onValueChange={(v) => handleSelectChange('duracao_minutos', v)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="15">15 minutos</SelectItem>
                            <SelectItem value="30">30 minutos</SelectItem>
                            <SelectItem value="45">45 minutos</SelectItem>
                            <SelectItem value="60">60 minutos</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div>
                    <Label>Situação</Label>
                    <Select name="status" value={formData.status} onValueChange={(v) => handleSelectChange('status', v)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Agendado">Agendado</SelectItem>
                            <SelectItem value="Confirmado">Confirmado</SelectItem>
                            <SelectItem value="Finalizado">Finalizado</SelectItem>
                            <SelectItem value="Cancelado">Cancelado</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <Label htmlFor="data_agendamento">Início</Label>
                    <Input type="date" id="data_agendamento" name="data_agendamento" value={formData.data_agendamento} onChange={handleChange} required />
                </div>
                <div>
                    <Label htmlFor="horario">Hora</Label>
                    <Input type="time" id="horario" name="horario" value={formData.horario} onChange={handleChange} required />
                </div>
            </div>

            <div>
                <Label htmlFor="observacoes">Observação</Label>
                <Textarea id="observacoes" name="observacoes" value={formData.observacoes} onChange={handleChange} />
            </div>

            <div className="flex justify-end gap-2">
                <Button type="button" variant="ghost" onClick={onCancel}>Cancelar</Button>
                <Button type="submit" disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Salvar
                </Button>
            </div>
        </form>
        </>
    );
};

export default AppointmentForm;
