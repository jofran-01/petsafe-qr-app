import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { PawPrint, ShieldCheck, QrCode, Stethoscope, User, UserPlus } from 'lucide-react';
import { Helmet } from 'react-helmet';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const LandingPage = () => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: 'spring',
        stiffness: 100,
      },
    },
  };

  return (
    <>
      <Helmet>
        <title>PetSafe QR - Início</title>
        <meta name="description" content="Bem-vindo ao PetSafe QR. A plataforma moderna para gestão de pets, conectando clínicas, tutores e animais através de tecnologia QR." />
        <meta property="og:title" content="PetSafe QR - Início" />
        <meta property="og:description" content="Bem-vindo ao PetSafe QR. A plataforma moderna para gestão de pets, conectando clínicas, tutores e animais através de tecnologia QR." />
      </Helmet>
      <div className="min-h-screen bg-background text-foreground">
        <header className="container mx-auto flex h-20 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <PawPrint className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold">PetSafe QR</span>
          </div>
          <nav className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost">
                  <User className="mr-2 h-4 w-4" />
                  Login
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem asChild>
                  <Link to="/login">Sou uma Clínica</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/tutor/login">Sou um Tutor</Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Cadastrar
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem asChild>
                  <Link to="/cadastro">Sou uma Clínica</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/tutor/cadastro">Sou um Tutor</Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

          </nav>
        </header>

        <main>
          <motion.section
            className="container mx-auto flex flex-col items-center justify-center px-4 py-20 text-center"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <motion.h1
              className="text-4xl font-extrabold tracking-tight md:text-6xl"
              variants={itemVariants}
            >
              Gestão Inteligente para um Cuidado{' '}
              <span className="bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">
                Completo
              </span>
            </motion.h1>
            <motion.p
              className="mt-6 max-w-2xl text-lg text-muted-foreground"
              variants={itemVariants}
            >
              O PetSafe QR conecta clínicas, tutores e pets através de uma plataforma moderna, segura e fácil de usar. Simplifique a gestão, fortaleça o cuidado.
            </motion.p>
            <motion.div
              className="mt-8 flex flex-wrap justify-center gap-4"
              variants={itemVariants}
            >
               <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="lg">Comece Agora</Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem asChild>
                    <Link to="/cadastro">Cadastrar Clínica</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/tutor/cadastro">Cadastrar Tutor</Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button size="lg" variant="outline" onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}>
                Saiba Mais
              </Button>
            </motion.div>
          </motion.section>

          <section className="py-20">
            <div className="container mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                <div className="px-4">
                    <h2 className="text-3xl font-bold mb-4">A plataforma completa para sua clínica</h2>
                    <p className="text-muted-foreground mb-6">Modernize seu atendimento com ferramentas pensadas para o dia a dia veterinário. Ofereça segurança e praticidade para seus clientes e equipe.</p>
                    <div className="space-y-4">
                        <div className="flex items-start gap-4">
                            <div className="flex-shrink-0 flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary"><QrCode className="h-6 w-6" /></div>
                            <div>
                                <h3 className="font-semibold">Identificação Digital</h3>
                                <p className="text-sm text-muted-foreground">Gere carteirinhas com QR Code para acesso rápido a informações cruciais.</p>
                            </div>
                        </div>
                         <div className="flex items-start gap-4">
                            <div className="flex-shrink-0 flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary"><Stethoscope className="h-6 w-6" /></div>
                            <div>
                                <h3 className="font-semibold">Agendamento Online</h3>
                                <p className="text-sm text-muted-foreground">Permita que tutores agendem consultas de forma simples e rápida pelo portal.</p>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="px-4">
                    <img  class="rounded-lg shadow-xl w-full h-auto object-cover" alt="Veterinária sorrindo enquanto segura um cachorro da raça golden retriever" src="https://images.unsplash.com/photo-1677339576661-c51dd4d1351f" />
                </div>
            </div>
          </section>

          <section id="features" className="bg-secondary py-20">
            <div className="container mx-auto px-4">
              <h2 className="mb-12 text-center text-3xl font-bold">
                Por que escolher o PetSafe QR?
              </h2>
              <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
                <div className="flex flex-col items-center text-center">
                  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <QrCode className="h-8 w-8" />
                  </div>
                  <h3 className="text-xl font-semibold">Identificação Rápida</h3>
                  <p className="mt-2 text-muted-foreground">
                    Carteirinhas com QR Code para acesso instantâneo às informações vitais do pet em qualquer situação.
                  </p>
                </div>
                <div className="flex flex-col items-center text-center">
                  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <ShieldCheck className="h-8 w-8" />
                  </div>
                  <h3 className="text-xl font-semibold">Gestão Centralizada</h3>
                  <p className="mt-2 text-muted-foreground">
                    Painel completo para clínicas gerenciarem cadastros, históricos médicos e agendamentos de forma eficiente.
                  </p>
                </div>
                <div className="flex flex-col items-center text-center">
                  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <PawPrint className="h-8 w-8" />
                  </div>
                  <h3 className="text-xl font-semibold">Conexão com Tutores</h3>
                  <p className="mt-2 text-muted-foreground">
                    Facilite a vida dos tutores com agendamentos online e acesso rápido ao histórico de saúde de seus companheiros.
                  </p>
                </div>
              </div>
            </div>
          </section>

           <section className="py-20">
            <div className="container mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                 <div className="px-4 md:order-2">
                    <h2 className="text-3xl font-bold mb-4">Cuidado e Tecnologia na Palma da Mão</h2>
                    <p className="text-muted-foreground mb-6">Nossa plataforma foi desenhada para ser intuitiva e poderosa, garantindo que você passe mais tempo cuidando dos animais e menos tempo com burocracia.</p>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button>Junte-se a Nós</Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem asChild>
                          <Link to="/cadastro">Cadastrar Clínica</Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link to="/tutor/cadastro">Cadastrar Tutor</Link>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                </div>
                <div className="px-4 md:order-1">
                    <img  class="rounded-lg shadow-xl w-full h-auto object-cover" alt="Close-up de um gato curioso olhando para a câmera" src="https://images.unsplash.com/photo-1566023497729-78af8c1f0e62" />
                </div>
            </div>
          </section>

        </main>

        <footer className="bg-background py-8 border-t">
          <div className="container mx-auto px-4 text-center text-muted-foreground">
            <p>&copy; {new Date().getFullYear()} PetSafe QR. Todos os direitos reservados.</p>
          </div>
        </footer>
      </div>
    </>
  );
};

export default LandingPage;