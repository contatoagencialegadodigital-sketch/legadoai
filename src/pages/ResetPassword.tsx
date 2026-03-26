import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Lock, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import legadoLogo from '@/assets/legado-logo.png';

export default function ResetPassword() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [canReset, setCanReset] = useState(false);

  useEffect(() => {
    // Tentar estabelecer sessão a partir dos tokens do URL (hash ou code) e habilitar a troca de senha
    const init = async () => {
      try {
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        const code = new URL(window.location.href).searchParams.get('code');

        if (accessToken && refreshToken) {
          await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
        } else if (code) {
          await supabase.auth.exchangeCodeForSession(code);
        }

        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setCanReset(true);
          setErrorMessage('');
        }
      } catch (err) {
        console.warn('Erro ao inicializar recuperação de senha:', err);
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' || session?.user) {
        setCanReset(true);
        setErrorMessage('');
      }
    });

    init();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      // Garantir que há uma sessão válida vinda do link de recuperação
      let { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        const code = new URL(window.location.href).searchParams.get('code');

        if (accessToken && refreshToken) {
          await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
          ({ data: { session } } = await supabase.auth.getSession());
        } else if (code) {
          await supabase.auth.exchangeCodeForSession(code);
          ({ data: { session } } = await supabase.auth.getSession());
        }
      }

      if (!session) {
        setErrorMessage('Link de recuperação inválido ou expirado. Abra o link de recuperação novamente.');
        setLoading(false);
        return;
      }

      // Validações
      if (newPassword.length < 6) {
        setErrorMessage('A senha deve ter pelo menos 6 caracteres');
        setLoading(false);
        return;
      }

      if (newPassword !== confirmPassword) {
        setErrorMessage('As senhas não coincidem');
        setLoading(false);
        return;
      }

      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        setErrorMessage(error.message);
      } else {
        setSuccessMessage('Senha redefinida com sucesso!');
        setTimeout(() => {
          navigate('/auth');
        }, 2000);
      }
    } catch (err: any) {
      console.warn('Erro ao redefinir senha:', err);
      setErrorMessage('Ocorreu um erro ao redefinir sua senha. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-primary/8 to-primary/20">
      <div className="w-full max-w-md space-y-3">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <img 
              src={legadoLogo} 
              alt="Legado AI Studio" 
              className="h-52 md:h-60 w-auto object-contain animate-glow brightness-[1.2]"
            />
          </div>
          
          <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
            <Sparkles className="w-3 h-3 mr-1" />
            Redefinir sua senha
          </Badge>
        </div>

        {/* Reset Password Card */}
        <Card className="border-primary/20 shadow-elegant">
          <CardHeader>
            <CardTitle>Nova Senha</CardTitle>
            <CardDescription>
              Digite sua nova senha para acessar sua conta
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {errorMessage && (
              <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-md text-destructive text-sm">
                {errorMessage}
              </div>
            )}
            {successMessage && (
              <div className="p-3 bg-primary/10 border border-primary/30 rounded-md text-primary text-sm">
                {successMessage}
              </div>
            )}

            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="newPassword">Nova Senha</Label>
                <Input
                  id="newPassword"
                  type="password"
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>
              
              <Button type="submit" className="w-full" disabled={loading}>
                <Lock className="w-4 h-4 mr-2" />
                {loading ? 'Redefinindo senha...' : 'Redefinir Senha'}
              </Button>
            </form>

            <div className="text-center">
              <Button
                type="button"
                variant="link"
                className="text-sm"
                onClick={() => navigate('/auth')}
              >
                Voltar ao login
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
