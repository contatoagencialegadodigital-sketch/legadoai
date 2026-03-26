import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface VideoPreviewProps {
  videoUrl: string | null;
}

export function VideoPreview({ videoUrl }: VideoPreviewProps) {
  const { toast } = useToast();
  
  const handleDownload = () => {
    if (!videoUrl) return;

    const timestamp = new Date().getTime();
    const filename = `sora-video-${timestamp}.mp4`;

    const link = document.createElement('a');
    link.href = videoUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Download iniciado",
      description: `Baixando ${filename}`,
    });
  };

  if (!videoUrl) {
    return (
      <Card className="p-8 bg-card/50 backdrop-blur-xl border-primary/20 flex flex-col items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
            <Play className="w-10 h-10 text-primary" />
          </div>
          <div>
            <h3 className="text-xl font-semibold mb-2">Seu vídeo aparecerá aqui</h3>
            <p className="text-muted-foreground">
              Comece gerando um vídeo com a ferramenta ao lado
            </p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 bg-card/50 backdrop-blur-xl border-primary/20">
      <div className="space-y-4">
        <div className="aspect-video rounded-lg overflow-hidden bg-black">
          <video
            src={videoUrl}
            controls
            className="w-full h-full"
            autoPlay
          >
            Seu navegador não suporta o elemento de vídeo.
          </video>
        </div>

        <Button
          onClick={handleDownload}
          className="w-full gradient-accent glow-accent hover:opacity-90 transition-opacity"
          size="lg"
        >
          <Download className="mr-2 h-5 w-5" />
          Baixar Vídeo
        </Button>
      </div>
    </Card>
  );
}
