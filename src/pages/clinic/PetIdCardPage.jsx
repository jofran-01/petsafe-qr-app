import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/customSupabaseClient';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowLeft, Download } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Helmet } from 'react-helmet';
import QRCode from 'qrcode.react';
import { toPng } from 'html-to-image';

const PetIdCardFront = React.forwardRef(({ pet }, ref) => {
    if(!pet) return null;
    return (
        <div ref={ref} className="bg-white rounded-xl shadow-lg p-6 w-[350px] h-[210px] mx-auto font-sans border-2 border-primary/50 text-gray-800 flex flex-col justify-between">
            <div className="flex justify-between items-start">
                <div className="flex items-center gap-2">
                    <img src="/favicon.svg" alt="Logo PetSafe QR" className="h-8 w-8" />
                    <span className="font-bold text-primary text-lg">PetSafe QR</span>
                </div>
                <div className="w-24 h-28 bg-gray-200 rounded-md flex-shrink-0 border-2 border-white shadow-md -mt-10">
                  <img className="w-full h-full object-cover rounded-md" alt={`Foto de ${pet.nome}`} src={pet.foto_url || 'https://ylyahsovfcolgdwisbll.supabase.co/storage/v1/object/public/pet-avatars/default-pet-avatar.png'} />
                </div>
            </div>
            
            <div>
                <p className="text-xs text-gray-500">NOME</p>
                <p className="font-bold text-2xl text-primary -mt-1">{pet.nome}</p>
                
                <div className="flex justify-between items-end mt-1 text-xs">
                    <div>
                        <p className="text-gray-500">TUTOR</p>
                        <p className="font-semibold text-base">{pet.usuarios_tutores.nome}</p>
                    </div>
                    <div>
                        <p className="text-gray-500">CONTATO</p>
                        <p className="font-semibold text-base">{pet.usuarios_tutores.telefone}</p>
                    </div>
                </div>
            </div>
        </div>
    );
});

const PetIdCardBack = React.forwardRef(({ pet }, ref) => {
    if(!pet) return null;
    return (
        <div ref={ref} className="bg-white rounded-xl shadow-lg p-6 w-[350px] h-[210px] mx-auto font-sans border-2 border-gray-300 text-gray-800 flex flex-col items-center justify-center">
            <p className="font-semibold mb-2">Acesse meu prontuário completo</p>
            <div className="bg-white p-2 rounded-lg border border-gray-300">
                {pet.qr_code_url && <QRCode value={pet.qr_code_url} size={128} fgColor="#333" />}
            </div>
            <p className="text-xs text-gray-500 mt-2 text-center">Escaneie o QR Code em caso de emergência <br/> ou para ver meu histórico de saúde.</p>
        </div>
    );
});


const PetIdCardPage = () => {
    const { id } = useParams();
    const { toast } = useToast();
    const navigate = useNavigate();
    const [pet, setPet] = useState(null);
    const [loading, setLoading] = useState(true);
    const [downloading, setDownloading] = useState(false);
    const frontCardRef = useRef();
    const backCardRef = useRef();
    
    const fetchPetDetails = useCallback(async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('animais')
                .select(`*, usuarios_tutores ( nome, email, telefone )`)
                .eq('id', id)
                .single();
            
            if (error) throw error;
            setPet(data);
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
        fetchPetDetails();
    }, [fetchPetDetails]);
    
    const handleDownload = useCallback(async (side) => {
        const ref = side === 'front' ? frontCardRef : backCardRef;
        if (!ref.current) return;
        setDownloading(true);
        try {
            const dataUrl = await toPng(ref.current, { cacheBust: true, pixelRatio: 2 });
            const link = document.createElement('a');
            link.download = `carteirinha-${pet?.nome?.toLowerCase().replace(' ','-') || 'pet'}-${side}.png`;
            link.href = dataUrl;
            link.click();
        } catch (err) {
            toast({
                variant: 'destructive',
                title: 'Erro no Download',
                description: 'Não foi possível gerar a imagem da carteirinha.',
            });
        } finally {
            setDownloading(false);
        }
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
            <div className="flex items-center justify-between mb-4">
                <Button variant="outline" onClick={() => navigate(-1)}>
                    <ArrowLeft className="mr-2 h-4 w-4"/> Voltar
                </Button>
            </div>
            <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-4">
                    <h2 className="text-xl font-bold text-center">Frente</h2>
                    <PetIdCardFront pet={pet} ref={frontCardRef} />
                    <Button onClick={() => handleDownload('front')} variant="outline" className="w-full" disabled={downloading}>
                        {downloading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                        Baixar Frente
                    </Button>
                </div>
                <div className="space-y-4">
                    <h2 className="text-xl font-bold text-center">Verso</h2>
                    <PetIdCardBack pet={pet} ref={backCardRef} />
                     <Button onClick={() => handleDownload('back')} variant="outline" className="w-full" disabled={downloading}>
                        {downloading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                        Baixar Verso
                    </Button>
                </div>
            </div>
        </>
    );
};

export default PetIdCardPage;