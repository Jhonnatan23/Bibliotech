import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock de localStorage para rodar em ambiente Node
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value ? value.toString() : '';
    },
    clear: () => {
      store = {};
    },
    removeItem: (key: string) => {
      delete store[key];
    },
  };
})();

Object.defineProperty(global, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

import { communityService } from './communityService';
import { supabase } from './supabase';

// Mock do supabase client
vi.mock('./supabase', () => {
  return {
    supabase: {
      auth: {
        getSession: vi.fn(),
        getUser: vi.fn(),
      },
      from: vi.fn(),
    },
  };
});

describe('CommunityService - Auth & Project Independence Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    communityService.setLocalMode(false);
  });

  // 1. Usuário Autenticado
  it('deve obter o perfil do usuário autenticado a partir da sessão do Supabase', async () => {
    const mockUser = {
      id: 'auth-user-123',
      user_metadata: {
        full_name: 'Gabriel Arcanjo',
        avatar_url: 'https://avatar.url/gabriel',
      },
    };

    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: { user: mockUser } as any },
      error: null,
    });

    const profile = await (communityService as any).getLocalUserProfile();
    
    expect(profile.id).toBe('auth-user-123');
    expect(profile.full_name).toBe('Gabriel Arcanjo');
    expect(profile.avatar_url).toBe('https://avatar.url/gabriel');
  });

  // 2. Usuário Não Autenticado
  it('deve adotar perfil fallback "Você" quando não existir usuário autenticado', async () => {
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: null },
      error: null,
    });

    const profile = await (communityService as any).getLocalUserProfile();

    expect(profile.id).toBe('local-user-id');
    expect(profile.full_name).toBe('Você');
    expect(profile.avatar_url).toBeUndefined();
  });

  // 3. Sessão Expirada / Erro do Supabase na autenticação
  it('deve tratar erro na recuperação da sessão e fazer fallback de perfil de forma segura', async () => {
    vi.mocked(supabase.auth.getSession).mockRejectedValue(new Error('JWT Expired or Database Connection Refused'));

    const profile = await (communityService as any).getLocalUserProfile();

    expect(profile.id).toBe('local-user-id');
    expect(profile.full_name).toBe('Você');
  });

  // 4. Erro do Supabase nas tabelas (Habilitação do Modo Local Automático)
  it('deve migrar automaticamente para modo local quando houver erro de tabela inexistente (42P01) no banco', async () => {
    // Simular que o usuário está autenticado
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: { user: { id: 'user-id-456' } } as any },
      error: null,
    });

    // Simular erro de tabela inexistente na consulta remota
    const mockFrom = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        order: vi.fn().mockRejectedValue({
          code: '42P01',
          message: 'relation "community_posts" does not exist',
        }),
      }),
    });
    vi.mocked(supabase.from).mockImplementation(mockFrom as any);

    // Deve retornar posts simulados ou vazios localmente em vez de falhar
    const posts = await communityService.getPosts();
    expect(communityService.isLocalMode()).toBe(true);
    expect(Array.isArray(posts)).toBe(true);
  });

  // 5. Mudança de Projeto sem Alteração no Código
  it('deve provar independência de qualquer identificador estático ou chave de localStorage específica', async () => {
    const mockSession = {
      user: {
        id: 'new-project-user-789',
        user_metadata: {
          full_name: 'Novo Usuário do Supabase',
        },
      },
    };

    // Altera a sessão do Supabase dinamicamente
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: { user: mockSession.user } as any },
      error: null,
    });

    const profile = await (communityService as any).getLocalUserProfile();
    
    // Mostra que a sessão foi lida dinamicamente via getSession(), sem ler chaves fixas
    expect(profile.id).toBe('new-project-user-789');
    expect(profile.full_name).toBe('Novo Usuário do Supabase');
    expect(localStorage.getItem('sb-rqomssyihwvbwtoyjwws-auth-token')).toBeNull();
  });

  // 6. Comunidade carregada após renovação de sessão
  it('deve carregar a comunidade e atualizar o perfil do autor após a renovação de uma sessão', async () => {
    // 1º Passo: Sessão expirada ou nula
    vi.mocked(supabase.auth.getSession).mockResolvedValueOnce({
      data: { session: null },
      error: null,
    });

    const firstProfile = await (communityService as any).getLocalUserProfile();
    expect(firstProfile.id).toBe('local-user-id');

    // 2º Passo: Sessão renovada com novo usuário
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: { user: { id: 'user-renovado-100', user_metadata: { full_name: 'Usuário Renovado' } } } as any },
      error: null,
    });

    const secondProfile = await (communityService as any).getLocalUserProfile();
    expect(secondProfile.id).toBe('user-renovado-100');
    expect(secondProfile.full_name).toBe('Usuário Renovado');
  });
});
