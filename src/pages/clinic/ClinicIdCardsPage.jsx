import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Loader2, Search, FileText } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Helmet } from 'react-helmet';

const ClinicIdCardsPage = () => {
    const { user } = useAuth();
    const { toast } = useToast();
    const navigate = useNavigate();
    const [pets, setPets] = useState([]);
    const [allPets, setAllPets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    const fetchPets = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        try {
            const { data: petIds, error: petIdsError } = await supabase
                .from('agendamentos')
                .select('animal_id')
                .eq('clinica_id', user.id);

            if (petIdsError) throw petIdsError;

            // ================== CORREÇÃO APLICADA AQUI ==================
            // 1. Mapeia os IDs como antes.
            // 2. Adiciona .filter(Boolean) para remover todos os valores "falsy" (null, undefined, etc.).
            const uniquePetIds = [...new Set(petIds.map(p => p.animal_id).filter(Boolean))];
            // ============================================================

            if (uniquePetIds.length === 0) {
                setPets([]);
                setAllPets([]);
                setLoading(false);
                return;
            }

            const { data, error } = await supabase
                .from('animais')
                .select(`id, nome, especie, raca, usuarios_tutores(nome)`)
                .in('id', uniquePetIds)
                .order('nome', { ascending: true });
            
            if (error) throw error;
            setAllPets(data);
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

    useEffect(() => {
        if (!searchTerm) {
            setPets(allPets);
            return;
        }
        const lowercasedFilter = searchTerm.toLowerCase();
        const filteredData = allPets.filter(item => {
            return Object.values(item).some(val =>
                String(val).toLowerCase().includes(lowercasedFilter)
            ) || item.usuarios_tutores?.nome.toLowerCase().includes(lowercasedFilter);
        });
        setPets(filteredData);
    }, [searchTerm, allPets]);

    return (
        <>
            <Helmet>
                <title>Carteirinhas - PetSafe QR</title>
            </Helmet>
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">Gerar Carteirinhas</h1>
            </div>
            
            <Card>
                <CardHeader>
                    <CardTitle>Buscar Pet</CardTitle>
                    <CardDescription>Encontre um pet para visualizar ou gerar a sua carteirinha de identificação.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="relative mb-4">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            type="search"
                            placeholder="Buscar por nome, raça ou tutor..."
                            className="pl-8 sm:w-[300px] md:w-[200px] lg:w-[300px]"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    {loading ? (
                        <div className="flex justify-center items-center h-40">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    ) : (
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {pets.length > 0 ? (
                                pets.map(pet => (
                                    <Card key={pet.id}>
                                        <CardHeader>
                                            <CardTitle>{pet.nome}</CardTitle>
                                            <CardDescription>{pet.especie} - {pet.raca}</CardDescription>
                                        </CardHeader>
                                        <CardContent>
                                            <p className="text-sm text-muted-foreground">Tutor: {pet.usuarios_tutores?.nome || 'N/A'}</p>
                                            <Button className="w-full mt-4" onClick={() => navigate(`/dashboard/pets/${pet.id}/carteirinha`)}>
                                                <FileText className="mr-2 h-4 w-4"/> Gerar Carteirinha
                                            </Button>
                                        </CardContent>
                                    </Card>
                                ))
                            ) : (
                                <div className="col-span-full text-center py-10">
                                    <p className="text-muted-foreground">Nenhum pet encontrado com os critérios de busca.</p>
                                </div>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>
        </>
    );
};

export default ClinicIdCardsPage;
