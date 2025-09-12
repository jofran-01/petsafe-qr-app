
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { PawPrint, ArrowLeft } from 'lucide-react';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const AuthLayout = ({ children, imageDescription, imageAlt, imageUrl, showImage = true }) => {
  const navigate = useNavigate();

  return (
    <div className={`w-full lg:grid ${showImage ? 'lg:grid-cols-2' : 'lg:grid-cols-1'} min-h-screen`}>
      <div className="relative flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <Button variant="ghost" className="absolute top-4 left-4" onClick={() => navigate('/')}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Voltar para o Início
        </Button>
        <motion.div 
            className="mx-auto grid w-[380px] gap-6"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
        >
          <div className="grid gap-2 text-center">
             <Link to="/" className="mb-4 inline-block">
                <PawPrint className="mx-auto h-12 w-12 text-primary" />
              </Link>
          </div>
           <Card className="border-none shadow-none bg-transparent">
             <CardContent className="p-0">
               {children}
            </CardContent>
          </Card>
        </motion.div>
      </div>
      {showImage && (
        <div className="hidden bg-muted lg:block">
          <img  
            alt={imageAlt}
            className="h-full w-full object-cover object-center dark:brightness-[0.7]" src={imageUrl} />
        </div>
      )}
    </div>
  );
};

export default AuthLayout;
