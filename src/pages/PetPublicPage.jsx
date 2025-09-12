
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/lib/customSupabaseClient';
import { Loader2, Syringe, Pill, Stethoscope, FileText, Download, Dog } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Helmet } from 'react-helmet';
import QRCode from 'qrcode';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import jsPDF from 'jspdf';
import { Button } from '@/components/ui/button';

const SectionCard = ({ title, icon, children }) => (
    <Card>
        <CardHeader>
            <CardTitle className="flex items-center text-lg text-primary">
                {icon}
                <span className="ml-2">{title}</span>
            </CardTitle>
        </CardHeader>
        <CardContent>
            {children}
        </CardContent>
    </Card>
);

const PetPublicPage = () => {
    const { id } = useParams();
    const { toast } = useToast();
    const [pet, setPet] = useState(null);
    const [records, setRecords] = useState({ vaccines: [], deworming: [], antiparasitics: [], procedures: [] });
    const [loading, setLoading] = useState(true);
    const [qrCodeUrl, setQrCodeUrl] = useState('');
    const reportRef = useRef(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const { data: petData, error: petError } = await supabase
                .from('view_prontuario_completo')
                .select('*')
                .eq('animal_id', id)
                .single();
            if (petError) throw petError;
            setPet(petData);

            const urlForQRCode = `${window.location.origin}/pet/${id}`;
            QRCode.toDataURL(urlForQRCode, { width: 80, margin: 1 }, (err, url) => {
                if (err) console.error(err);
                setQrCodeUrl(url);
            });

            const [vaccinesRes, dewormingRes, antiparasiticsRes, proceduresRes] = await Promise.all([
                supabase.from('vacinas').select('*').eq('animal_id', id),
                supabase.from('vermifugacao').select('*').eq('animal_id', id),
                supabase.from('antiparasitarios').select('*').eq('animal_id', id),
                supabase.from('consultas').select('*').eq('animal_id', id).order('data_consulta', { ascending: false })
            ]);

            if (vaccinesRes.error) throw vaccinesRes.error;
            if (dewormingRes.error) throw dewormingRes.error;
            if (antiparasiticsRes.error) throw antiparasiticsRes.error;
            if (proceduresRes.error) throw proceduresRes.error;

            setRecords({
                vaccines: vaccinesRes.data,
                deworming: dewormingRes.data,
                antiparasitics: antiparasiticsRes.data,
                procedures: proceduresRes.data
            });

        } catch (error) {
            toast({
                variant: 'destructive',
                title: 'Erro ao buscar dados do pet',
                description: error.message,
            });
        } finally {
            setLoading(false);
        }
    }, [id, toast]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleExportPDF = () => {
        const doc = new jsPDF();
        const margin = 15;
        let y = margin;

        doc.setFontSize(22);
        doc.setFont(undefined, 'bold');
        doc.text(`Prontuário de ${pet.nome_animal}`, margin, y);
        y += 15;
        
        doc.setFontSize(12);
        doc.setFont(undefined, 'normal');

        const addSection = (title, content) => {
            doc.setFontSize(16);
            doc.setFont(undefined, 'bold');
            doc.text(title, margin, y);
            y += 8;
            doc.setFontSize(11);
            doc.setFont(undefined, 'normal');
            content();
            y += 10;
        };
        
        addSection("Informações Básicas", () => {
             const basicInfo = `Espécie: ${pet.especie}\nRaça: ${pet.raca}\nIdade: ${pet.idade} anos\nSexo: ${pet.sexo}\nPeso: ${pet.peso || 'N/A'} kg\nCor: ${pet.cor || 'N/A'}`;
             doc.text(basicInfo, margin, y);
             y += 30;
        });

        addSection("Informações do Tutor", () => {
            const tutorInfo = `Nome: ${pet.nome_tutor}\nTelefone: ${pet.telefone_tutor}\nEndereço: ${pet.endereco_tutor || 'N/A'}`;
            doc.text(tutorInfo, margin, y);
            y += 20;
        });

        addSection("Vacinas", () => {
            records.vaccines.forEach(v => {
                doc.text(`- ${v.nome_vacina} (Aplicada em: ${new Date(v.data_aplicacao).toLocaleDateString()})`, margin, y);
                y += 7;
            });
            if (records.vaccines.length === 0) { doc.text("Nenhum registro.", margin, y); y += 7; }
        });
        
        // ... add more sections for other records

        doc.save(`prontuario_${pet.nome_animal}.pdf`);
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen bg-background">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                <p className="ml-4 text-lg">Carregando prontuário...</p>
            </div>
        );
    }
    
    if (!pet) {
        return (
            <div className="flex justify-center items-center h-screen bg-background">
                <p className="text-lg text-destructive">Pet não encontrado.</p>
            </div>
        );
    }

    return (
        <>
            <Helmet><title>Prontuário de {pet.nome_animal} - PetSafe QR</title></Helmet>
            <div className="container mx-auto max-w-4xl p-4 sm:p-6 lg:p-8" ref={reportRef}>
                 <div className="flex justify-between items-center mb-6">
                    <h1 className="text-3xl md:text-4xl font-bold">Prontuário Digital</h1>
                    <Button onClick={handleExportPDF}><Download className="mr-2 h-4 w-4" /> Exportar PDF</Button>
                </div>
                <Card className="mb-6">
                    <CardHeader className="flex flex-col md:flex-row items-center gap-6 text-center md:text-left">
                        <img className="w-32 h-32 rounded-full object-cover border-4 border-primary shadow-lg" alt={`Foto de ${pet.nome_animal}`} src={pet.foto_url || 'https://ylyahsovfcolgdwisbll.supabase.co/storage/v1/object/public/pet-avatars/default-pet-avatar.png'} />
                        <div className="flex-1">
                            <CardTitle className="text-4xl font-bold text-primary">{pet.nome_animal}</CardTitle>
                            <CardDescription className="text-lg">{pet.especie} - {pet.raca}</CardDescription>
                            <div className="flex gap-4 justify-center md:justify-start mt-2">
                                <Badge variant="secondary">{pet.idade ? `${pet.idade} anos` : 'Idade N/A'}</Badge>
                                <Badge variant="secondary">{pet.sexo || 'Sexo N/A'}</Badge>
                                <Badge variant="secondary">{pet.peso ? `${pet.peso} kg` : 'Peso N/A'}</Badge>
                                <Badge variant="secondary">{pet.cor || 'Cor N/A'}</Badge>
                            </div>
                        </div>
                        <div className="p-2 bg-white rounded-lg border">
                           {qrCodeUrl && <img src={qrCodeUrl} alt="QR Code" />}
                        </div>
                    </CardHeader>
                </Card>

                <div className="grid md:grid-cols-2 gap-6">
                    <SectionCard title="Informações do Tutor" icon={<Dog className="h-5 w-5"/>}>
                        <p><strong>Nome:</strong> {pet.nome_tutor}</p>
                        <p><strong>Telefone:</strong> {pet.telefone_tutor}</p>
                        <p><strong>Endereço:</strong> {pet.endereco_tutor || 'Não informado'}</p>
                    </SectionCard>

                    <SectionCard title="Clínica Responsável" icon={<Stethoscope className="h-5 w-5"/>}>
                        <p><strong>Nome:</strong> {pet.nome_clinica || 'Nenhuma clínica associada'}</p>
                    </SectionCard>

                    <SectionCard title="Vacinas" icon={<Syringe className="h-5 w-5"/>}>
                       {records.vaccines.length > 0 ? records.vaccines.map(v => (
                           <div key={v.id} className="mb-2 pb-2 border-b last:border-b-0">
                               <p><strong>{v.nome_vacina}</strong></p>
                               <p className="text-sm text-muted-foreground">Aplicação: {new Date(v.data_aplicacao).toLocaleDateString()} | Próxima: {v.data_vencimento ? new Date(v.data_vencimento).toLocaleDateString() : 'N/A'}</p>
                           </div>
                       )) : <p className="text-muted-foreground">Nenhum registro.</p>}
                    </SectionCard>

                    <SectionCard title="Vermífugos" icon={<Pill className="h-5 w-5"/>}>
                        {records.deworming.length > 0 ? records.deworming.map(d => (
                            <div key={d.id} className="mb-2 pb-2 border-b last:border-b-0">
                                <p><strong>{d.produto}</strong></p>
                                <p className="text-sm text-muted-foreground">Aplicação: {new Date(d.data_aplicacao).toLocaleDateString()} | Próxima: {d.proxima_dose ? new Date(d.proxima_dose).toLocaleDateString() : 'N/A'}</p>
                            </div>
                        )) : <p className="text-muted-foreground">Nenhum registro.</p>}
                    </SectionCard>

                     <SectionCard title="Antiparasitários" icon={<Pill className="h-5 w-5"/>}>
                        {records.antiparasitics.length > 0 ? records.antiparasitics.map(a => (
                            <div key={a.id} className="mb-2 pb-2 border-b last:border-b-0">
                                <p><strong>{a.produto}</strong></p>
                                <p className="text-sm text-muted-foreground">Aplicação: {new Date(a.data_aplicacao).toLocaleDateString()} | Próxima: {a.proxima_dose ? new Date(a.proxima_dose).toLocaleDateString() : 'N/A'}</p>
                            </div>
                        )) : <p className="text-muted-foreground">Nenhum registro.</p>}
                    </SectionCard>

                    <SectionCard title="Consultas e Procedimentos" icon={<Stethoscope className="h-5 w-5"/>}>
                        {records.procedures.length > 0 ? records.procedures.map(p => (
                             <div key={p.id} className="mb-2 pb-2 border-b last:border-b-0">
                                <p><strong>Consulta em {new Date(p.data_consulta).toLocaleDateString()}</strong></p>
                                <p className="text-sm text-muted-foreground"><strong>Diagnóstico:</strong> {p.diagnostico || 'N/A'}</p>
                                <p className="text-sm text-muted-foreground"><strong>Tratamento:</strong> {p.tratamento || 'N/A'}</p>
                            </div>
                        )) : <p className="text-muted-foreground">Nenhum registro.</p>}
                         <p className="mt-4"><strong>Cirurgias Anteriores:</strong> {pet.cirurgias_anteriores || 'Nenhum registro.'}</p>
                    </SectionCard>
                </div>
            </div>
        </>
    );
};

export default PetPublicPage;
