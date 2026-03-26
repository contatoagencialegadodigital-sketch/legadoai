import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Sparkles, ArrowRight, Sun, Moon } from 'lucide-react';
import { useTheme } from '@/components/ThemeProvider';
import legadoLogo from '@/assets/legado-logo.png';

export default function Auth() {
  const navigate = useNavigate();
  const { resolvedTheme, setTheme } = useTheme();

  const handleStart = () => {
    navigate('/');
  };

  const toggleTheme = () => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-background relative overflow-hidden">
      {/* Theme Toggle */}
      <button
        onClick={toggleTheme}
        className="absolute top-6 right-6 p-3 rounded-xl bg-card/50 border border-border/50 text-muted-foreground hover:text-foreground hover:bg-card transition-all"
        title={resolvedTheme === 'dark' ? 'Mudar para modo claro' : 'Mudar para modo escuro'}
      >
        {resolvedTheme === 'dark' ? (
          <Sun className="w-5 h-5" />
        ) : (
          <Moon className="w-5 h-5" />
        )}
      </button>
      {/* Background gradients */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-md text-center space-y-8">
        {/* Logo */}
        <div className="space-y-4">
          <div className="flex justify-center">
            <img 
              src={legadoLogo} 
              alt="Legado AI" 
              className="h-32 w-auto object-contain"
              style={{ filter: 'brightness(1.3)' }}
            />
          </div>
          
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm text-primary font-medium">Powered by OpenAI</span>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-4">
          <h1 className="text-3xl font-semibold text-foreground">
            Legado AI Studio
          </h1>
          <p className="text-muted-foreground max-w-sm mx-auto">
            Crie textos e imagens com inteligência artificial. 
            Tudo em uma única plataforma.
          </p>
        </div>

        {/* CTA */}
        <div className="pt-4">
          <Button 
            onClick={handleStart} 
            size="lg"
            className="h-12 px-8 text-base gap-2 rounded-full bg-primary hover:bg-primary/90"
          >
            Começar a usar
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>


      </div>
    </div>
  );
}
