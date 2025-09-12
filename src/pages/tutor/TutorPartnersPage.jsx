import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, Bone, ToyBrick, ShoppingBag, ExternalLink, Loader2, Award, ChevronsUpDown, DollarSign } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const categories = [
  { name: 'Ração', slug: 'racao', icon: Bone },
  { name: 'Petiscos', slug: 'petiscos', icon: Bone },
  { name: 'Brinquedos', slug: 'brinquedos', icon: ToyBrick },
  { name: 'Acessórios', slug: 'acessorios', icon: ShoppingBag },
  { name: 'Higiene', slug: 'higiene', icon: ShoppingBag },
];

const mockStores = [
  { 
    name: 'Petz', 
    rating: 4.8,
    priceLevel: 3,
    url: 'https://www.petz.com.br/', 
    logoUrl: 'https://static.petz.com.br/images/logopetz-wt.png',
    description: 'A maior rede de pet shops do Brasil. Tudo para seu pet em um só lugar.',
    products: ['Rações', 'Petiscos', 'Brinquedos', 'Farmácia', 'Higiene', 'Royal Canin', 'Premier'],
    categories: ['racao', 'petiscos', 'brinquedos', 'acessorios', 'higiene'] 
  },
  { 
    name: 'Cobasi', 
    rating: 4.7, 
    priceLevel: 3,
    url: 'https://www.cobasi.com.br/', 
    logoUrl: 'https://static.cobasi.com.br/images/logo-cobasi.svg',
    description: 'O shopping do seu animal. Encontre produtos para cães, gatos, peixes e mais.',
    products: ['Rações', 'Acessórios', 'Casa e Jardim', 'Aquarismo', 'Royal Canin'],
    categories: ['racao', 'petiscos', 'brinquedos', 'acessorios', 'higiene'] 
  },
  { 
    name: 'Petlove', 
    rating: 4.9,
    priceLevel: 4, 
    url: 'https://www.petlove.com.br/', 
    logoUrl: 'https://www.petlove.com.br/static/images/logo/petlove.svg',
    description: 'Assinatura de produtos e o maior plano de saúde pet do país.',
    products: ['Assinaturas', 'Planos de Saúde', 'Brinquedos', 'Roupas', 'Premier'],
    categories: ['racao', 'petiscos', 'brinquedos', 'acessorios', 'higiene'] 
  },
  { 
    name: 'Zee.Dog', 
    rating: 4.6,
    priceLevel: 5,
    url: 'https://www.zeedog.com.br/', 
    logoUrl: 'https://www.zeedog.com.br/images/logo_zeedog_black.svg',
    description: 'Connecting Dogs and People. Acessórios com design e qualidade.',
    products: ['Coleiras', 'Guias', 'Peitorais', 'Camas'],
    categories: ['acessorios', 'brinquedos'] 
  },
];

const TutorPartnersPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [sortBy, setSortBy] = useState('rating');

  const handleSearch = (e) => {
    if (e) e.preventDefault();
    setIsSearching(true);
    
    // Simulate API call
    setTimeout(() => {
        let filteredStores = mockStores
        .filter(store => 
            selectedCategory ? store.categories.includes(selectedCategory) : true
        )
        .filter(store => {
            if (!searchTerm) return true;
            const lowerSearchTerm = searchTerm.toLowerCase();
            return (
                store.name.toLowerCase().includes(lowerSearchTerm) ||
                store.description.toLowerCase().includes(lowerSearchTerm) ||
                store.products.some(p => p.toLowerCase().includes(lowerSearchTerm))
            );
        });

        if (sortBy === 'rating') {
            filteredStores.sort((a, b) => b.rating - a.rating);
        } else if (sortBy === 'price_asc') {
            filteredStores.sort((a, b) => a.priceLevel - b.priceLevel);
        } else if (sortBy === 'price_desc') {
            filteredStores.sort((a, b) => b.priceLevel - a.priceLevel);
        }
        
        setSearchResults(filteredStores);
        setIsSearching(false);
    }, 500);
  };
  
  const handleCategoryClick = (categorySlug) => {
    setSelectedCategory(prev => {
        const newCategory = prev === categorySlug ? null : categorySlug;
        return newCategory;
    });
  }
  
  useEffect(() => {
    handleSearch();
  }, [selectedCategory, sortBy]);


  return (
    <>
      <Helmet>
        <title>Parceiros - PetSafe QR</title>
        <meta name="description" content="Encontre as melhores lojas e produtos para o seu pet com nossos parceiros." />
      </Helmet>
      <div className="space-y-8">
        <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight text-primary">Nossos Parceiros</h1>
            <p className="mt-2 text-lg text-muted-foreground">
                Encontre aqui as melhores e mais bem avaliadas lojas para cuidar do seu pet.
            </p>
        </div>

        <Card className="w-full max-w-3xl mx-auto shadow-lg sticky top-4 z-10">
          <CardHeader>
            <CardTitle>Encontre o Melhor para seu Pet</CardTitle>
            <CardDescription>Pesquise por nome da loja, marca ou categoria de produto.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSearch} className="flex flex-col gap-4">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="relative flex-grow">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <Input
                        type="search"
                        placeholder="Ex: Premier, Royal Canin, Petz..."
                        className="pl-10"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <Select value={sortBy} onValueChange={setSortBy}>
                        <SelectTrigger className="w-full md:w-[180px]">
                            <SelectValue placeholder="Ordenar por..." />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="rating"><Award className="mr-2 h-4 w-4 inline"/>Melhor Avaliação</SelectItem>
                            <SelectItem value="price_asc"><DollarSign className="mr-2 h-4 w-4 inline"/>Menor Preço</SelectItem>
                            <SelectItem value="price_desc"><DollarSign className="mr-2 h-4 w-4 inline"/>Maior Preço</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
               <div className="flex flex-wrap gap-2 justify-center pt-2">
                  {categories.map((category) => (
                    <Button
                        key={category.slug}
                        type="button"
                        variant={selectedCategory === category.slug ? 'secondary' : 'outline'}
                        onClick={() => handleCategoryClick(category.slug)}
                        className="rounded-full"
                    >
                        <category.icon className="mr-2 h-4 w-4" />
                        {category.name}
                    </Button>
                  ))}
                </div>
              <Button type="submit" className="w-full" disabled={isSearching}>
                {isSearching ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
                Pesquisar Melhores Lojas
              </Button>
            </form>
          </CardContent>
        </Card>
        
        {isSearching && searchResults.length === 0 ? (
             <div className="flex justify-center items-center h-40">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        ) : (
            <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
            >
                {searchResults.length > 0 ? searchResults.map((store, index) => (
                <motion.div
                    key={store.url}
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ delay: index * 0.05 }}
                >
                    <Card className="hover:shadow-xl transition-shadow flex flex-col h-full">
                    <CardHeader>
                        <div className="flex justify-between items-start gap-4">
                            <div className="flex-1">
                                <CardTitle className="text-xl text-primary">{store.name}</CardTitle>
                                <div className="flex items-center gap-2 mt-1">
                                    {sortBy === 'rating' && index === 0 && <Badge variant="success">Melhor Avaliação</Badge>}
                                    <Badge variant="outline">⭐ {store.rating.toFixed(1)}</Badge>
                                    <Badge variant="outline">{Array(store.priceLevel).fill('💲').join('')}</Badge>
                                </div>
                            </div>
                            <div className="w-16 h-16 bg-white rounded-md flex items-center justify-center p-1 border flex-shrink-0">
                                <img src={store.logoUrl} alt={`Logo ${store.name}`} className="max-w-full max-h-full object-contain" />
                            </div>
                        </div>
                        <CardDescription className="mt-2">{store.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-grow flex flex-col justify-between">
                         <div>
                            <p className="font-semibold text-sm mb-2">Principais Produtos e Marcas:</p>
                            <div className="flex flex-wrap gap-1">
                                {store.products.slice(0, 4).map(product => (
                                    <Badge key={product} variant="secondary">{product}</Badge>
                                ))}
                            </div>
                        </div>
                        <Button asChild className="w-full mt-4">
                        <a href={store.url} target="_blank" rel="noopener noreferrer">
                            Visitar Loja <ExternalLink className="ml-2 h-4 w-4" />
                        </a>
                        </Button>
                    </CardContent>
                    </Card>
                </motion.div>
                )) : (
                    <div className="md:col-span-2 lg:col-span-3 text-center py-16">
                        <p className="text-muted-foreground">Nenhuma loja encontrada para sua busca.</p>
                    </div>
                )}
            </motion.div>
            </AnimatePresence>
        )}
      </div>
    </>
  );
};

export default TutorPartnersPage;