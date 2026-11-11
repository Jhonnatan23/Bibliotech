// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { EmptyState } from './EmptyState';

describe('EmptyState Reusable Component (Roadmap Item #4)', () => {
  it('renders title, description and literary illustration', () => {
    render(
      <EmptyState
        title="Nenhum livro nesta estante ainda"
        description="Explore novas histórias ou cadastre seus títulos para acompanhar sua leitura."
        illustration="bookshelf"
      />
    );

    expect(screen.getByText('Nenhum livro nesta estante ainda')).toBeInTheDocument();
    expect(screen.getByText(/Explore novas histórias ou cadastre seus títulos/i)).toBeInTheDocument();
    expect(screen.getByTestId('empty-state-container')).toBeInTheDocument();
  });

  it('renders primary call-to-action button and triggers onClick handler', () => {
    const handlePrimaryClick = vi.fn();
    render(
      <EmptyState
        title="Sua lista de desejos está vazia"
        description="Adicione livros para planejar suas futuras leituras."
        illustration="wishlist"
        primaryAction={{
          label: 'Adicionar Primeiro Desejo',
          onClick: handlePrimaryClick,
          'data-testid': 'custom-primary-btn',
        }}
      />
    );

    const btn = screen.getByTestId('custom-primary-btn');
    expect(btn).toBeInTheDocument();
    expect(btn).toHaveTextContent('Adicionar Primeiro Desejo');

    fireEvent.click(btn);
    expect(handlePrimaryClick).toHaveBeenCalledTimes(1);
  });

  it('renders secondary action button when provided', () => {
    const handleSecondary = vi.fn();
    render(
      <EmptyState
        title="Nenhuma coleção cadastrada"
        description="Agrupe suas sagas favoritas em um só lugar."
        illustration="series"
        primaryAction={{
          label: 'Criar Nova Saga',
          onClick: vi.fn(),
        }}
        secondaryAction={{
          label: 'Buscar no Catálogo',
          onClick: handleSecondary,
          'data-testid': 'custom-secondary-btn',
        }}
      />
    );

    const secondaryBtn = screen.getByTestId('custom-secondary-btn');
    expect(secondaryBtn).toBeInTheDocument();
    expect(secondaryBtn).toHaveTextContent('Buscar no Catálogo');

    fireEvent.click(secondaryBtn);
    expect(handleSecondary).toHaveBeenCalledTimes(1);
  });

  it('renders custom icon when supplied', () => {
    render(
      <EmptyState
        title="Sem registros"
        description="Nenhum dado encontrado."
        customIcon={<span data-testid="custom-svg-icon">✨</span>}
      />
    );

    expect(screen.getByTestId('custom-svg-icon')).toBeInTheDocument();
  });
});
