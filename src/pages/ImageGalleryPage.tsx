import { useState } from 'react';
import { useImageGallery } from '@/hooks/useImageGallery';
import { ImageIcon, Trash2, Download, Grid, List, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export default function ImageGalleryPage() {
  const { images, deleteImage, downloadImage } = useImageGallery();
  const { toast } = useToast();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [imageToDelete, setImageToDelete] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<typeof images[0] | null>(null);

  // Filter images by search
  const filteredImages = images.filter(img => 
    img.prompt.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleDownload = async (image: typeof images[0]) => {
    const success = await downloadImage(image);
    if (success) {
      toast({
        title: 'Download iniciado!',
        description: 'A imagem está sendo baixada',
      });
    } else {
      toast({
        title: 'Erro no download',
        description: 'Não foi possível baixar a imagem',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border/30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
            <ImageIcon className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-foreground">Galeria de Imagens</h1>
            <p className="text-sm text-muted-foreground">
              {images.length} {images.length === 1 ? 'imagem' : 'imagens'} geradas
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* View Toggle */}
          <div className="flex items-center bg-muted rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={cn(
                "p-2 rounded-md transition-all",
                viewMode === 'grid' 
                  ? "bg-card text-foreground shadow-sm" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={cn(
                "p-2 rounded-md transition-all",
                viewMode === 'list' 
                  ? "bg-card text-foreground shadow-sm" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="px-6 py-4 border-b border-border/30">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar imagens..."
            className="pl-10"
          />
        </div>
      </div>

      {/* Gallery Content */}
      <div className="flex-1 overflow-y-auto p-6 overscroll-contain">
        {filteredImages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
              <ImageIcon className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium text-foreground mb-2">
              {searchQuery ? 'Nenhuma imagem encontrada' : 'Nenhuma imagem ainda'}
            </h3>
            <p className="text-muted-foreground max-w-sm">
              {searchQuery 
                ? 'Tente buscar com outros termos' 
                : 'Volte ao chat e peça "Crie uma imagem de..." para começar'}
            </p>
          </div>
        ) : (
          <div className={cn(
            viewMode === 'grid'
              ? "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4"
              : "space-y-3 max-w-3xl"
          )}>
            {filteredImages.map((image) => (
              <div
                key={image.id}
                className={cn(
                  "group relative bg-card rounded-xl border border-border/50 overflow-hidden hover:border-primary/30 transition-all",
                  viewMode === 'list' && "flex items-center gap-4 p-3"
                )}
              >
                {/* Image */}
                <div 
                  className={cn(
                    "relative overflow-hidden cursor-pointer",
                    viewMode === 'grid' ? "aspect-square" : "w-24 h-24 rounded-lg flex-shrink-0"
                  )}
                  onClick={() => setSelectedImage(image)}
                >
                  <img
                    src={image.url}
                    alt={image.prompt}
                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                  />
                  
                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDownload(image);
                      }}
                      className="text-white hover:bg-white/20"
                    >
                      <Download className="w-5 h-5" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        setImageToDelete(image.id);
                      }}
                      className="text-white hover:bg-white/20"
                    >
                      <Trash2 className="w-5 h-5" />
                    </Button>
                  </div>
                </div>

                {/* Info */}
                <div className={cn(
                  "flex-1 min-w-0",
                  viewMode === 'grid' ? "p-3" : ""
                )}>
                  <p className="text-sm font-medium text-foreground truncate mb-1">
                    {image.prompt}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(image.createdAt)}
                  </p>
                  
                  {viewMode === 'list' && (
                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={() => handleDownload(image)}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-all"
                      >
                        <Download className="w-3.5 h-3.5" />
                        Baixar
                      </button>
                      <button
                        onClick={() => setImageToDelete(image.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg bg-muted text-muted-foreground hover:bg-muted/80 transition-all"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Excluir
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Image Preview Dialog */}
      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden">
          {selectedImage && (
            <div className="flex flex-col">
              <div className="relative bg-black flex items-center justify-center">
                <img
                  src={selectedImage.url}
                  alt={selectedImage.prompt}
                  className="max-h-[60vh] w-auto object-contain"
                />
              </div>
              <div className="p-6">
                <DialogHeader>
                  <DialogTitle className="text-lg">{selectedImage.prompt}</DialogTitle>
                  <DialogDescription>
                    Criada em {formatDate(selectedImage.createdAt)}
                  </DialogDescription>
                </DialogHeader>
                <div className="flex gap-3 mt-4">
                  <Button
                    onClick={() => handleDownload(selectedImage)}
                    className="flex-1"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Baixar imagem
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => {
                      setSelectedImage(null);
                      setImageToDelete(selectedImage.id);
                    }}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Excluir
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!imageToDelete} onOpenChange={() => setImageToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir imagem?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. A imagem será removida permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (imageToDelete) {
                  deleteImage(imageToDelete);
                  setImageToDelete(null);
                  toast({
                    title: 'Imagem excluída',
                    description: 'A imagem foi removida da galeria',
                  });
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
