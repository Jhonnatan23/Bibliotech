
/**
 * Utilitário para otimização extrema de imagens no lado do cliente.
 * Reduz dimensões e aplica compressão pesada para garantir fluidez em conexões lentas.
 */
export const optimizeBase64Image = (base64Data: string, maxWidth: number = 240, quality: number = 0.5): Promise<string> => {
  return new Promise((resolve) => {
    // Se não for uma imagem base64 ou for muito pequena, ignora
    if (!base64Data || !base64Data.startsWith('data:image')) {
      resolve(base64Data);
      return;
    }

    const img = new Image();
    img.src = base64Data;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;

      // Redimensionamento agressivo para miniaturas
      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }

      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(base64Data);
        return;
      }

      // Desabilita suavização de alta qualidade para ganhar performance no processamento
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'low'; 
      
      ctx.drawImage(img, 0, 0, width, height);

      // WebP com compressão de 50% (ideal para economia de KB em strings JSON)
      const optimized = canvas.toDataURL('image/webp', quality);
      
      // Retorna a menor versão
      resolve(optimized.length < base64Data.length ? optimized : base64Data);
    };
    img.onerror = () => resolve(base64Data);
  });
};
