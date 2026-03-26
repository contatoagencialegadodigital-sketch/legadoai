import React, { useState } from 'react';
import { User, Plus, Trash2, X, Upload, UserCheck } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCharacterLibrary } from '@/hooks/useCharacterLibrary';
import { useToast } from '@/hooks/use-toast';

export function CharacterManager() {
  const { characters, addCharacter, removeCharacter } = useCharacterLibrary();
  const [isOpen, setIsOpen] = useState(false);
  const [newCharName, setNewCharName] = useState('');
  const [newCharPhotos, setNewCharPhotos] = useState<string[]>([]);
  const { toast } = useToast();

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewCharPhotos(prev => [...prev, reader.result as string].slice(0, 5));
      };
      reader.readAsDataURL(file);
    });
  };

  const handleSave = () => {
    if (!newCharName.trim()) {
      toast({ title: "Erro", description: "O nome é obrigatório", variant: "destructive" });
      return;
    }
    if (newCharPhotos.length === 0) {
      toast({ title: "Erro", description: "Adicione pelo menos uma foto", variant: "destructive" });
      return;
    }

    addCharacter({
      name: newCharName,
      triggerKeywords: [newCharName],
      photos: newCharPhotos
    });

    setNewCharName('');
    setNewCharPhotos([]);
    toast({ title: "Sucesso", description: `${newCharName} foi registrado(a)!` });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-muted-foreground hover:bg-muted/50 hover:text-foreground">
          <User className="w-5 h-5 flex-shrink-0" />
          <span className="text-sm font-medium">Biblioteca de Personagens</span>
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Gerenciar Personagens (Treinamento Virtual)</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          <div className="p-4 border rounded-xl bg-muted/30 space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Novo Personagem</h3>
            <div className="space-y-2">
              <label className="text-xs font-medium">Nome (Gatilho no Prompt)</label>
              <Input 
                placeholder="Ex: Joaquim" 
                value={newCharName} 
                onChange={(e) => setNewCharName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium">Fotos de Referência (Máx 5)</label>
              <div className="grid grid-cols-5 gap-2">
                {newCharPhotos.map((photo, i) => (
                  <div key={i} className="relative aspect-square rounded-md overflow-hidden bg-muted group">
                    <img src={photo} alt="" className="w-full h-full object-cover" />
                    <button 
                      onClick={() => setNewCharPhotos(prev => prev.filter((_, idx) => idx !== i))}
                      className="absolute top-0 right-0 p-1 bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
                {newCharPhotos.length < 5 && (
                  <label className="aspect-square rounded-md border-2 border-dashed flex flex-col items-center justify-center cursor-pointer hover:bg-muted/50 transition-colors">
                    <Plus className="w-4 h-4 text-muted-foreground" />
                    <input type="file" className="hidden" accept="image/*" multiple onChange={handlePhotoUpload} />
                  </label>
                )}
              </div>
            </div>
            <Button className="w-full gap-2" onClick={handleSave}>
              <UserCheck className="w-4 h-4" />
              Salvar Identidade
            </Button>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Personagens Registrados</h3>
            {characters.length === 0 ? (
              <p className="text-sm text-center py-4 text-muted-foreground">Nenhum personagem registrado ainda.</p>
            ) : (
              <div className="grid gap-2">
                {characters.map(char => (
                  <div key={char.id} className="flex items-center gap-3 p-3 rounded-xl border bg-card hover:bg-accent/5 transition-colors group">
                    <div className="flex -space-x-2">
                      {char.photos.slice(0, 3).map((p, i) => (
                        <div key={i} className="w-8 h-8 rounded-full border-2 border-card overflow-hidden bg-muted">
                          <img src={p} className="w-full h-full object-cover" />
                        </div>
                      ))}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-sm">{char.name}</p>
                      <p className="text-[10px] text-muted-foreground">{char.photos.length} fotos de referência</p>
                    </div>
                    <button 
                      onClick={() => {
                        if (window.confirm(`Tem certeza que deseja excluir a identidade de "${char.name}"?`)) {
                          removeCharacter(char.id);
                          toast({ title: "Excluído", description: "Personagem removido da biblioteca." });
                        }
                      }}
                      className="p-2 text-muted-foreground hover:text-destructive transition-all"
                      title="Excluir Personagem"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
