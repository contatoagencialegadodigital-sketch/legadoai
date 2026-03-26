import { Link } from "react-router-dom";
import { Video, Image, FileText, Sparkles } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const studios = [
  {
    title: "Vídeo Studio",
    description: "Transforme suas ideias em vídeos incríveis com o poder da IA",
    icon: Video,
    url: "/video",
    gradient: "from-primary/20 to-accent/20",
  },
  {
    title: "Imagem Studio",
    description: "Crie imagens impressionantes com inteligência artificial",
    icon: Image,
    url: "/image",
    gradient: "from-accent/20 to-primary/20",
  },
  {
    title: "Texto Studio",
    description: "Gere textos criativos e envolventes com IA avançada",
    icon: FileText,
    url: "/text",
    gradient: "from-primary/20 to-accent/20",
  },
];

export default function Home() {
  return (
    <div className="container mx-auto px-4 py-12">
      {/* Header */}
      <header className="text-center mb-16 space-y-4">
        <h1 className="text-6xl md:text-7xl font-bold tracking-tight">
          <span className="text-gradient animate-glow">
            Legado AI Studio
          </span>
        </h1>
        
        <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
          <Sparkles className="w-3 h-3 mr-1" />
          Powered by Legado Digital
        </Badge>
        
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto mt-4">
          Uma plataforma unificada para criação de vídeos, imagens e textos com inteligência artificial. 
          Escolha uma das opções abaixo para começar.
        </p>
      </header>

      {/* Studio Cards */}
      <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
        {studios.map((studio) => (
          <Link key={studio.title} to={studio.url}>
            <Card className="group hover:scale-105 transition-all duration-300 cursor-pointer border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-lg hover:shadow-primary/10">
              <CardHeader>
                <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${studio.gradient} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <studio.icon className="w-6 h-6 text-primary" />
                </div>
                <CardTitle className="text-2xl group-hover:text-primary transition-colors">
                  {studio.title}
                </CardTitle>
                <CardDescription className="text-base">
                  {studio.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center text-sm text-primary group-hover:translate-x-2 transition-transform">
                  Acessar estúdio →
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
