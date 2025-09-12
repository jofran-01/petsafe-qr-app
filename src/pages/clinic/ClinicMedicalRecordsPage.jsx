import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Loader2, Search, ClipboardList } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Helmet } from 'react-helmet';

const ClinicMedicalRecordsPage = () => {
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
            const { data, error } = await supabase
                .from('animais')
                .select(`id, nome, especie, raca, usuarios_tutores(nome)`)
                .eq('clinica_id', user.id)
                .order('nome', { ascending: true });
            
            if (error) throw error;

            setAllPets(data);
            setPets(data);

        } catch (error) {
            toast({ variant: 'destructive', title: 'Erro ao buscar prontuários', description: error.message });
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
            return (item.nome?.toLowerCase().includes(lowercasedFilter)) ||
                   (item.raca?.toLowerCase().includes(lowercasedFilter)) ||
                   (item.usuarios_tutores?.nome.toLowerCase().includes(lowercasedFilter));
        });
        setPets(filteredData);
    }, [searchTerm, allPets]);

    return (
        <>
            <Helmet>
                <title>Prontuários - PetSafe QR</title>
            </Helmet>
            <Card>
                <CardHeader>
                    <CardTitle>Prontuários dos Pacientes</CardTitle>
                    <CardDescription>Encontre um paciente para visualizar ou atualizar seu prontuário médico.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="relative mb-6">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <Input
                            type="search"
                            placeholder="Buscar por nome, raça ou tutor..."
                            className="pl-10 sm:w-full md:w-1/3 lg:w-1/4"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    {loading ? (
                        <div className="flex justify-center items-center h-60">
                            <Loader2 className="h-10 w-10 animate-spin text-primary" />
                        </div>
                    ) : (
                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                            {pets.length > 0 ? (
                                pets.map(pet => (
                                    <Card key={pet.id} className="hover:shadow-md transition-shadow">
                                        <CardHeader>
                                            <CardTitle>{pet.nome}</CardTitle>
                                            <CardDescription>{pet.especie} - {pet.raca}</CardDescription>
                                        </CardHeader>
                                        <CardContent>
                                            <p className="text-sm text-muted-foreground">Tutor: {pet.usuarios_tutores?.nome || 'N/A'}</p>
                                            <Button className="w-full mt-4" onClick={() => navigate(`/dashboard/prontuarios/${pet.id}`)}>
                                                <ClipboardList className="mr-2 h-4 w-4"/> Acessar Prontuário
                                            </Button>
                                        </CardContent>
                                    </Card>
                                ))
                            ) : (
                                <div className="col-span-full text-center py-16">
                                    <p className="text-muted-foreground text-lg">Nenhum paciente encontrado.</p>
                                    <p className="text-sm text-muted-foreground">Tente um termo de busca diferente ou cadastre um novo paciente.</p>
                                </div>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>
        </>
    );
};

export default ClinicMedicalRecordsPage;