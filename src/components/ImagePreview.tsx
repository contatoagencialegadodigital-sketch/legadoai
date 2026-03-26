import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Image } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ImagePreviewProps {
  imageUrl: string | null;
}

export function ImagePreview({ imageUrl }: ImagePreviewProps) {
  const { toast } = useToast();

  const handleDownload = async () => {
    if (!imageUrl) return;

    try {
      const link = document.createElement('a');
      link.href = imageUrl;
      link.download = `image-ai-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "✅ Download iniciado",
        description: "Sua imagem está sendo baixada",
      });
    } catch (error) {
      toast({
        title: "❌ Erro no download",
        description: "Não foi possível baixar a imagem",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="p-6 bg-card/50 backdrop-blur-xl border-primary/20 h-full">
      <div className="flex flex-col items-center justify-center h-full space-y-6">
        {imageUrl ? (
          <>
            <div className="w-full rounded-lg overflow-hidden border border-border/50 shadow-elegant">
              <img 
                src={imageUrl} 
                alt="Imagem gerada" 
                className="w-full h-auto"
              />
            </div>
            
            <Button
              onClick={handleDownload}
              className="w-full gradient-primary glow-primary hover:opacity-90 transition-opacity"
              size="lg"
            >
              <Download className="mr-2 h-5 w-5" />
              Baixar Imagem
            </Button>
          </>
        ) : (
          <div className="text-center space-y-4">
            <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
              <Image className="w-12 h-12 text-primary" />
            </div>
            <div>
              <h3 className="text-2xl font-bold mb-2">Sua imagem aparecerá aqui</h3>
              <p className="text-muted-foreground">
                Comece gerando uma imagem com a ferramenta ao lado
              </p>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
