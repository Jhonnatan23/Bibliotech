
import { supabase } from './supabase';

const BUCKET_NAME = 'book-covers';
const AVATAR_BUCKET = 'avatars';

/**
 * Converte uma string Base64 em um objeto Blob para upload.
 */
const base64ToBlob = (base64: string): Blob => {
  const parts = base64.split(';base64,');
  const contentType = parts[0].split(':')[1];
  const raw = window.atob(parts[1]);
  const rawLength = raw.length;
  const uInt8Array = new Uint8Array(rawLength);

  for (let i = 0; i < rawLength; ++i) {
    uInt8Array[i] = raw.charCodeAt(i);
  }

  return new Blob([uInt8Array], { type: contentType });
};

export const storageService = {
  /**
   * Faz o upload de uma imagem para o storage e retorna a URL pública.
   * Organiza por userId/bookId para evitar colisões.
   */
  async uploadCover(userId: string, bookId: string, base64Data: string): Promise<string | null> {
    try {
      if (!base64Data.startsWith('data:image')) return base64Data;

      const blob = base64ToBlob(base64Data);
      const fileExt = blob.type.split('/')[1] || 'webp';
      const filePath = `${userId}/${bookId}.${fileExt}`;

      // Upload do arquivo (upsert: true substitui se já existir)
      const { error: uploadError } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(filePath, blob, {
          contentType: blob.type,
          upsert: true
        });

      if (uploadError) {
        console.error('Erro no upload Storage:', uploadError.message);
        return null;
      }

      // Obter URL pública
      const { data } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(filePath);

      return data.publicUrl;
    } catch (err) {
      console.error('Falha crítica no upload:', err);
      return null;
    }
  },

  /**
   * Faz o upload do avatar do usuário.
   */
  async uploadAvatar(userId: string, base64Data: string): Promise<string | null> {
    try {
      if (!base64Data.startsWith('data:image')) return base64Data;

      const blob = base64ToBlob(base64Data);
      const fileExt = blob.type.split('/')[1] || 'webp';
      const filePath = `${userId}/avatar.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from(AVATAR_BUCKET)
        .upload(filePath, blob, {
          contentType: blob.type,
          upsert: true
        });

      if (uploadError) {
        console.error('Erro no upload de avatar:', uploadError.message);
        return null;
      }

      const { data } = supabase.storage
        .from(AVATAR_BUCKET)
        .getPublicUrl(filePath);

      return data.publicUrl;
    } catch (err) {
      console.error('Falha ao subir avatar:', err);
      return null;
    }
  },

  async deleteCover(userId: string, bookId: string): Promise<void> {
    // Como não sabemos a extensão exata (png/webp), o ideal seria listar ou padronizar
    // Por simplicidade, tentamos apagar caminhos comuns se necessário
    try {
      const filePath = `${userId}/${bookId}.webp`;
      await supabase.storage.from(BUCKET_NAME).remove([filePath]);
    } catch (e) {}
  }
};
