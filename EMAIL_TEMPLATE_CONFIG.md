# Configuração de Email Personalizado - Legal AI Studio

## Como Configurar

1. Acesse o backend do Lovable Cloud clicando no botão abaixo
2. Vá em Authentication > Email Templates
3. Selecione "Reset Password"
4. Cole o HTML abaixo no campo de template
5. Faça upload da logo (src/assets/legado-logo-email.jpeg) para um serviço público de hospedagem de imagens ou use a logo já hospedada no seu domínio
6. Substitua `YOUR_LOGO_URL_HERE` pela URL real da logo

## Template HTML para Email de Recuperação de Senha

```html
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Recuperação de Senha - Legal AI Studio</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #0a0f1a;">
  <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%; background-color: #0a0f1a;">
    <tr>
      <td style="padding: 40px 20px;">
        <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%; max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #1a1f2e 0%, #0f1419 100%); border-radius: 16px; overflow: hidden; box-shadow: 0 0 40px rgba(62, 186, 188, 0.3);">
          
          <!-- Header com Logo -->
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center; background: linear-gradient(135deg, rgba(62, 186, 188, 0.1) 0%, transparent 50%, rgba(77, 230, 233, 0.1) 100%);">
              <img src="YOUR_LOGO_URL_HERE" alt="Legal AI Studio" style="max-width: 180px; height: auto; margin-bottom: 20px;">
              <h1 style="color: #3ebabb; margin: 0; font-size: 28px; font-weight: 700; background: linear-gradient(135deg, #3ebabb, #4de6e9); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">
                Recuperação de Senha
              </h1>
            </td>
          </tr>
          
          <!-- Conteúdo -->
          <tr>
            <td style="padding: 30px 40px;">
              <p style="color: #e5e7eb; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
                Olá,
              </p>
              <p style="color: #e5e7eb; font-size: 16px; line-height: 1.6; margin: 0 0 30px;">
                Você solicitou a recuperação de senha da sua conta no <strong style="color: #3ebabb;">Legal AI Studio</strong>. Clique no botão abaixo para criar uma nova senha:
              </p>
              
              <!-- Botão -->
              <table role="presentation" cellpadding="0" cellspacing="0" style="margin: 0 auto;">
                <tr>
                  <td style="text-align: center;">
                    <a href="{{ .ConfirmationURL }}" style="display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #3ebabb, #4de6e9); color: #0a0f1a; text-decoration: none; font-weight: 600; font-size: 16px; border-radius: 8px; box-shadow: 0 4px 20px rgba(62, 186, 188, 0.4); transition: all 0.3s ease;">
                      Redefinir Senha
                    </a>
                  </td>
                </tr>
              </table>
              
              <p style="color: #9ca3af; font-size: 14px; line-height: 1.6; margin: 30px 0 0;">
                Se você não solicitou esta recuperação de senha, ignore este email. Sua senha permanecerá inalterada.
              </p>
              
              <p style="color: #9ca3af; font-size: 14px; line-height: 1.6; margin: 20px 0 0;">
                <strong>Nota:</strong> Este link expira em 60 minutos por segurança.
              </p>
            </td>
          </tr>
          
          <!-- Rodapé -->
          <tr>
            <td style="padding: 30px 40px; background-color: rgba(62, 186, 188, 0.05); border-top: 1px solid rgba(62, 186, 188, 0.2);">
              <p style="color: #6b7280; font-size: 13px; line-height: 1.6; margin: 0; text-align: center;">
                © 2025 Legal AI Studio. Todos os direitos reservados.
              </p>
              <p style="color: #6b7280; font-size: 12px; line-height: 1.6; margin: 10px 0 0; text-align: center;">
                Este é um email automático, por favor não responda.
              </p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
```

## Cores Utilizadas

As cores do template correspondem à paleta do Legal AI Studio:
- **Primary (Turquesa)**: `#3ebabb` / `hsl(174, 70%, 50%)`
- **Accent (Cyan Brilhante)**: `#4de6e9` / `hsl(180, 90%, 55%)`
- **Background Escuro**: `#0a0f1a` / `hsl(220, 30%, 6%)`
- **Foreground Claro**: `#e5e7eb` / `hsl(210, 40%, 98%)`

## Configuração do Nome do Remetente

No Lovable Cloud backend, em Authentication > Email Templates > Settings:
- **Site Name**: Legal AI Studio
- **Support Email**: seu-email@dominio.com

## Hospedagem da Logo

Para usar a logo no email, você precisa hospedá-la em um local público. Opções:
1. **Seu próprio domínio**: Upload para seu servidor web
2. **Serviço de hospedagem de imagens**: Imgur, Cloudinary, etc.
3. **Storage do Supabase**: Upload para o bucket público do Supabase

Depois de hospedar, substitua `YOUR_LOGO_URL_HERE` pela URL completa da imagem.
