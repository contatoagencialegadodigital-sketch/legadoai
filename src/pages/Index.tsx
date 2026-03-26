import { useState } from "react";
import { VideoGenerator } from "@/components/VideoGenerator";
import { VideoPreview } from "@/components/VideoPreview";
import { Badge } from "@/components/ui/badge";
import { Sparkles } from "lucide-react";

const Index = () => {
  const [videoUrl, setVideoUrl] = useState<string | null>(null);

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Animated background */}
      <div className="fixed inset-0 gradient-hero -z-10" />
      
      {/* Floating orbs */}
      <div className="fixed top-20 left-10 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-float opacity-50 -z-10" />
      <div className="fixed bottom-20 right-10 w-96 h-96 bg-accent/20 rounded-full blur-3xl animate-float opacity-50 -z-10" style={{ animationDelay: '2s' }} />

      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <header className="text-center mb-16 space-y-4">
          <Badge variant="secondary" className="mb-4 bg-primary/10 text-primary border-primary/20">
            <Sparkles className="w-3 h-3 mr-1" />
            Powered by Sora 2
          </Badge>
          
          <h1 className="text-6xl md:text-7xl font-bold tracking-tight">
            <span className="text-gradient animate-glow">
              Video AI Studio
            </span>
          </h1>
        </header>

        {/* Main content */}
        <div className="grid md:grid-cols-2 gap-8 max-w-7xl mx-auto">
          <div>
            <VideoGenerator onVideoGenerated={setVideoUrl} />
          </div>
          
          <div>
            <VideoPreview videoUrl={videoUrl} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
