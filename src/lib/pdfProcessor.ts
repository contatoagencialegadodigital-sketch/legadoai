/**
 * Processador de PDF usando PDF.js com configuração correta do worker
 */

import * as pdfjsLib from 'pdfjs-dist';

// Configurar o worker do PDF.js - usar arquivo local para evitar CORS
pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.mjs';

console.log('[PDF] Worker local configurado:', pdfjsLib.GlobalWorkerOptions.workerSrc);

/**
 * Renderiza uma página do PDF em um canvas
 */
async function renderPageToCanvas(
  page: pdfjsLib.PDFPageProxy,
  scale: number = 2.0
): Promise<HTMLCanvasElement> {
  const viewport = page.getViewport({ scale });
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d')!;

  canvas.width = viewport.width;
  canvas.height = viewport.height;

  await (page as any).render({
    canvasContext: context,
    viewport: viewport
  }).promise;

  return canvas;
}

/**
 * Converte canvas para base64
 */
function canvasToBase64(canvas: HTMLCanvasElement): string {
  return canvas.toDataURL('image/jpeg', 0.95).split(',')[1];
}

/**
 * Extraia texto de uma página usando OCR (Legado AI / Qwen-VL)
 */
async function ocrWithProvider(
  base64Image: string,
  pageNumber: number
): Promise<string> {
  const { getAIProvider } = await import('@/lib/aiProvider');
  const provider = getAIProvider();

  const response = await provider.chat({
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: `Você é um sistema OCR especializado em extrair texto de documentos.
Extraia TODO o texto visível desta página ${pageNumber} do documento.
Se for uma nota fiscal ou documento fiscal, extraia e organize:
- Emitente: nome, CNPJ, endereço
- Destinatário: nome, CNPJ/CPF, endereço
- Produtos/Serviços: descrição, quantidade, valor unitário, valor total
- Impostos: ICMS, IPI, PIS, COFINS
- Totais: valor dos produtos, frete, seguro, desconto, valor da nota
- Informações da nota: número, série, data de emissão, chave de acesso

Retorne o texto extraído de forma organizada e completa.`
          },
          {
            type: 'image',
            data: base64Image
          }
        ]
      }
    ],
    temperature: 0.1
  });

  return (response.choices[0]?.message?.content as string) || '[Não foi possível extrair texto]';
}

/**
 * Extrai texto selecionável do PDF
 */
async function extractSelectableText(
  pdf: pdfjsLib.PDFDocumentProxy,
  maxPages: number = 5
): Promise<{ text: string; hasContent: boolean }> {
  let fullText = '';
  let hasContent = false;

  const numPages = Math.min(pdf.numPages, maxPages);

  for (let i = 1; i <= numPages; i++) {
    try {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ');

      if (pageText.trim().length > 20) {
        hasContent = true;
      }

      fullText += `\n\n--- PÁGINA ${i} ---\n${pageText}`;

      // Liberar memória
      page.cleanup();
    } catch (error) {
      console.error(`[PDF] Erro ao extrair texto da página ${i}:`, error);
      fullText += `\n\n--- PÁGINA ${i} ---\n[Erro ao extrair texto]`;
    }
  }

  return { text: fullText, hasContent };
}

/**
 * Processa PDF com OCR
 */
async function processWithOCR(
  pdf: pdfjsLib.PDFDocumentProxy,
  maxPages: number = 3
): Promise<{ text: string; pagesProcessed: number }> {
  const results: string[] = [];
  const numPages = Math.min(pdf.numPages, maxPages);

  for (let i = 1; i <= numPages; i++) {
    try {
      console.log(`[PDF OCR] Processando página ${i}/${numPages}...`);

      const page = await pdf.getPage(i);
      const canvas = await renderPageToCanvas(page, 2.0);
      const base64 = canvasToBase64(canvas);

      console.log(`[PDF OCR] Página ${i} renderizada, enviando para OCR...`);
      const extractedText = await ocrWithProvider(base64, i);

      results.push(`--- PÁGINA ${i} ---\n${extractedText}`);

      // Liberar memória
      page.cleanup();

      // Pequena pausa entre páginas para não sobrecarregar
      if (i < numPages) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }

    } catch (error) {
      console.error(`[PDF OCR] Erro na página ${i}:`, error);
      results.push(`--- PÁGINA ${i} ---\n[Erro ao processar página]`);
    }
  }

  return {
    text: results.join('\n\n'),
    pagesProcessed: numPages
  };
}

/**
 * Extrai texto de PDF (tenta texto selecionável primeiro, depois OCR)
 */
export async function extractTextFromPdf(
  file: File
): Promise<{ text: string; pages: number; usedOcr: boolean }> {
  console.log('[PDF] Iniciando processamento:', file.name, file.type, `${(file.size / 1024 / 1024).toFixed(2)}MB`);

  // Verificar tamanho
  if (file.size > 20 * 1024 * 1024) {
    throw new Error('Arquivo muito grande. Limite máximo: 20MB');
  }

  try {
    // Ler arquivo como ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    console.log('[PDF] ArrayBuffer criado');

    // Carregar PDF
    console.log('[PDF] Carregando documento...');
    const loadingTask = pdfjsLib.getDocument({
      data: arrayBuffer,
      useSystemFonts: true,
    });

    const pdf = await loadingTask.promise;
    console.log('[PDF] Documento carregado. Páginas:', pdf.numPages);

    // ETAPA 1: Tentar extrair texto selecionável
    console.log('[PDF] Tentando extrair texto selecionável...');
    const { text: selectableText, hasContent } = await extractSelectableText(pdf, 5);

    // Se tem texto suficiente, retorna
    if (hasContent && selectableText.trim().length > 100) {
      console.log('[PDF] Texto selecionável encontrado!');
      return {
        text: selectableText,
        pages: Math.min(pdf.numPages, 5),
        usedOcr: false
      };
    }

    // ETAPA 2: Usar OCR
    console.log('[PDF] Texto selecionável insuficiente. Iniciando OCR...');
    const { text: ocrText, pagesProcessed } = await processWithOCR(pdf, 3);

    // Destruir documento para liberar memória
    pdf.destroy();

    return {
      text: ocrText,
      pages: pagesProcessed,
      usedOcr: true
    };

  } catch (error: any) {
    console.error('[PDF] Erro no processamento:', error);

    // Mensagens de erro específicas
    if (error.message?.includes('worker')) {
      throw new Error('Erro ao inicializar o processador de PDF. Recarregue a página e tente novamente.');
    }
    if (error.message?.includes('Invalid PDF')) {
      throw new Error('O arquivo não é um PDF válido ou está corrompido.');
    }
    if (error.name === 'PasswordException') {
      throw new Error('O PDF está protegido por senha. Não é possível processar.');
    }

    throw new Error(error.message || 'Erro ao processar o PDF');
  }
}

/**
 * Processa arquivo de imagem para OCR
 */
export async function processImageFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const base64 = (reader.result as string).split(',')[1];
        const text = await ocrWithProvider(base64, 1);
        resolve(text);
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
