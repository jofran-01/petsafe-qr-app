import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Helmet } from 'react-helmet';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const TutorIdCardsPage = () => {
    const { user } = useAuth();
    const { toast } = useToast();
    const navigate = useNavigate();
    const [pets, setPets] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchPets = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        try {
          const { data, error } = await supabase
            .from('animais')
            .select(`id, nome, especie, raca, foto_url`)
            .eq('tutor_id', user.id)
            .order('criado_em', { ascending: false });

          if (error) throw error;
          setPets(data);
        } catch (error) {
          toast({
            variant: "destructive",
            title: "Erro ao buscar seus pets",
            description: error.message,
          });
        } finally {
          setLoading(false);
        }
      }, [user, toast]);

      useEffect(() => {
        fetchPets();
      }, [fetchPets]);

    return (
        <>
            <Helmet>
                <title>Carteirinhas - PetSafe QR</title>
            </Helmet>
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">Carteirinhas dos Pets</h1>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>Selecione um Pet</CardTitle>
                    <CardDescription>
                        Escolha um dos seus pets para visualizar a carteirinha de identificação e saúde.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {loading ? (
                         <div className="flex justify-center items-center h-40">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {pets.length > 0 ? pets.map(pet => (
                                <Card key={pet.id} className="overflow-hidden cursor-pointer hover:border-primary transition-colors group" onClick={() => navigate(`/tutor/dashboard/pets/${pet.id}/carteirinha`)}>
                                    <div className="h-40 bg-muted overflow-hidden">
                                        <img src={pet.foto_url || "https://images.unsplash.com/photo-1586208437993-8e298d2f8d50"} alt={`Foto de ${pet.nome}`} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300" />
                                    </div>
                                    <div className="p-4">
                                        <h3 className="font-bold text-lg">{pet.nome}</h3>
                                        <p className="text-sm text-muted-foreground">{pet.especie}</p>
                                    </div>
                                </Card>
                            )) : (
                                <p className="col-span-full text-center text-muted-foreground py-8">
                                    Nenhum pet encontrado. <Button variant="link" className="p-0 h-auto" onClick={() => navigate('/tutor/dashboard/pets')}>Adicione um pet</Button> para começar.
                                </p>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>
        </>
    );
};

export default TutorIdCardsPage;