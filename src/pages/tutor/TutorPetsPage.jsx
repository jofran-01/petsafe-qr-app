import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { PlusCircle, Loader2, UploadCloud, FileText, Trash2, Edit, AlertTriangle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Helmet } from 'react-helmet';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// O componente PetForm permanece o mesmo, pois a lógica dele está correta.
const PetForm = ({ onFormSubmit, petData, isEditing = false }) => {
  const { user } = useAuth();
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
            tutor_id: user.id,
            peso: formData.peso || null,
            data_nascimento: formData.data_nascimento || null,
        };
        
        if (isEditing) {
            ({ data, error } = await supabase.from('animais').update(petPayload).eq('id', petData.id).select().single());
        } else {
            const { data: newPet, error: insertError } = await supabase.from('animais').insert(petPayload).select('id').single();
            if(insertError) throw insertError;
            data = newPet;
        }
        
        if (error) throw error;
        onFormSubmit(data);

    } catch (error) {
      toast({ variant: 'destructive', title: `Erro ao ${isEditing ? 'atualizar' : 'adicionar'} pet`, description: error.message });
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
             <Select value={formData.sexo || ''} onValueChange={(value) => handleSelectChange('sexo', value)}>
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
        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : `${isEditing ? 'Salvar Alterações' : 'Adicionar Pet'}`}
      </Button>
    </form>
  );
};


const TutorPetsPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [pets, setPets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedPet, setSelectedPet] = useState(null);
  const [isPhotoDialogOpen, setIsPhotoDialogOpen] = useState(false);
  const [petImageFile, setPetImageFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  // --- NOVOS ESTADOS PARA O MODAL DE EXCLUSÃO ---
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetchPets = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('animais')
        .select(`*`)
        .eq('tutor_id', user.id)
        .order('criado_em', { ascending: false });

      if (error) throw error;
      setPets(data);
    } catch (error) {
      toast({ variant: "destructive", title: "Erro ao buscar seus pets", description: error.message });
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    fetchPets();
  }, [fetchPets]);

  const handleFormSubmit = () => {
    fetchPets();
    setIsFormOpen(false);
    toast({ title: "Sucesso!", description: `Pet ${isEditing ? 'atualizado' : 'adicionado'}.` });
  };
  
  const handleAddClick = () => {
      setSelectedPet(null);
      setIsEditing(false);
      setIsFormOpen(true);
  };
  
  const handleEditClick = (pet) => {
    setSelectedPet(pet);
    setIsEditing(true);
    setIsFormOpen(true);
  };
  
  const handlePhotoClick = (pet) => {
    setSelectedPet(pet);
    setIsPhotoDialogOpen(true);
  }

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setPetImageFile(e.target.files[0]);
    }
  };

  const handleUploadImage = async () => {
    if (!petImageFile || !selectedPet) return;
    setUploading(true);
    try {
      const filePath = `${user.id}/${selectedPet.id}/${petImageFile.name}`;
      
      const { data: listData, error: listError } = await supabase.storage.from('pet-avatars').list(`${user.id}/${selectedPet.id}`);
      if(listError) throw listError;
      
      const filesToRemove = listData.map(file => `${user.id}/${selectedPet.id}/${file.name}`);
      if(filesToRemove.length > 0) {
        await supabase.storage.from('pet-avatars').remove(filesToRemove);
      }

      const { error: uploadError } = await supabase.storage
        .from('pet-avatars')
        .upload(filePath, petImageFile, { upsert: false });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('pet-avatars')
        .getPublicUrl(filePath);

      const { error: dbError } = await supabase.from('animais')
        .update({ foto_url: `${publicUrl}?t=${new Date().getTime()}` })
        .eq('id', selectedPet.id);
      
      if (dbError) throw dbError;

      toast({ title: "Sucesso!", description: "Foto do pet atualizada." });
      fetchPets();
      setIsPhotoDialogOpen(false);
      setPetImageFile(null);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Erro no Upload', description: error.message });
    } finally {
      setUploading(false);
    }
  };
  
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
      const { error } = await supabase
        .from('animais')
        .delete()
        .eq('id', selectedPet.id);

      if (error) throw error;

      if (selectedPet.foto_url) {
        const filePath = `${user.id}/${selectedPet.id}/`;
        const { data: listData } = await supabase.storage.from('pet-avatars').list(filePath);
        if (listData && listData.length > 0) {
          const filesToRemove = listData.map(file => `${filePath}${file.name}`);
          await supabase.storage.from('pet-avatars').remove(filesToRemove);
        }
      }

      toast({ title: "Sucesso!", description: `${selectedPet.nome} foi removido.` });
      fetchPets();
      setIsDeleteDialogOpen(false);
      setSelectedPet(null);

    } catch (error) {
      toast({ variant: 'destructive', title: 'Erro ao excluir pet', description: error.message });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Meus Pets - PetSafe QR</title>
      </Helmet>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Meus Pets</h1>
        <Button onClick={handleAddClick}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Adicionar Pet
        </Button>
      </div>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-md">
            <DialogHeader>
                <DialogTitle>{isEditing ? 'Editar Pet' : 'Adicionar Novo Pet'}</DialogTitle>
                <DialogDescription>
                    {isEditing ? 'Atualize os dados do seu pet.' : 'Preencha os dados básicos do seu novo pet.'}
                </DialogDescription>
            </DialogHeader>
            <PetForm onFormSubmit={handleFormSubmit} petData={selectedPet} isEditing={isEditing} />
        </DialogContent>
      </Dialog>
      
      <Dialog open={isPhotoDialogOpen} onOpenChange={setIsPhotoDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Atualizar Foto de {selectedPet?.nome}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
             <div className="grid gap-2">
              <Label htmlFor="pet-image-upload">Escolha uma nova foto</Label>
              <Input id="pet-image-upload" type="file" onChange={handleFileChange} accept="image/*" />
            </div>
             <Button onClick={handleUploadImage} disabled={uploading || !petImageFile}>
              {uploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UploadCloud className="mr-2 h-4 w-4" />}
              Salvar Foto
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* --- NOVO DIALOG PARA CONFIRMAR A EXCLUSÃO --- */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="text-destructive" />
              Confirmar Exclusão
            </DialogTitle>
            <DialogDescription className="pt-4">
              Você tem certeza que deseja excluir <strong>{selectedPet?.nome}</strong>? Esta ação não pode ser desfeita.
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
      
      {loading ? (
        <div className="flex justify-center items-center h-40">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : pets.length > 0 ? (
         <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {pets.map((pet) => (
            <Card key={pet.id} className="flex flex-col">
              <CardHeader className="flex flex-row items-center gap-4">
                <button onClick={() => handlePhotoClick(pet)} className="relative group">
                    <img
                        src={pet.foto_url || 'https://ylyahsovfcolgdwisbll.supabase.co/storage/v1/object/public/pet-avatars/default-pet-avatar.png'}
                        alt={`Foto de ${pet.nome}`}
                        className="w-20 h-20 rounded-full object-cover border-4 border-primary transition-all duration-300 group-hover:brightness-50"
                    />
                     <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <UploadCloud className="text-white h-8 w-8" />
                    </div>
                </button>
                <div>
                  <CardTitle className="text-xl">{pet.nome}</CardTitle>
                  <CardDescription>{pet.especie} - {pet.raca}</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="flex-grow flex flex-col justify-end gap-2">
                <Button onClick={( ) => navigate(`/tutor/dashboard/pets/${pet.id}/carteirinha`)}>
                  <FileText className="mr-2 h-4 w-4" /> Ver Carteirinha
                </Button>
                <div className="flex gap-2">
                    <Button variant="outline" className="w-full" onClick={() => handleEditClick(pet)}>
                        <Edit className="mr-2 h-4 w-4" /> Editar
                    </Button>
                     {/* --- BOTÃO DE EXCLUIR AGORA CHAMA A FUNÇÃO CORRETA --- */}
                     <Button variant="destructive" className="w-full" onClick={() => handleDeleteClick(pet)}>
                        <Trash2 className="mr-2 h-4 w-4" /> Excluir
                    </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
         <Card>
            <CardContent className="h-48 flex flex-col items-center justify-center gap-4 text-center">
                 <h3 className="text-xl font-semibold">Você ainda não tem pets cadastrados</h3>
                 <p className="text-muted-foreground">Adicione seu primeiro pet para começar!</p>
                 <Button onClick={handleAddClick}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Adicionar Pet
                </Button>
            </CardContent>
        </Card>
      )}
    </>
  );
};

export default TutorPetsPage;
