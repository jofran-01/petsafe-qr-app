import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, ClipboardList } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Helmet } from 'react-helmet';
import { Button } from '@/components/ui/button';

const TutorMedicalRecordsPage = () => {
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
                .order('nome', { ascending: true });
            
            if (error) throw error;
            setPets(data);

        } catch (error) {
            toast({ variant: 'destructive', title: 'Erro ao buscar pets', description: error.message });
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
                <title>Prontuários - PetSafe QR</title>
            </Helmet>
            <Card>
                <CardHeader>
                    <CardTitle>Prontuários dos Meus Pets</CardTitle>
                    <CardDescription>Selecione um pet para visualizar seu histórico de saúde.</CardDescription>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex justify-center items-center h-60">
                            <Loader2 className="h-10 w-10 animate-spin text-primary" />
                        </div>
                    ) : (
                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                            {pets.length > 0 ? (
                                pets.map(pet => (
                                    <Card key={pet.id} className="hover:shadow-md transition-shadow">
                                        <CardHeader className="flex-row gap-4 items-center">
                                            <img
                                              src={pet.foto_url || 'https://ylyahsovfcolgdwisbll.supabase.co/storage/v1/object/public/pet-avatars/default-pet-avatar.png'}
                                              alt={`Foto de ${pet.nome}`}
                                              className="w-16 h-16 rounded-full object-cover border-2 border-primary"
                                            />
                                            <div>
                                                <CardTitle>{pet.nome}</CardTitle>
                                                <CardDescription>{pet.especie} - {pet.raca}</CardDescription>
                                            </div>
                                        </CardHeader>
                                        <CardContent>
                                            <Button className="w-full mt-4" onClick={() => navigate(`/tutor/dashboard/prontuarios/${pet.id}`)}>
                                                <ClipboardList className="mr-2 h-4 w-4"/> Acessar Prontuário
                                            </Button>
                                        </CardContent>
                                    </Card>
                                ))
                            ) : (
                                <div className="col-span-full text-center py-16">
                                    <p className="text-muted-foreground text-lg">Nenhum pet encontrado.</p>
                                    <p className="text-sm text-muted-foreground">Cadastre um pet para começar a gerenciar seu histórico de saúde.</p>
                                    <Button className="mt-4" onClick={() => navigate('/tutor/dashboard/pets')}>Cadastrar Pet</Button>
                                </div>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>
        </>
    );
};

export default TutorMedicalRecordsPage;