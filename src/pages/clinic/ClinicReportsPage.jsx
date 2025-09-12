import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Loader2 } from 'lucide-react';
import { Helmet } from 'react-helmet';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const ClinicReportsPage = () => {
    const { toast } = useToast();
    const { user } = useAuth();
    const [loadingPets, setLoadingPets] = useState(false);
    const [loadingActivity, setLoadingActivity] = useState(false);

    const handleExportPatientList = async () => {
        setLoadingPets(true);
        try {
            const { data: clinicPets, error: petsError } = await supabase
                .from('animais')
                .select('id, nome, especie, raca, idade, sexo, usuarios_tutores(nome, email, telefone)')
                .eq('clinica_id', user.id);

            if (petsError) throw petsError;

            if (clinicPets.length === 0) {
                toast({ title: "Nenhum paciente", description: "Não há pacientes vinculados à sua clínica para exportar." });
                return;
            }

            const doc = new jsPDF();
            doc.setFontSize(18);
            doc.text("Lista de Pacientes da Clínica", 14, 22);
            doc.setFontSize(11);
            doc.setTextColor(100);
            doc.text(`Relatório gerado em: ${new Date().toLocaleDateString()}`, 14, 29);

            const tableColumn = ["Nome", "Espécie", "Raça", "Idade", "Sexo", "Tutor", "Contato do Tutor"];
            const tableRows = [];

            clinicPets.forEach(pet => {
                const petData = [
                    pet.nome || 'N/A',
                    pet.especie || 'N/A',
                    pet.raca || 'N/A',
                    pet.idade ? `${pet.idade} anos` : 'N/A',
                    pet.sexo || 'N/A',
                    pet.usuarios_tutores?.nome || 'N/A',
                    `${pet.usuarios_tutores?.email || ''} / ${pet.usuarios_tutores?.telefone || ''}`
                ];
                tableRows.push(petData);
            });

            doc.autoTable({
                head: [tableColumn],
                body: tableRows,
                startY: 35,
            });
            
            doc.save('lista_pacientes.pdf');
            toast({ title: "Sucesso!", description: "A lista de pacientes foi exportada." });

        } catch (error) {
            toast({ variant: 'destructive', title: 'Erro ao exportar', description: error.message });
        } finally {
            setLoadingPets(false);
        }
    };

    const handleExportActivityReport = async () => {
        setLoadingActivity(true);
        try {
            const [consultationsRes, vaccinesRes, dewormingRes, antiparasiticsRes] = await Promise.all([
                supabase.from('consultas').select('*, animais(nome)').eq('clinica_id', user.id).order('data_consulta', { ascending: false }),
                supabase.from('vacinas').select('*, animais(nome)').eq('clinica_id', user.id).order('data_aplicacao', { ascending: false }),
                supabase.from('vermifugacao').select('*, animais(nome)').eq('clinica_id', user.id).order('data_aplicacao', { ascending: false }),
                supabase.from('antiparasitarios').select('*, animais(nome)').eq('clinica_id', user.id).order('data_aplicacao', { ascending: false }),
            ]);

            const doc = new jsPDF();
            let startY = 35;

            doc.setFontSize(18);
            doc.text("Relatório de Atividades da Clínica", 14, 22);
            doc.setFontSize(11);
            doc.setTextColor(100);
            doc.text(`Relatório gerado em: ${new Date().toLocaleDateString()}`, 14, 29);

            const addSection = (title, columns, data, dataMapper) => {
                if (data.length > 0) {
                    doc.setFontSize(14);
                    doc.text(title, 14, startY);
                    startY += 7;
                    doc.autoTable({
                        head: [columns],
                        body: data.map(dataMapper),
                        startY: startY,
                    });
                    startY = doc.lastAutoTable.finalY + 10;
                }
            };

            addSection(
                "Consultas",
                ["Data", "Pet", "Diagnóstico"],
                consultationsRes.data || [],
                item => [new Date(item.data_consulta).toLocaleDateString(), item.animais.nome, item.diagnostico || 'N/A']
            );

            addSection(
                "Vacinas Aplicadas",
                ["Data", "Pet", "Vacina", "Lote"],
                vaccinesRes.data || [],
                item => [new Date(item.data_aplicacao).toLocaleDateString(), item.animais.nome, item.nome_vacina, item.lote || 'N/A']
            );

            addSection(
                "Vermífugos Aplicados",
                ["Data", "Pet", "Produto"],
                dewormingRes.data || [],
                item => [new Date(item.data_aplicacao).toLocaleDateString(), item.animais.nome, item.produto]
            );

            addSection(
                "Antiparasitários Aplicados",
                ["Data", "Pet", "Produto"],
                antiparasiticsRes.data || [],
                item => [new Date(item.data_aplicacao).toLocaleDateString(), item.animais.nome, item.produto]
            );

            if (startY === 35) { // No data was added
                 toast({ title: "Nenhuma atividade", description: "Não há atividades registradas para gerar o relatório." });
                 setLoadingActivity(false);
                 return;
            }

            doc.save('relatorio_atividades.pdf');
            toast({ title: "Sucesso!", description: "O relatório de atividades foi exportado." });

        } catch (error) {
            toast({ variant: 'destructive', title: 'Erro ao exportar', description: error.message });
        } finally {
            setLoadingActivity(false);
        }
    };

    return (
        <>
            <Helmet>
                <title>Relatórios - PetSafe QR</title>
            </Helmet>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-3xl font-bold">Relatórios</h1>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Relatórios da Clínica</CardTitle>
                        <CardDescription>Exporte dados importantes sobre seus pacientes e atividades.</CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-4 md:grid-cols-2">
                        <Card className="p-4 flex flex-col justify-between">
                            <div>
                                <h3 className="font-semibold text-lg">Relatório de Atividade</h3>
                                <p className="text-sm text-muted-foreground">Gere um relatório de todas as consultas, vacinas e procedimentos em um período.</p>
                            </div>
                            <Button onClick={handleExportActivityReport} className="mt-4" variant="secondary" disabled={loadingActivity}>
                                {loadingActivity ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                                Gerar Relatório
                            </Button>
                        </Card>
                         <Card className="p-4 flex flex-col justify-between">
                            <div>
                                <h3 className="font-semibold text-lg">Lista de Pacientes</h3>
                                <p className="text-sm text-muted-foreground">Exporte uma lista completa de todos os pets vinculados à sua clínica.</p>
                            </div>
                            <Button onClick={handleExportPatientList} className="mt-4" variant="secondary" disabled={loadingPets}>
                               {loadingPets ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                               Exportar Lista
                            </Button>
                        </Card>
                    </CardContent>
                </Card>
            </div>
        </>
    );
};

export default ClinicReportsPage;