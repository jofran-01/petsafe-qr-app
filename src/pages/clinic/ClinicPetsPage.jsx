import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { PlusCircle, Loader2, MoreHorizontal, Edit, Trash2, ClipboardList } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Helmet } from 'react-helmet';
import { AddPetForm } from '@/components/AddPetForm';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const EditPetForm = ({ onFormSubmit, petData, isEditing = false }) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nome: '', especie: '', raca: '', data_nascimento: '', sexo: '', peso: ''
  });

  useEffect(() => {
    if(isEditing && petData) {
      setFormData({
        nome: petData.nome || '',
        especie: petData.especie || '',
        raca: petData.raca || '',
        data_nascimento: petData.data_nascimento || '',
        sexo: petData.sexo || '',
        peso: petData.peso || '',
      });
    }
  }, [petData, isEditing]);

  const handleChange = (e) => setFormData({ ...formData, [e.target.id]: e.target.value });
  const handleSelectChange = (id, value) => setFormData({ ...formData, [id]: value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
        let error, data;
        const petPayload = {
            ...formData,
            peso: formData.peso || null,
            data_nascimento: formData.data_nascimento || null,
        };
        
        ({ data, error } = await supabase.from('animais').update(petPayload).eq('id', petData.id).select().single());
        
        if (error) throw error;
        onFormSubmit(data);

    } catch (error) {
      toast({ variant: 'destructive', title: `Erro ao atualizar pet`, description: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="grid gap-4 py-4">
      <div className="grid gap-2">
        <Label htmlFor="nome">Nome do Pet</Label>
        <Input id="nome" value={formData.nome} onChange={handleChange} required />
      </div>
       <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="especie">Espécie</Label>
          <Input id="especie" value={formData.especie} onChange={handleChange} required />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="raca">Raça</Label>
          <Input id="raca" value={formData.raca} onChange={handleChange} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
            <Label htmlFor="data_nascimento">Data de Nascimento</Label>
            <Input id="data_nascimento" type="date" value={formData.data_nascimento} onChange={handleChange} />
        </div>
        <div className="grid gap-2">
            <Label htmlFor="sexo">Sexo</Label>
             <Select value={formData.sexo} onValueChange={(value) => handleSelectChange('sexo', value)}>
                <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent>
                <SelectItem value="Macho">Macho</SelectItem>
                <SelectItem value="Fêmea">Fêmea</SelectItem>
                </SelectContent>
            </Select>
        </div>
      </div>
       <div className="grid gap-2">
        <Label htmlFor="peso">Peso (kg)</Label>
        <Input id="peso" type="number" step="0.1" value={formData.peso} onChange={handleChange} />
      </div>
      <Button type="submit" disabled={loading} className="mt-4">
        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Salvar Alterações'}
      </Button>
    </form>
  );
};


const ClinicPetsPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [pets, setPets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedPet, setSelectedPet] = useState(null);

  const fetchPets = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
        const { data, error } = await supabase
            .from('animais')
            .select(`
              id,
              nome,
              especie,
              raca,
              data_nascimento,
              sexo,
              peso,
              usuarios_tutores ( nome )
            `)
            .eq('clinica_id', user.id)
            .order('criado_em', { ascending: false });

        if (error) throw error;
        
        setPets(data);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro ao buscar pacientes",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    fetchPets();
  }, [fetchPets]);

  const onPetAdded = () => {
    fetchPets();
    setIsAddDialogOpen(false);
    toast({ title: "Sucesso!", description: `Novo paciente cadastrado.` });
  }

  const onPetEdited = () => {
    fetchPets();
    setIsEditDialogOpen(false);
    toast({ title: "Sucesso!", description: `Dados do paciente atualizados.` });
  }

  const handleEditClick = (pet) => {
    setSelectedPet(pet);
    setIsEditDialogOpen(true);
  }
  
  const handleNotImplemented = () => {
     toast({
      title: "🚧 Em breve!",
      description: "Esta funcionalidade ainda não foi implementada.",
    });
  }

  return (
    <>
      <Helmet>
        <title>Pacientes - PetSafe QR</title>
      </Helmet>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Pacientes</h1>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Cadastrar Novo Paciente
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>Cadastrar Novo Paciente</DialogTitle>
              <DialogDescription>
                Preencha todas as informações do pet. Se o tutor não existir, cadastre-o informando o e-mail.
              </DialogDescription>
            </DialogHeader>
            <AddPetForm onPetAdded={onPetAdded} />
          </DialogContent>
        </Dialog>
      </div>

       <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
            <DialogHeader>
                <DialogTitle>Editar Paciente</DialogTitle>
                <DialogDescription>
                    Atualize os dados do paciente.
                </DialogDescription>
            </DialogHeader>
            <EditPetForm onFormSubmit={onPetEdited} petData={selectedPet} isEditing={true} />
        </DialogContent>
      </Dialog>
      
      <Card>
        <CardHeader>
          <CardTitle>Lista de Pacientes</CardTitle>
          <CardDescription>
            Visualize e gerencie todos os pets cadastrados na sua clínica.
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
                  <TableHead>Nome</TableHead>
                  <TableHead>Espécie</TableHead>
                  <TableHead>Raça</TableHead>
                  <TableHead>Tutor</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pets.length > 0 ? (
                  pets.map((pet) => (
                    <TableRow key={pet.id}>
                      <TableCell className="font-medium">{pet.nome}</TableCell>
                      <TableCell>{pet.especie}</TableCell>
                      <TableCell>{pet.raca}</TableCell>
                      <TableCell>{pet.usuarios_tutores?.nome || 'Não informado'}</TableCell>
                      <TableCell className="text-right">
                         <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Abrir menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => navigate(`/dashboard/prontuarios/${pet.id}`)}>
                                <ClipboardList className="mr-2 h-4 w-4" /> Ver Prontuário
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleEditClick(pet)}>
                                <Edit className="mr-2 h-4 w-4" /> Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-red-600" onClick={handleNotImplemented}>
                                <Trash2 className="mr-2 h-4 w-4" /> Excluir
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                      Nenhum paciente encontrado.
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

export default ClinicPetsPage;