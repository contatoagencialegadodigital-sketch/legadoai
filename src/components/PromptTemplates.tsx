import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sparkles } from "lucide-react";

interface PromptTemplatesProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectTemplate: (prompt: string) => void;
}

const TEMPLATES = [
  "Um golden retriever brincando em um campo de flores coloridas ao pôr do sol",
  "Ondas do oceano batendo contra falésias rochosas durante uma tempestade",
  "Time-lapse de nuvens se movendo através de um céu vibrante ao entardecer",
  "Close-up de um beija-flor pairando perto de uma flor de hibisco vermelha",
  "Um robô dançando graciosamente na chuva em uma rua da cidade",
  "Aurora boreal dançando sobre uma floresta nevada à noite",
  "Astronauta caminhando em Marte com tempestade de areia ao fundo",
  "Borboletas coloridas voando em câmera lenta em um jardim tropical",
  "Fogos de artifício explodindo sobre uma cidade iluminada à noite",
  "Gotas de água caindo em câmera super lenta criando ondulações",
];

export function PromptTemplates({ open, onOpenChange, onSelectTemplate }: PromptTemplatesProps) {
  const handleSelect = (template: string) => {
    onSelectTemplate(template);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Templates de Prompts
          </DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-3">
            {TEMPLATES.map((template, index) => (
              <Button
                key={index}
                variant="outline"
                className="w-full justify-start text-left h-auto py-4 px-4 hover:bg-primary/10 hover:border-primary/50 transition-all"
                onClick={() => handleSelect(template)}
              >
                <span className="text-sm">{template}</span>
              </Button>
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
