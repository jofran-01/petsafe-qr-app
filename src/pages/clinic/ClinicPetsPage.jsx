import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { PlusCircle, Loader2, MoreHorizontal, Edit, Trash2, ClipboardList, AlertTriangle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Helmet } from 'react-helmet';
import { AddPetForm } from '@/components/AddPetForm'; // Reutilizando o formulário principal
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// O EditPetForm pode ser removido ou unificado com o AddPetForm se a lógica for a mesma.
// Por simplicidade, vamos focar na exclusão.

const ClinicPetsPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [pets, setPets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  
  // Estados para o modal de edição (se você mantiver um form separado)
  // const [isEditDialogOpen, setIsEditDialogOpen] = useState(false); 
  
  const [selectedPet, setSelectedPet] = useState(null);

  // --- NOVOS ESTADOS PARA O MODAL DE EXCLUSÃO ---
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

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

  // --- NOVA FUNÇÃO PARA ABRIR O MODAL DE CONFIRMAÇÃO ---
  const handleDeleteClick = (pet) => {
    setSelectedPet(pet);
    setIsDeleteDialogOpen(true);
  };

  // --- NOVA FUNÇÃO QUE REALMENTE DELETA O PET ---
  const handleDeletePet = async () => {
    if (!selectedPet) return;
    setDeleting(true);
    try {
      // Deleta o registro do pet da tabela 'animais'
      const { error } = await supabase
        .from('animais')
        .delete()
        .eq('id', selectedPet.id);

      if (error) throw error;

      toast({ title: "Sucesso!", description: `${selectedPet.nome} foi removido da lista de pacientes.` });
      fetchPets(); // Atualiza a lista na tela
      setIsDeleteDialogOpen(false); // Fecha o modal
      setSelectedPet(null);

    } catch (error) {
      toast({ variant: 'destructive', title: 'Erro ao excluir paciente', description: error.message });
    } finally {
      setDeleting(false);
    }
  };

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

      {/* --- NOVO DIALOG PARA CONFIRMAR A EXCLUSÃO --- */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="text-destructive" />
              Confirmar Exclusão
            </DialogTitle>
            <DialogDescription className="pt-4">
              Você tem certeza que deseja excluir o paciente <strong>{selectedPet?.nome}</strong>? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)} disabled={deleting}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDeletePet} disabled={deleting}>
              {deleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
              Sim, Excluir
            </Button>
          </DialogFooter>
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
                              <DropdownMenuItem onClick={() => alert('Funcionalidade de edição a ser implementada.')}>
                                <Edit className="mr-2 h-4 w-4" /> Editar
                              </DropdownMenuItem>
                              {/* --- ITEM DE MENU "EXCLUIR" AGORA FUNCIONA --- */}
                              <DropdownMenuItem className="text-red-600" onClick={() => handleDeleteClick(pet)}>
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
