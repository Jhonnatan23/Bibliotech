import { describe, it, expect } from 'vitest';
import { validateClientConfig } from './config';
import { validateServerConfig } from './serverConfig';

describe('Configurações - Validação Fail-Fast', () => {

  const baseValidClient = {
    supabaseUrl: 'https://test-project.supabase.co',
    supabaseAnonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.payload.signature',
    monitoringEnabled: false,
    monitoringDsn: '',
    env: 'development',
  };

  const baseValidServer = {
    supabaseUrl: 'https://test-project.supabase.co',
    supabaseAnonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.payload.signature',
    geminiApiKey: 'AIzaSyTestApiKey_12345',
    googleBooksApiKey: '',
    emailEnabled: false,
    emailUser: '',
    emailPass: '',
    port: 3000,
    env: 'development',
    monitoringEnabled: false,
    monitoringDsn: '',
  };

  // 1. Todas as variáveis válidas
  it('deve passar com todas as variáveis obrigatórias válidas', () => {
    expect(() => validateClientConfig(baseValidClient)).not.toThrow();
    expect(() => validateServerConfig(baseValidServer)).not.toThrow();
  });

  // 2. URL do Supabase ausente
  it('deve falhar se URL do Supabase estiver ausente', () => {
    const invalidClient = { ...baseValidClient, supabaseUrl: '' };
    const invalidServer = { ...baseValidServer, supabaseUrl: '' };

    expect(() => validateClientConfig(invalidClient)).toThrow("VITE_SUPABASE_URL");
    expect(() => validateServerConfig(invalidServer)).toThrow("VITE_SUPABASE_URL");
  });

  // 3. Chave do Supabase ausente
  it('deve falhar se chave do Supabase estiver ausente', () => {
    const invalidClient = { ...baseValidClient, supabaseAnonKey: '' };
    const invalidServer = { ...baseValidServer, supabaseAnonKey: '' };

    expect(() => validateClientConfig(invalidClient)).toThrow("VITE_SUPABASE_ANON_KEY");
    expect(() => validateServerConfig(invalidServer)).toThrow("VITE_SUPABASE_ANON_KEY");
  });

  // 4. Variável com placeholder
  it('deve falhar se houver placeholders nas variáveis obrigatórias', () => {
    const invalidClient = { ...baseValidClient, supabaseUrl: 'https://sua-url-do-supabase.supabase.co' };
    const invalidServer = { ...baseValidServer, geminiApiKey: 'sua-chave-de-api-secreta-do-gemini' };

    expect(() => validateClientConfig(invalidClient)).toThrow("VITE_SUPABASE_URL");
    expect(() => validateServerConfig(invalidServer)).toThrow("GEMINI_API_KEY");
  });

  // 5. Porta inválida
  it('deve falhar se a porta do servidor for inválida', () => {
    const invalidPortLow = { ...baseValidServer, port: 0 };
    const invalidPortHigh = { ...baseValidServer, port: 999999 };
    const invalidPortNaN = { ...baseValidServer, port: NaN };

    expect(() => validateServerConfig(invalidPortLow)).toThrow("Porta inválida");
    expect(() => validateServerConfig(invalidPortHigh)).toThrow("Porta inválida");
    expect(() => validateServerConfig(invalidPortNaN)).toThrow("Porta inválida");
  });

  // 6. Funcionalidade opcional desativada sem credenciais
  it('deve passar se funcionalidade opcional (e-mail ou monitoramento) estiver desativada e sem credenciais', () => {
    // E-mail desativado (EMAIL_ENABLED=false)
    const serverWithNoEmail = { 
      ...baseValidServer, 
      emailEnabled: false,
      emailUser: '', 
      emailPass: '' 
    };
    expect(() => validateServerConfig(serverWithNoEmail)).not.toThrow();

    // Monitoramento desativado
    const clientWithNoMonitoring = { ...baseValidClient, monitoringEnabled: false, monitoringDsn: '' };
    expect(() => validateClientConfig(clientWithNoMonitoring)).not.toThrow();
  });

  // 7. Funcionalidade opcional ativa sem credenciais
  it('deve falhar se funcionalidade opcional estiver ativa mas sem credenciais válidas', () => {
    // Monitoramento ativo sem DSN
    const invalidClientMon = { ...baseValidClient, monitoringEnabled: true, monitoringDsn: '' };
    expect(() => validateClientConfig(invalidClientMon)).toThrow("VITE_MONITORING_DSN");

    // Monitoramento ativo com DSN inválido ou placeholder
    const invalidClientMonPh = { ...baseValidClient, monitoringEnabled: true, monitoringDsn: 'placeholder' };
    expect(() => validateClientConfig(invalidClientMonPh)).toThrow("VITE_MONITORING_DSN");

    // E-mail ativo (EMAIL_ENABLED=true) mas sem senha
    const invalidServerEmailPartial = { ...baseValidServer, emailEnabled: true, emailUser: 'user@test.com', emailPass: '' };
    expect(() => validateServerConfig(invalidServerEmailPartial)).toThrow("EMAIL_PASS");

    // E-mail ativo com formato inválido de e-mail
    const invalidServerEmailFormat = { ...baseValidServer, emailEnabled: true, emailUser: 'not-an-email', emailPass: 'validpass' };
    expect(() => validateServerConfig(invalidServerEmailFormat)).toThrow("EMAIL_USER");
  });

  // 8. Ambiente inválido
  it('deve falhar se o ambiente for inválido', () => {
    const invalidClientEnv = { ...baseValidClient, env: 'producaoo' };
    const invalidServerEnv = { ...baseValidServer, env: 'producaoo' };

    expect(() => validateClientConfig(invalidClientEnv)).toThrow("Ambiente atual inválido");
    expect(() => validateServerConfig(invalidServerEnv)).toThrow("Ambiente atual inválido");
  });

  // 9. Ambiente de teste ou produção/desenvolvimento válido
  it('deve aceitar ambientes válidos', () => {
    const testClient = { ...baseValidClient, env: 'test' };
    const testServer = { ...baseValidServer, env: 'test' };

    expect(() => validateClientConfig(testClient)).not.toThrow();
    expect(() => validateServerConfig(testServer)).not.toThrow();
  });
});
