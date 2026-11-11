// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DesignSystemView } from './DesignSystemView';

describe('DesignSystemView component tests', () => {
  const mockBack = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the design system title and tabs', () => {
    render(<DesignSystemView onBackToApp={mockBack} />);

    expect(screen.getByText(/Design System & UI Kit/i)).toBeInTheDocument();
    expect(screen.getByText(/BiblioTech Design System · v1.0/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Voltar à Estante/i })).toBeInTheDocument();

    // Check tab navigation items
    expect(screen.getByRole('button', { name: /Cores & Tokens/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Tipografia/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Componentes UI/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Padrões Literários/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Diretrizes & Filosofia/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Playground Vivo/i })).toBeInTheDocument();
  });

  it('displays color tokens and allows copying', () => {
    // Mock navigator.clipboard
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockImplementation(() => Promise.resolve()),
      },
    });

    render(<DesignSystemView onBackToApp={mockBack} />);

    // Primary token should be visible
    expect(screen.getByText(/Primary \(Prussian Navy\)/i)).toBeInTheDocument();
    expect(screen.getByText(/#274C68/i)).toBeInTheDocument();

    // Click on the primary token card to copy
    const tokenCard = screen.getByText(/Primary \(Prussian Navy\)/i).closest('div');
    if (tokenCard) {
      fireEvent.click(tokenCard);
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith('#274C68');
    }
  });

  it('navigates to Typography tab and shows Lora and Inter specs', () => {
    render(<DesignSystemView onBackToApp={mockBack} />);

    const typoTab = screen.getByRole('button', { name: /Tipografia/i });
    fireEvent.click(typoTab);

    expect(screen.getByText(/Sistema Tipográfico Editorial/i)).toBeInTheDocument();
    expect(screen.getByText(/A Alma dos Livros/i)).toBeInTheDocument();
    expect(screen.getByText(/Gestão 100% Precisa/i)).toBeInTheDocument();
  });

  it('navigates to Principles tab and displays anti-slop guidelines', () => {
    render(<DesignSystemView onBackToApp={mockBack} />);

    const principlesTab = screen.getByRole('button', { name: /Diretrizes & Filosofia/i });
    fireEvent.click(principlesTab);

    expect(screen.getByText(/Diretrizes de Design & Anti-Slop/i)).toBeInTheDocument();
    expect(screen.getByText(/Anti-Patterns Proibidos/i)).toBeInTheDocument();
    expect(screen.getByText(/Padrões Obrigatórios/i)).toBeInTheDocument();
  });

  it('navigates to Playground tab and updates interactive button controls', () => {
    render(<DesignSystemView onBackToApp={mockBack} />);

    const playgroundTab = screen.getByRole('button', { name: /Playground Vivo/i });
    fireEvent.click(playgroundTab);

    expect(screen.getByText(/Playground Interativo de Componentes/i)).toBeInTheDocument();

    // Change button text
    const textInput = screen.getByDisplayValue('Salvar Alterações');
    fireEvent.change(textInput, { target: { value: 'Comprar Livro Agora' } });

    // The rendered button inside the playground should reflect the updated text
    expect(screen.getAllByText('Comprar Livro Agora').length).toBeGreaterThanOrEqual(1);
  });
});
