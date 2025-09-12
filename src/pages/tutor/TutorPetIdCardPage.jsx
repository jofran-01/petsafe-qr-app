import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/lib/customSupabaseClient';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowLeft, Download, Printer, Building, AlertTriangle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Helmet } from 'react-helmet';
import QRCode from 'qrcode';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import * as htmlToImage from 'html-to-image';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const PetIdCard = React.forwardRef(({ pet, qrCodeUrl }, ref) => {
    if(!pet) return null;
    return (
        <div ref={ref} className="bg-white text-gray-800 p-4 space-y-4 font-sans" id="pet-id-card-component">
             <Card className="rounded-xl shadow-lg p-6 max-w-sm mx-auto border-2 border-primary/50">
                <div className="flex justify-between items-center border-b-2 border-dashed border-primary/30 pb-3">
                    <div className="flex items-center gap-2">
                        <img src={pet.usuarios_clinicas?.logo_url || "/favicon.svg"} alt="Logo da Clínica ou PetSafe" className="h-10 w-auto max-w-[120px] object-contain" />
                    </div>
                    <span className="text-xs font-semibold text-gray-500 text-right">CARTEIRA DE IDENTIFICAÇÃO</span>
                </div>
                
                <div className="flex gap-4 mt-4">
                    <div className="w-28 h-32 bg-gray-200 rounded-md flex-shrink-0">
                      <img className="w-full h-full object-cover rounded-md" alt={`Foto de ${pet.nome}`} src={pet.foto_url || 'https://ylyahsovfcolgdwisbll.supabase.co/storage/v1/object/public/pet-avatars/default-pet-avatar.png'} />
                    </div>
                    <div className="flex-grow">
                        <p className="text-xs text-gray-500">NOME</p>
                        <p className="font-bold text-xl text-primary -mt-1">{pet.nome}</p>
                        
                        <div className="grid grid-cols-2 gap-x-4 gap-y-2 mt-2 text-xs">
                            <div>
                                <p className="text-gray-500">ESPÉCIE</p>
                                <p className="font-semibold">{pet.especie}</p>
                            </div>
                             <div>
                                <p className="text-gray-500">RAÇA</p>
                                <p className="font-semibold">{pet.raca}</p>
                            </div>
                            <div>
                                <p className="text-gray-500">IDADE</p>
                                <p className="font-semibold">{pet.idade ? `${pet.idade} anos` : 'N/A'}</p>
                            </div>
                            <div>
                                <p className="text-gray-500">SEXO</p>
                                <p className="font-semibold">{pet.sexo || 'N/A'}</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-3">
                    <p className="text-xs text-gray-500">TUTOR(A)</p>
                    <p className="font-bold text-lg">{pet.usuarios_tutores?.nome || 'Não informado'}</p>
                </div>
                
                <div className="flex justify-between items-end mt-3 border-t-2 border-dashed border-primary/30 pt-3">
                    <div>
                        <p className="text-xs text-gray-500">CONTATO DO TUTOR</p>
                        <p className="font-bold text-base">{pet.usuarios_tutores?.telefone || 'Não informado'}</p>
                        {pet.usuarios_clinicas && (
                            <div className="mt-2">
                                <p className="text-xs text-gray-500">CLÍNICA RESPONSÁVEL</p>
                                <p className="font-bold text-base">{pet.usuarios_clinicas.nome_clinica}</p>
                            </div>
                        )}
                    </div>
                    <div className="bg-white p-1 rounded-md border border-gray-300">
                        {qrCodeUrl && <img src={qrCodeUrl} alt="QR Code" width="64" height="64" />}
                    </div>
                </div>
            </Card>
        </div>
    );
});

const TutorPetIdCardPage = () => {
    const { id } = useParams();
    const { toast } = useToast();
    const navigate = useNavigate();
    const [pet, setPet] = useState(null);
    const [clinics, setClinics] = useState([]);
    const [qrCodeUrl, setQrCodeUrl] = useState('');
    const [loading, setLoading] = useState(true);
    const [isAssociating, setIsAssociating] = useState(false);
    const [isTutorProfileComplete, setIsTutorProfileComplete] = useState(true);
    const cardRef = useRef();
    
    const fetchPetData = useCallback(async () => {
        setLoading(true);
        try {
            const { data: petData, error: petError } = await supabase
                .from('animais')
                .select(`*, usuarios_tutores ( nome, email, telefone, endereco, cidade, estado, cep ), usuarios_clinicas ( id, nome_clinica, logo_url )`)
                .eq('id', id)
                .single();
            if (petError) throw petError;
            setPet(petData);

            const tutor = petData.usuarios_tutores;
            if(!tutor || !tutor.endereco || !tutor.cidade || !tutor.estado || !tutor.cep) {
                setIsTutorProfileComplete(false);
            } else {
                setIsTutorProfileComplete(true);
            }
            
            const urlForQRCode = `${window.location.origin}/pet/${petData.id}`;
            QRCode.toDataURL(urlForQRCode, { width: 64, margin: 1 }, (err, url) => {
                if (err) {
                    console.error("QR Code generation failed", err);
                    return;
                };
                setQrCodeUrl(url);
            });


            const { data: clinicsData, error: clinicsError } = await supabase
                .from('usuarios_clinicas')
                .select('id, nome_clinica, logo_url');
            if (clinicsError) throw clinicsError;
            setClinics(clinicsData);

        } catch (error) {
            toast({
                variant: 'destructive',
                title: 'Erro ao buscar dados para a carteirinha',
                description: error.message,
            });
        } finally {
            setLoading(false);
        }
    }, [id, toast]);

    useEffect(() => {
        fetchPetData();
    }, [fetchPetData]);

    const handleAssociateClinic = async (clinicId) => {
        setIsAssociating(true);
        try {
            const { error } = await supabase.from('animais').update({ clinica_id: clinicId }).eq('id', pet.id);
            if (error) throw error;
            toast({ title: 'Sucesso!', description: 'Clínica associada ao pet.' });
            fetchPetData();
        } catch (error) {
            toast({ variant: 'destructive', title: 'Erro ao associar clínica', description: error.message });
        } finally {
            setIsAssociating(false);
        }
    };
    
    const handlePrint = () => {
         if (!cardRef.current) return;
         const printContents = cardRef.current.innerHTML;
         
         const printWindow = window.open('', '', 'height=800,width=800');
         printWindow.document.write('<html><head><title>Imprimir Carteirinha</title>');
         printWindow.document.write('<link rel="stylesheet" href="/src/index.css">');
         printWindow.document.write('<style>body { background-color: white; -webkit-print-color-adjust: exact; } @page { size: auto; margin: 20px; }</style>');
         printWindow.document.write('</head><body >');
         printWindow.document.write(printContents);
         printWindow.document.write('</body></html>');
         printWindow.document.close();
         printWindow.focus();
         setTimeout(() => { printWindow.print(); printWindow.close(); }, 500);
    };

    const handleDownload = useCallback(() => {
        if (cardRef.current === null) {
          return;
        }

        htmlToImage.toPng(cardRef.current.querySelector('#pet-id-card-component'), { cacheBust: true, pixelRatio: 3, backgroundColor: 'white' })
          .then((dataUrl) => {
            const link = document.createElement('a');
            link.download = `carteirinha-${pet?.nome?.replace(/\s+/g, '-').toLowerCase() || 'pet'}.png`;
            link.href = dataUrl;
            link.click();
          })
          .catch((err) => {
            toast({ variant: 'destructive', title: 'Erro ao baixar', description: `Não foi possível gerar a imagem. ${err.message}` });
          });
      }, [pet, toast]);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-full">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
        );
    }
    
    return (
        <>
            <Helmet><title>Carteirinha de {pet?.nome || 'Pet'} - PetSafe QR</title></Helmet>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <Button variant="outline" onClick={() => navigate('/tutor/dashboard/pets')}>
                        <ArrowLeft className="mr-2 h-4 w-4"/> Voltar
                    </Button>
                    <div className="flex gap-2">
                        <Button onClick={handleDownload} variant="outline">
                            <Download className="mr-2 h-4 w-4" /> Baixar
                        </Button>
                        <Button onClick={handlePrint}>
                            <Printer className="mr-2 h-4 w-4" /> Imprimir
                        </Button>
                    </div>
                </div>

                {!isTutorProfileComplete && (
                     <Card className="border-yellow-500">
                        <CardHeader>
                            <CardTitle className="flex items-center text-yellow-600">
                                <AlertTriangle className="mr-2 h-5 w-5"/> Perfil Incompleto
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p>Seu perfil de tutor está incompleto. Para que a carteirinha tenha todas as informações em caso de emergência, por favor, complete seu endereço.</p>
                            <Button asChild className="mt-4">
                                <Link to="/tutor/dashboard/configuracoes">Completar Perfil Agora</Link>
                            </Button>
                        </CardContent>
                    </Card>
                )}

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center"><Building className="mr-2 h-5 w-5"/>Clínica Responsável</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {pet?.clinica_id ? (
                            <p>Clínica associada: <strong>{pet.usuarios_clinicas?.nome_clinica || 'Carregando...'}</strong></p>
                        ) : (
                            <p className="text-muted-foreground">Este animal ainda não tem uma clínica responsável associada.</p>
                        )}
                        <div className="mt-4">
                            <Select onValueChange={handleAssociateClinic} disabled={isAssociating} value={pet?.clinica_id || ''}>
                                <SelectTrigger className="w-full md:w-[300px]">
                                    <SelectValue placeholder="Associar ou trocar clínica..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {clinics.map(clinic => (
                                        <SelectItem key={clinic.id} value={clinic.id}>{clinic.nome_clinica}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </CardContent>
                </Card>

                <div className="flex justify-center" ref={cardRef}>
                     <PetIdCard pet={pet} qrCodeUrl={qrCodeUrl} />
                </div>
            </div>
        </>
    );
};

export default TutorPetIdCardPage;