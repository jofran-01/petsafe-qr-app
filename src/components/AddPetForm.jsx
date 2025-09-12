
    import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { Loader2 } from 'lucide-react';
import { Combobox } from '@/components/ui/combobox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export const AddPetForm = ({ onPetAdded }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [tutors, setTutors] = useState([]);
  const [selectedTutorId, setSelectedTutorId] = useState('');
  const [newTutorEmail, setNewTutorEmail] = useState('');

  const [formData, setFormData] = useState({
    nome: '',
    especie: '',
    raca: '',
    data_nascimento: '',
    sexo: '',
    peso: '',
    tamanho: '',
    cor: '',
    doencas_cronicas: '',
    alergias: '',
    medicamentos_em_uso: '',
    cirurgias_anteriores: '',
    temperamento: '',
    habitos_alimentares: '',
    comportamentos_especiais: '',
  });

  useEffect(() => {
    const fetchTutors = async () => {
      const { data, error } = await supabase.from('usuarios_tutores').select('id, nome, email');
      if (error) {
        console.error("Erro ao buscar tutores:", error);
        toast({ variant: "destructive", title: "Erro ao buscar tutores", description: error.message });
      } else {
        setTutors(data.map(t => ({ value: t.id, label: `${t.nome} (${t.email})` })));
      }
    };
    fetchTutors();
  }, [toast]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handleSelectChange = (id, value) => {
    setFormData({ ...formData, [id]: value });
  };
  
  const handleTutorSelect = (tutorId) => {
    setSelectedTutorId(tutorId);
    setNewTutorEmail('');
  };

  const handleNewTutorEmailChange = (e) => {
    setNewTutorEmail(e.target.value);
    setSelectedTutorId('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (!selectedTutorId && !newTutorEmail) {
        toast({ variant: "destructive", title: "Tutor é obrigatório", description: "Selecione um tutor existente ou informe o e-mail de um novo tutor." });
        setLoading(false);
        return;
    }

    try {
      const qr_code_url_base = `${window.location.origin}/pet/`;
      
      let insertData = {
        ...formData,
        clinica_id: user.id,
        peso: formData.peso || null,
        data_nascimento: formData.data_nascimento || null,
      };
      
      if(selectedTutorId){
          insertData.tutor_id = selectedTutorId;
      } else {
          insertData.tutor_email = newTutorEmail;
      }

      const { data: newPet, error: petError } = await supabase
        .from('animais')
        .insert(insertData).select('id').single();
      
      if(petError) throw petError;
      
      const {error: updatePetError} = await supabase
        .from('animais')
        .update({qr_code_url: `${qr_code_url_base}${newPet.id}`})
        .eq('id', newPet.id);
        
      if (updatePetError) throw updatePetError;
      
      toast({ title: "Sucesso!", description: "Novo pet cadastrado com todos os detalhes." });
      onPetAdded();

    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro ao cadastrar pet",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 py-4 max-h-[70vh] overflow-y-auto pr-4">
      <h3 className="font-semibold text-lg border-b pb-2">Dados do Pet</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="nome">Nome do Pet</Label>
          <Input id="nome" value={formData.nome} onChange={handleChange} required />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="especie">Espécie</Label>
          <Input id="especie" value={formData.especie} onChange={handleChange} required />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="raca">Raça</Label>
          <Input id="raca" value={formData.raca} onChange={handleChange} required />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="data_nascimento">Data de Nascimento</Label>
          <Input id="data_nascimento" type="date" value={formData.data_nascimento} onChange={handleChange} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="sexo">Sexo</Label>
          <Select onValueChange={(value) => handleSelectChange('sexo', value)}>
            <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
            <SelectContent>
              <SelectItem value="Macho">Macho</SelectItem>
              <SelectItem value="Fêmea">Fêmea</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="peso">Peso (kg)</Label>
          <Input id="peso" type="number" step="0.1" value={formData.peso} onChange={handleChange} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="tamanho">Tamanho/Altura (cm)</Label>
          <Input id="tamanho" value={formData.tamanho} onChange={handleChange} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="cor">Cor/Pelagem</Label>
          <Input id="cor" value={formData.cor} onChange={handleChange} />
        </div>
      </div>

      <h3 className="font-semibold text-lg border-b pb-2 pt-4">Histórico de Saúde</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="grid gap-2 md:col-span-2">
          <Label htmlFor="doencas_cronicas">Doenças Anteriores ou Crônicas</Label>
          <Textarea id="doencas_cronicas" value={formData.doencas_cronicas} onChange={handleChange} />
        </div>
        <div className="grid gap-2 md:col-span-2">
          <Label htmlFor="alergias">Alergias Conhecidas</Label>
          <Textarea id="alergias" value={formData.alergias} onChange={handleChange} />
        </div>
        <div className="grid gap-2 md:col-span-2">
          <Label htmlFor="medicamentos_em_uso">Medicamentos em Uso</Label>
          <Textarea id="medicamentos_em_uso" value={formData.medicamentos_em_uso} onChange={handleChange} />
        </div>
        <div className="grid gap-2 md:col-span-2">
          <Label htmlFor="cirurgias_anteriores">Cirurgias ou Procedimentos Anteriores</Label>
          <Textarea id="cirurgias_anteriores" value={formData.cirurgias_anteriores} onChange={handleChange} />
        </div>
      </div>

      <h3 className="font-semibold text-lg border-b pb-2 pt-4">Informações Comportamentais</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="temperamento">Temperamento</Label>
          <Input id="temperamento" placeholder="Ex: Calmo, ansioso..." value={formData.temperamento} onChange={handleChange} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="habitos_alimentares">Hábitos Alimentares</Label>
          <Input id="habitos_alimentares" value={formData.habitos_alimentares} onChange={handleChange} />
        </div>
        <div className="grid gap-2 md:col-span-2">
          <Label htmlFor="comportamentos_especiais">Comportamentos Especiais</Label>
          <Textarea id="comportamentos_especiais" placeholder="Ex: Dificuldade de locomoção, cegueira..." value={formData.comportamentos_especiais} onChange={handleChange} />
        </div>
      </div>

      <h3 className="font-semibold text-lg pt-4 border-t">Tutor Responsável</h3>
      <Tabs defaultValue="existing-tutor" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="existing-tutor">Tutor Existente</TabsTrigger>
          <TabsTrigger value="new-tutor">Novo Tutor</TabsTrigger>
        </TabsList>
        <TabsContent value="existing-tutor" className="pt-4">
            <Label>Buscar Tutor</Label>
            <Combobox
                options={tutors}
                value={selectedTutorId}
                onSelect={handleTutorSelect}
                placeholder="Selecione um tutor..."
                searchPlaceholder="Buscar por nome ou email..."
                notFoundText="Nenhum tutor encontrado."
            />
        </TabsContent>
        <TabsContent value="new-tutor" className="pt-4">
            <Label htmlFor="new-tutor-email">E-mail do Novo Tutor</Label>
            <Input 
                id="new-tutor-email"
                type="email"
                placeholder="email.tutor@exemplo.com"
                value={newTutorEmail}
                onChange={handleNewTutorEmailChange}
            />
            <p className="text-xs text-muted-foreground mt-2">O pet será associado automaticamente quando o tutor se cadastrar com este e-mail.</p>
        </TabsContent>
      </Tabs>

      <Button type="submit" disabled={loading || (!selectedTutorId && !newTutorEmail)} className="mt-4 w-full">
        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Salvar Pet'}
      </Button>
    </form>
  );
};
  