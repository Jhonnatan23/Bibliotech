import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest';
import request from 'supertest';
import { createApp } from './server/app';

// 1. Mock standard Supabase Client and nested query builders
const mockSupabase = {
  auth: {
    getUser: vi.fn(),
  },
  from: vi.fn(),
};

vi.mock('@supabase/supabase-js', () => ({
  createClient: () => mockSupabase,
}));

// Helper to construct highly chainable, thenable query builders mimicking Supabase
function makeChain(resolveValue: any) {
  const chain: any = {
    eq: vi.fn().mockImplementation(() => chain),
    select: vi.fn().mockImplementation(() => chain),
    single: vi.fn().mockImplementation(() => Promise.resolve(resolveValue)),
    then: (onfulfilled: any) => Promise.resolve(resolveValue).then(onfulfilled),
  };
  return chain;
}

// 2. Mock nodemailer
vi.mock('nodemailer', () => ({
  default: {
    createTransport: () => ({
      sendMail: vi.fn().mockResolvedValue({ messageId: 'test-msg-id' }),
    }),
  },
}));

describe('Loans Integration Tests using real Handlers and Express app', () => {
  let app: any;

  beforeAll(async () => {
    // Instantiate real express app (will not listen on a port during tests)
    app = await createApp();
  });

  beforeEach(() => {
    vi.clearAllMocks();

    // Default Supabase mock responses
    mockSupabase.auth.getUser.mockReset();
    mockSupabase.from.mockReset();

    mockSupabase.from.mockImplementation(() => ({
      select: vi.fn().mockImplementation(() => makeChain({ data: [], error: null })),
      insert: vi.fn().mockImplementation(() => makeChain({ data: {}, error: null })),
      update: vi.fn().mockImplementation(() => makeChain({ data: {}, error: null })),
    }));
  });

  // Scenario 1: Token Ausente
  it('deve retornar erro 401 quando o token estiver ausente', async () => {
    const res = await request(app)
      .post('/api/loans')
      .send({
        bookId: 'book-123',
        borrowerName: 'João Silva',
        dueDate: '2026-08-20',
      });

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHENTICATED');
    expect(res.body.error.message).toContain('Token de autorização não fornecido ou inválido.');
    expect(res.body.error.requestId).toBeDefined();
    // Ensure no technical stack or internal leaks exist in response body
    expect(res.body.error.stack).toBeUndefined();
  });

  // Scenario 2: Token Inválido
  it('deve retornar erro 401 quando o token for inválido', async () => {
    mockSupabase.auth.getUser.mockResolvedValueOnce({
      data: null,
      error: { message: 'Invalid token' },
    });

    const res = await request(app)
      .post('/api/loans')
      .set('Authorization', 'Bearer invalid-token-abc')
      .send({
        bookId: 'book-123',
        borrowerName: 'João Silva',
        dueDate: '2026-08-20',
      });

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHENTICATED');
    expect(res.body.error.message).toContain('Não autorizado: Token inválido ou expirado.');
    expect(res.body.error.requestId).toBeDefined();
    // Ensure no technical message leak
    expect(res.body.error.message).not.toContain('Invalid token');
  });

  // Scenario 3: Token Válido & Criação de Empréstimo com Sucesso
  it('deve registrar empréstimo com sucesso com token válido e livro correto', async () => {
    // Mock authentication
    mockSupabase.auth.getUser.mockResolvedValueOnce({
      data: { user: { id: 'user-123', email: 'user@example.com' } },
      error: null,
    });

    // Mock database tables behavior
    const mockBook = { title: 'Livro de Teste', author: 'Autor de Teste' };
    const mockCreatedLoan = { id: 'loan-123', book_id: 'book-123', borrower_name: 'João Silva', status: 'active' };

    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'books') {
        return {
          select: vi.fn().mockImplementation(() => makeChain({ data: mockBook, error: null })),
          update: vi.fn().mockImplementation(() => makeChain({ data: null, error: null })),
        };
      }
      if (table === 'loans') {
        return {
          insert: vi.fn().mockImplementation(() => makeChain({ data: mockCreatedLoan, error: null })),
        };
      }
      return {
        select: vi.fn().mockImplementation(() => makeChain({ data: [], error: null })),
        insert: vi.fn().mockImplementation(() => makeChain({ data: {}, error: null })),
        update: vi.fn().mockImplementation(() => makeChain({ data: {}, error: null })),
      };
    });

    const res = await request(app)
      .post('/api/loans')
      .set('Authorization', 'Bearer valid-token-123')
      .send({
        bookId: 'book-123',
        borrowerName: 'João Silva',
        borrowerEmail: 'joao@example.com',
        dueDate: '2026-08-20',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.loan).toEqual(mockCreatedLoan);
  });

  // Scenario 4: Livro Inexistente
  it('deve retornar erro 404 ao tentar emprestar um livro inexistente', async () => {
    mockSupabase.auth.getUser.mockResolvedValueOnce({
      data: { user: { id: 'user-123' } },
      error: null,
    });

    // Mock book search returning Not Found (null)
    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'books') {
        return {
          select: vi.fn().mockImplementation(() => makeChain({ data: null, error: null })),
        };
      }
      return {
        select: vi.fn().mockImplementation(() => makeChain({ data: [], error: null })),
      };
    });

    const res = await request(app)
      .post('/api/loans')
      .set('Authorization', 'Bearer valid-token-123')
      .send({
        bookId: 'book-inexistente',
        borrowerName: 'João Silva',
        dueDate: '2026-08-20',
      });

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
    expect(res.body.error.message).toContain('Livro não encontrado ou não pertence a este usuário.');
    expect(res.body.error.requestId).toBeDefined();
  });

  // Scenario 5: Livro pertencente a outro usuário
  it('deve retornar erro 404 ao tentar emprestar um livro que pertence a outro usuário', async () => {
    mockSupabase.auth.getUser.mockResolvedValueOnce({
      data: { user: { id: 'user-123' } },
      error: null,
    });

    // Books table query filters by user_id. If book belongs to user-999, query returns null
    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'books') {
        return {
          select: vi.fn().mockImplementation(() => makeChain({ data: null, error: { message: 'Row not found due to user_id mismatch' } })),
        };
      }
      return {
        select: vi.fn().mockImplementation(() => makeChain({ data: [], error: null })),
      };
    });

    const res = await request(app)
      .post('/api/loans')
      .set('Authorization', 'Bearer valid-token-123')
      .send({
        bookId: 'book-outro-usuario',
        borrowerName: 'João Silva',
        dueDate: '2026-08-20',
      });

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
    expect(res.body.error.message).toContain('Livro não encontrado ou não pertence a este usuário.');
    // Check defense in depth: the database error message is fully stripped
    expect(res.body.error.message).not.toContain('user_id mismatch');
    expect(res.body.error.requestId).toBeDefined();
  });

  // Scenario 6: Empréstimo pertencente a outro usuário (ao tentar devolver)
  it('deve retornar erro 404 ao tentar devolver um empréstimo de outro usuário', async () => {
    mockSupabase.auth.getUser.mockResolvedValueOnce({
      data: { user: { id: 'user-123' } },
      error: null,
    });

    // Loan query filters by user_id. If loan belongs to user-999, query returns null
    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'loans') {
        return {
          select: vi.fn().mockImplementation(() => makeChain({ data: null, error: { message: 'Row not found' } })),
        };
      }
      return {
        select: vi.fn().mockImplementation(() => makeChain({ data: [], error: null })),
      };
    });

    const res = await request(app)
      .patch('/api/loans/loan-outro-usuario/return')
      .set('Authorization', 'Bearer valid-token-123')
      .send();

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
    expect(res.body.error.message).toContain('Empréstimo não encontrado ou não pertence a este usuário.');
    expect(res.body.error.requestId).toBeDefined();
  });

  // Scenario 7: Devolução com Sucesso
  it('deve finalizar o empréstimo com sucesso ao realizar a devolução', async () => {
    mockSupabase.auth.getUser.mockResolvedValueOnce({
      data: { user: { id: 'user-123' } },
      error: null,
    });

    const mockLoan = { book_id: 'book-123', borrower_name: 'João Silva', user_id: 'user-123' };
    const mockUpdatedLoan = { id: 'loan-123', status: 'returned', return_date: new Date().toISOString() };

    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'loans') {
        return {
          select: vi.fn().mockImplementation(() => makeChain({ data: mockLoan, error: null })),
          update: vi.fn().mockImplementation(() => makeChain({ data: mockUpdatedLoan, error: null })),
        };
      }
      if (table === 'books') {
        return {
          update: vi.fn().mockImplementation(() => makeChain({ data: null, error: null })),
        };
      }
      return {
        select: vi.fn().mockImplementation(() => makeChain({ data: [], error: null })),
      };
    });

    const res = await request(app)
      .patch('/api/loans/loan-123/return')
      .set('Authorization', 'Bearer valid-token-123')
      .send();

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.loan.status).toBe('returned');
  });

  // Scenario 8: Falha do Supabase na inserção de empréstimo
  it('deve retornar erro seguro 500 sem vazar a mensagem técnica quando o Supabase falhar', async () => {
    mockSupabase.auth.getUser.mockResolvedValueOnce({
      data: { user: { id: 'user-123' } },
      error: null,
    });

    const mockBook = { title: 'Livro de Teste', author: 'Autor de Teste' };

    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'books') {
        return {
          select: vi.fn().mockImplementation(() => makeChain({ data: mockBook, error: null })),
        };
      }
      if (table === 'loans') {
        return {
          // Simulate fatal database exception
          insert: vi.fn().mockImplementation(() => makeChain({ data: null, error: { message: 'Fatal Postgresql Exception: relation "loans" does not exist' } })),
        };
      }
      return {
        select: vi.fn().mockImplementation(() => makeChain({ data: [], error: null })),
      };
    });

    const res = await request(app)
      .post('/api/loans')
      .set('Authorization', 'Bearer valid-token-123')
      .send({
        bookId: 'book-123',
        borrowerName: 'João Silva',
        dueDate: '2026-08-20',
      });

    expect(res.status).toBe(500);
    expect(res.body.error.code).toBe('INTERNAL_ERROR');
    expect(res.body.error.message).toContain('Não foi possível concluir a operação.');
    // Check that the technical Postgresql error message is fully stripped/masked
    expect(res.body.error.message).not.toContain('relation "loans" does not exist');
    expect(res.body.error.message).not.toContain('Fatal Postgresql Exception');
    expect(res.body.error.requestId).toBeDefined();
  });
});
