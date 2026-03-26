/**
 * PDF OCR - Solução simplificada usando conversão direta para imagem
 */

import { createChatCompletion } from '@/integrations/openai/client';

/**
 * Converte File para Base64
 */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Extrai texto de uma imagem usando GPT-4o Vision (OCR)
 */
export async function extractTextFromImage(
  base64Image: string,
  prompt: string = "Extraia TODO o texto visível nesta imagem. Se for uma nota fiscal ou documento fiscal, extraia todos os dados: emitente, destinatário, itens, valores, datas, CNPJ, número do documento, chave de acesso. Mantenha a formatação."
): Promise<string> {
  const response = await createChatCompletion({
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content: 'Você é um sistema OCR avançado. Extraia todo o texto visível das imagens com máxima precisão. Para documentos fiscais (notas fiscais, recibos, cupons fiscais), extraia todos os campos: dados do emitente, destinatário, produtos/serviços, valores unitários e totais, impostos (ICMS, IPI, PIS, COFINS), datas de emissão, número da nota, série, chave de acesso, CNPJ/CPF, endereços.'
      },
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: prompt
          },
          {
            type: 'image_url',
            image_url: {
              url: `data:image/jpeg;base64,${base64Image}`,
              detail: 'high'
            }
          }
        ]
      }
    ],
    max_completion_tokens: 4000,
  });

  return response.choices[0]?.message?.content || '';
}

/**
 * Converte PDF para imagens usando canvas
 * Solução sem worker do pdf.js
 */
export async function pdfToImages(file: File): Promise<string[]> {
  // Para simplificar, vamos usar uma abordagem diferente:
  // Se o arquivo for pequeno (< 5MB), tentamos processar diretamente
  // Caso contrário, informamos o usuário

  if (file.size > 10 * 1024 * 1024) {
    throw new Error('Arquivo muito grande. Limite: 10MB');
  }

  try {
    // Tentar usar pdf.js com fake worker
    const pdfjs = await import('pdfjs-dist');

    // Desabilitar worker (usar modo fake)
    (pdfjs as any).GlobalWorkerOptions.workerSrc = '';

    const arrayBuffer = await file.arrayBuffer();

    // Carregar PDF sem worker
    const loadingTask = (pdfjs as any).getDocument({
      data: arrayBuffer,
      useSystemFonts: true,
      cMapUrl: null,
      cMapPacked: false,
    });

    const pdf = await loadingTask.promise;
    const images: string[] = [];
    const maxPages = Math.min(pdf.numPages, 3); // Máximo 3 páginas

    for (let i = 1; i <= maxPages; i++) {
      const page = await pdf.getPage(i);

      // Criar canvas com alta resolução
      const scale = 2.0;
      const viewport = page.getViewport({ scale });

      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d')!;
      canvas.width = viewport.width;
      canvas.height = viewport.height;

      // Renderizar página
      await page.render({
        canvasContext: context,
        viewport: viewport,
        intent: 'display'
      }).promise;

      // Converter para base64
      const base64 = canvas.toDataURL('image/jpeg', 0.9).split(',')[1];
      images.push(base64);

      // Limpar
      page.cleanup();
    }

    return images;
  } catch (error) {
    console.error('[PDF] Erro ao converter PDF:', error);
    throw new Error('Não foi possível processar o PDF. Tente enviar como imagem (JPG/PNG).');
  }
}

/**
 * Extrai texto de PDF
 */
export async function extractTextFromPdf(
  file: File,
  useOcr: boolean = true
): Promise<{ text: string; pages: number; usedOcr: boolean }> {
  console.log('[PDF OCR] Iniciando:', file.name, 'Tipo:', file.type, 'Tamanho:', file.size);

  // Se for uma imagem, processar diretamente
  if (file.type.startsWith('image/')) {
    console.log('[PDF OCR] Processando como imagem...');
    const base64 = await fileToBase64(file);
    const text = await extractTextFromImage(base64);
    return { text, pages: 1, usedOcr: true };
  }

  // Se for PDF, converter para imagens e fazer OCR
  try {
    console.log('[PDF OCR] Convertendo PDF para imagens...');
    const images = await pdfToImages(file);
    console.log('[PDF OCR] Imagens geradas:', images.length);

    const results: string[] = [];

    for (let i = 0; i < images.length; i++) {
      console.log(`[PDF OCR] Processando OCR da página ${i + 1}...`);
      const text = await extractTextFromImage(
        images[i],
        `Extraia TODO o texto desta página ${i + 1}. Se for nota fiscal, extraia: emitente, destinatário, produtos, valores, impostos, datas, número, série.`
      );
      results.push(`--- PÁGINA ${i + 1} ---\n${text}`);
    }

    return {
      text: results.join('\n\n'),
      pages: images.length,
      usedOcr: true
    };

  } catch (error: any) {
    console.error('[PDF OCR] Erro:', error);
    throw new Error(error?.message || 'Erro ao processar PDF');
  }
}

/**
 * Processa uma imagem de arquivo para base64
 */
export async function processImageFile(file: File): Promise<string> {
  return fileToBase64(file);
}
