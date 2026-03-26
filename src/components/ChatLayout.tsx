import React, { useState, useEffect } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  MessageSquare,
  Image as ImageIcon,
  Plus,
  ChevronDown,
  ChevronRight,
  Sun,
  Moon,
  Trash2,
  Download,
  Menu,
  X,
  PanelLeft,
  PanelRight,
  Languages,
  Search,
  ArrowLeft,
  Globe
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTheme } from '@/components/ThemeProvider';
import { useSavedChats } from '@/hooks/useSavedChats';
import { useImageGallery } from '@/hooks/useImageGallery';
import { useTranslatorMode } from '@/hooks/useTranslatorMode';
import { CharacterManager } from '@/components/CharacterManager';
import legadoLogo from '@/assets/legado-logo.png';
import { getAppRegion, isChinaMode } from '@/lib/aiProvider';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface ChatLayoutProps {
  children: React.ReactNode;
}

export function ChatLayout({ children }: ChatLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { resolvedTheme, setTheme } = useTheme();
  const {
    chats,
    recentChats,
    hasMoreChats,
    remainingChats,
    createNewChat,
    deleteChat,
    loadChat,
    clearAllChats
  } = useSavedChats();
  const {
    recentImages,
    hasMoreImages,
    remainingImages,
    deleteImage,
    downloadImage
  } = useImageGallery();
  const { isTranslatorMode, toggleTranslatorMode } = useTranslatorMode();

  // Estados para sidebar
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isHistorySubmenuOpen, setIsHistorySubmenuOpen] = useState(false);
  const [historySearchQuery, setHistorySearchQuery] = useState('');
  const [isMobile, setIsMobile] = useState(false);

  const [chatToDelete, setChatToDelete] = useState<string | null>(null);
  const [isClearAllDialogOpen, setIsClearAllDialogOpen] = useState(false);
  const [imageToDelete, setImageToDelete] = useState<string | null>(null);

  // Detectar se é mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
      // Em desktop, sidebar começa aberto
      if (window.innerWidth >= 1024) {
        setIsSidebarOpen(true);
      } else {
        setIsSidebarOpen(false);
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Fechar sidebar ao navegar em mobile
  useEffect(() => {
    if (isMobile) {
      setIsSidebarOpen(false);
    }
  }, [location.pathname, location.search, isMobile]);

  const isChatActive = location.pathname === '/';
  const isImagesActive = location.pathname === '/images';

  const toggleTheme = () => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
  };

  const handleNewChat = () => {
    const newChatId = createNewChat();
    navigate(`/?chat=${newChatId}`);
    if (isMobile) setIsSidebarOpen(false);
  };

  const handleLoadChat = (chatId: string) => {
    loadChat(chatId);
    navigate(`/?chat=${chatId}`);
    if (isMobile) setIsSidebarOpen(false);
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 1) {
      return 'Ontem';
    } else if (diffDays < 7) {
      return date.toLocaleDateString('pt-BR', { weekday: 'short' });
    } else {
      return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    }
  };

  // Conteúdo do Sidebar
  const SidebarContent = () => (
    <>
      {/* Header com Logo */}
      <div className="h-14 flex items-center px-4 border-b border-border/30 flex-shrink-0">
        <img
          src={legadoLogo}
          alt="Legado"
          className="h-8 w-auto object-contain"
          style={{ filter: 'brightness(1.3)' }}
        />
        <span className="ml-3 text-lg font-semibold text-foreground">
          Legado AI
        </span>

        {/* Botão fechar em mobile */}
        {isMobile && (
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="ml-auto p-2 rounded-lg hover:bg-muted/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Botão Novo Chat */}
      <div className="p-3 flex-shrink-0">
        <Button
          onClick={handleNewChat}
          className="w-full gap-2"
          size="lg"
        >
          <Plus className="w-5 h-5" />
          Novo chat
        </Button>

      </div>

      {/* Conteúdo scrollável */}
      <div className="flex-1 overflow-y-auto px-3 space-y-6 min-h-0 relative overflow-x-hidden">

        {/* SUBMENU HISTORICO LATERAL */}
        <div className={cn(
          "absolute inset-0 bg-card z-10 flex flex-col transition-transform duration-300",
          isHistorySubmenuOpen ? "translate-x-0" : "-translate-x-full"
        )}>
          {/* Header do submenu */}
          <div className="p-3 border-b border-border/30 flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => setIsHistorySubmenuOpen(false)}
              className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <span className="font-medium text-sm">Histórico Completo</span>
          </div>

          {/* Busca */}
          <div className="p-3 flex-shrink-0">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <Input
                value={historySearchQuery}
                onChange={(e) => setHistorySearchQuery(e.target.value)}
                placeholder="Buscar conversas..."
                className="pl-8 h-8 text-xs focus-visible:ring-primary/50"
              />
            </div>
          </div>

          {/* Lista de todos os chats */}
          <div className="flex-1 overflow-y-auto px-2 pb-4 space-y-1">
            {chats
              .filter(c => c.title.toLowerCase().includes(historySearchQuery.toLowerCase()))
              .map(chat => (
                <div
                  key={chat.id}
                  onClick={() => {
                    handleLoadChat(chat.id);
                    setIsHistorySubmenuOpen(false);
                  }}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all text-left group cursor-pointer",
                    isChatActive && location.search.includes(chat.id)
                      ? "bg-primary/15 text-primary border border-primary/20"
                      : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                  )}
                >
                  <MessageSquare className="w-4 h-4 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{chat.title}</p>
                    <p className="text-[10px] text-muted-foreground">{formatDate(chat.updatedAt)} • {chat.messages.length} msgs</p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setChatToDelete(chat.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-destructive/10 hover:text-destructive transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            {chats.length === 0 && (
              <div className="text-center p-4 text-xs text-muted-foreground">
                Nenhuma conversa encontrada.
              </div>
            )}
            {chats.length > 0 && (
              <div className="p-3 mt-2 border-t border-border/30">
                <Button
                  variant="destructive"
                  className="w-full gap-2 text-xs h-8"
                  onClick={() => setIsClearAllDialogOpen(true)}
                >
                  <Trash2 className="w-4 h-4" />
                  Limpar todo histórico
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* MODO NORMAL DO MENU LATERAL */}
        <div className={cn(
          "space-y-6 transition-all duration-300 h-full",
          isHistorySubmenuOpen ? "opacity-0 translate-x-4 pointer-events-none" : "opacity-100 translate-x-0"
        )}>
          {/* SEÇÃO CHATS */}
          <div>
            <div className="flex items-center gap-2 px-2 mb-2">
              <MessageSquare className="w-4 h-4 text-muted-foreground" />
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Conversas
              </span>
            </div>

            <nav className="space-y-1">
              {chats.filter(chat => isChatActive && location.search.includes(chat.id)).map((chat) => {
                const firstImageMessage = chat.messages.find(m => m.imageUrl);
                const hasAttachments = chat.messages.some(m => m.attachments && m.attachments.length > 0);

                return (
                  <div
                    key={chat.id}
                    onClick={() => handleLoadChat(chat.id)}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all text-left group cursor-pointer",
                      isChatActive && location.search.includes(chat.id)
                        ? "bg-primary/15 text-primary border border-primary/20"
                        : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                    )}
                  >
                    {firstImageMessage?.imageUrl ? (
                      <img
                        src={firstImageMessage.imageUrl}
                        alt=""
                        className="w-8 h-8 rounded object-cover flex-shrink-0 bg-muted"
                      />
                    ) : (
                      <MessageSquare className="w-4 h-4 flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{chat.title}</p>
                      <div className="flex items-center gap-1">
                        <p className="text-xs text-muted-foreground">{formatDate(chat.updatedAt)}</p>
                        {hasAttachments && (
                          <span className="text-xs text-primary">• anexos</span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setChatToDelete(chat.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-destructive/10 hover:text-destructive transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}

              <button
                onClick={() => setIsHistorySubmenuOpen(true)}
                className="w-full flex items-center gap-2 px-3 py-2 mt-2 rounded-lg text-sm text-foreground/70 hover:text-foreground hover:bg-muted/50 transition-all font-medium"
              >
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
                Ver histórico completo
              </button>
            </nav>
          </div>

          {/* SEÇÃO IMAGENS */}
          <div>
            <NavLink
              to="/images"
              onClick={() => isMobile && setIsSidebarOpen(false)}
              className={cn(
                "flex items-center gap-2 px-2 mb-2",
                isImagesActive ? "text-primary" : "text-muted-foreground"
              )}
            >
              <ImageIcon className="w-4 h-4" />
              <span className="text-xs font-medium uppercase tracking-wide">
                Imagens
              </span>
            </NavLink>

            <nav className="space-y-1">
              {recentImages.map((image) => (
                <div
                  key={image.id}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-lg transition-all group",
                    "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                  )}
                >
                  <img
                    src={image.url}
                    alt={image.prompt}
                    className="w-10 h-10 rounded object-cover flex-shrink-0 bg-muted"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{image.prompt.slice(0, 25)}...</p>
                    <p className="text-xs text-muted-foreground">{formatDate(image.createdAt)}</p>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => downloadImage(image)}
                      className="p-1 rounded hover:bg-primary/10 hover:text-primary transition-all"
                      title="Baixar"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setImageToDelete(image.id)}
                      className="p-1 rounded hover:bg-destructive/10 hover:text-destructive transition-all"
                      title="Excluir"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}

              {hasMoreImages && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-all text-sm">
                      <ChevronDown className="w-4 h-4" />
                      Ver mais ({remainingImages.length})
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-72 max-h-80 overflow-y-auto">
                    {remainingImages.map((image) => (
                      <DropdownMenuItem
                        key={image.id}
                        className="flex items-center gap-3 cursor-pointer"
                      >
                        <img
                          src={image.url}
                          alt={image.prompt}
                          className="w-12 h-12 rounded object-cover bg-muted"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{image.prompt.slice(0, 30)}...</p>
                          <p className="text-xs text-muted-foreground">{formatDate(image.createdAt)}</p>
                        </div>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}

              <NavLink
                to="/images"
                onClick={() => isMobile && setIsSidebarOpen(false)}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-lg transition-all text-sm",
                  isImagesActive
                    ? "bg-primary/15 text-primary border border-primary/20"
                    : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                )}
              >
                <ChevronRight className="w-4 h-4" />
                Ver galeria completa
              </NavLink>
            </nav>
          </div>
        </div> {/* MODO NORMAL DO MENU LATERAL */}
      </div> {/* flex-1 overflow-y-auto */}

      {/* Footer - Settings & Theme */}
      <div className="p-3 border-t border-border/30 flex-shrink-0 space-y-1">
        <CharacterManager />
        
        <button
          onClick={toggleTranslatorMode}
          className={cn(
            "w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all",
            isTranslatorMode
              ? "bg-primary/15 text-primary border border-primary/20"
              : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
          )}
        >
          <div className="flex items-center gap-3">
            <Languages className="w-5 h-5 flex-shrink-0" />
            <span className="text-sm font-medium">Modo Tradutor</span>
          </div>
          <div className={cn(
            "w-8 h-4 rounded-full transition-colors relative",
            isTranslatorMode ? "bg-primary" : "bg-muted-foreground/30"
          )}>
            <div className={cn(
              "absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full transition-transform shadow-sm",
              isTranslatorMode ? "translate-x-4" : "translate-x-0"
            )} />
          </div>
        </button>

        <button
          onClick={toggleTheme}
          className={cn(
            "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all",
            "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
          )}
        >
          {resolvedTheme === 'dark' ? (
            <Sun className="w-5 h-5 flex-shrink-0" />
          ) : (
            <Moon className="w-5 h-5 flex-shrink-0" />
          )}
          <span className="text-sm font-medium">
            {resolvedTheme === 'dark' ? 'Modo claro' : 'Modo escuro'}
          </span>
        </button>

      </div>
    </>
  );

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden">
      {/* Overlay para mobile quando sidebar está aberto */}
      {isMobile && isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "flex flex-col bg-card/95 border-r border-border/50 transition-all duration-300 ease-in-out z-50",
          // Mobile: Drawer sobreposto
          isMobile ? [
            "fixed inset-y-0 left-0 w-[280px] h-full shadow-2xl",
            isSidebarOpen ? "translate-x-0" : "-translate-x-full"
          ] : [
            // Desktop: Sidebar ao lado
            "relative h-full",
            isSidebarOpen ? "w-72" : "w-0 overflow-hidden opacity-0"
          ]
        )}
      >
        <SidebarContent />
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 w-full h-full relative overflow-hidden">
        {/* Header com botão de menu */}
        <header
          className="flex items-center px-4 py-3 border-b border-border/30 bg-background/95 backdrop-blur-sm flex-shrink-0 sticky top-0 z-10"
          style={{ paddingTop: 'max(0.75rem, env(safe-area-inset-top))' }}
        >
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 rounded-lg hover:bg-muted/50 transition-colors"
            aria-label={isSidebarOpen ? "Fechar menu" : "Abrir menu"}
          >
            {isSidebarOpen ? (
              <PanelLeft className="w-5 h-5 text-muted-foreground" />
            ) : (
              <Menu className="w-5 h-5 text-muted-foreground" />
            )}
          </button>

          <div className="ml-4 flex items-center gap-2">
            <img
              src={legadoLogo}
              alt="Legado"
              className="h-6 w-auto object-contain lg:hidden"
              style={{ filter: 'brightness(1.3)' }}
            />
            <span className="font-medium text-foreground lg:hidden">
              Legado AI
            </span>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-hidden relative flex flex-col">
          {/* Background gradient sutil */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
            <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
          </div>

          {children}
        </div>
      </main>

      {/* Dialogs */}
      <AlertDialog open={isClearAllDialogOpen} onOpenChange={setIsClearAllDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir todo o histórico?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação apagará permanentemente todas as suas conversas salvas no navegador. Essa ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                clearAllChats();
                setIsClearAllDialogOpen(false);
                setIsHistorySubmenuOpen(false);
                navigate('/');
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Sim, excluir tudo
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!chatToDelete} onOpenChange={() => setChatToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir conversa?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. A conversa será removida permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (chatToDelete) {
                  deleteChat(chatToDelete);
                  setChatToDelete(null);
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
