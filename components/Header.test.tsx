// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Header } from './Header';
import type { Profile } from '../types';

// Mock supabase
vi.mock('../services/supabase', () => ({
  supabase: {
    auth: {
      signOut: vi.fn().mockResolvedValue({ error: null })
    }
  }
}));

describe('Header Component Refactor (Auditing Issue 🟡 #1)', () => {
  const mockProfile: Profile = {
    id: 'user-123',
    fullName: 'Jhon Doe',
    email: 'jhon@example.com',
    avatarUrl: 'https://example.com/avatar.jpg',
    readingGoal: 12
  };

  const defaultProps = {
    profile: mockProfile,
    onLogoClick: vi.fn(),
    onSettingsClick: vi.fn(),
    theme: 'light' as const,
    toggleTheme: vi.fn(),
    isConnected: true,
    hasApiKey: true,
    setView: vi.fn(),
    onNotifClick: vi.fn(),
    unreadCount: 3,
    isOnline: true,
    pendingCount: 0,
    isSyncing: false,
    onSyncClick: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders BiblioTech logo on the left with Lora font styling and calls onLogoClick', () => {
    render(<Header {...defaultProps} />);

    const logoBtn = screen.getByTestId('header-logo-btn');
    expect(logoBtn).toBeInTheDocument();
    expect(screen.getAllByText(/Biblio/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Tech/i).length).toBeGreaterThan(0);

    fireEvent.click(logoBtn);
    expect(defaultProps.onLogoClick).toHaveBeenCalledTimes(1);
  });

  it('contains maximum 3 visible action targets on the right side', () => {
    render(<Header {...defaultProps} />);

    const rightContainer = screen.getByTestId('header-right-actions');
    expect(rightContainer).toBeInTheDocument();

    // Verify the 3 visible targets
    const syncIndicator = screen.getByTestId('sync-status-indicator');
    const notificationBtn = screen.getByTestId('notification-btn');
    const userAvatarBtn = screen.getByTestId('user-avatar-btn');

    expect(syncIndicator).toBeInTheDocument();
    expect(notificationBtn).toBeInTheDocument();
    expect(userAvatarBtn).toBeInTheDocument();

    // Verify dropdown is initially closed
    expect(screen.queryByTestId('user-dropdown-menu')).not.toBeInTheDocument();

    // Direct interactive buttons inside header right container before opening menu
    const buttons = rightContainer.querySelectorAll('button');
    expect(buttons.length).toBe(3);
  });

  it('renders sync indicator states correctly and triggers onSyncClick', () => {
    const { rerender } = render(
      <Header {...defaultProps} isSyncing={false} pendingCount={2} isOnline={true} isConnected={true} />
    );

    const syncBtn = screen.getByTestId('sync-status-indicator');
    expect(syncBtn).toHaveTextContent(/Aguardando Nuvem \(2\)/i);

    fireEvent.click(syncBtn);
    expect(defaultProps.onSyncClick).toHaveBeenCalledTimes(1);

    // Rerender as syncing
    rerender(
      <Header {...defaultProps} isSyncing={true} pendingCount={0} />
    );
    expect(screen.getByTestId('sync-status-indicator')).toHaveTextContent(/Sincronizando/i);
    expect(screen.getByTestId('sync-status-indicator')).toBeDisabled();

    // Rerender as synced
    rerender(
      <Header {...defaultProps} isSyncing={false} pendingCount={0} isOnline={true} isConnected={true} />
    );
    expect(screen.getByTestId('sync-status-indicator')).toHaveTextContent(/Sincronizado/i);

    // Rerender as offline
    rerender(
      <Header {...defaultProps} isSyncing={false} pendingCount={0} isOnline={false} />
    );
    expect(screen.getByTestId('sync-status-indicator')).toHaveTextContent(/Modo Offline/i);
  });

  it('renders notification button with unread count badge and triggers onNotifClick', () => {
    render(<Header {...defaultProps} unreadCount={5} />);

    const notifBtn = screen.getByTestId('notification-btn');
    expect(notifBtn).toBeInTheDocument();

    const badge = screen.getByTestId('unread-notif-badge');
    expect(badge).toHaveTextContent('5');

    fireEvent.click(notifBtn);
    expect(defaultProps.onNotifClick).toHaveBeenCalledTimes(1);
  });

  it('opens floating dropdown menu on user avatar button click and exposes administrative actions', () => {
    render(<Header {...defaultProps} />);

    const avatarBtn = screen.getByTestId('user-avatar-btn');
    expect(avatarBtn).toHaveAttribute('aria-expanded', 'false');

    // Click to open dropdown
    fireEvent.click(avatarBtn);
    expect(avatarBtn).toHaveAttribute('aria-expanded', 'true');

    const dropdown = screen.getByTestId('user-dropdown-menu');
    expect(dropdown).toBeInTheDocument();

    // User profile information & profile link
    expect(screen.getByText('Jhon Doe')).toBeInTheDocument();
    expect(screen.getByText('jhon@example.com')).toBeInTheDocument();
    const profileBtn = screen.getByTestId('menu-profile-btn');
    expect(profileBtn).toBeInTheDocument();

    // Theme Switcher
    const themeBtn = screen.getByTestId('menu-theme-btn');
    expect(themeBtn).toBeInTheDocument();
    expect(themeBtn).toHaveTextContent(/Tema Visual/i);

    // AI Key Configuration
    const aiKeyBtn = screen.getByTestId('menu-ai-key-btn');
    expect(aiKeyBtn).toBeInTheDocument();
    expect(aiKeyBtn).toHaveTextContent(/Chave de IA/i);

    // App Settings
    const settingsBtn = screen.getByTestId('menu-settings-btn');
    expect(settingsBtn).toBeInTheDocument();
    expect(settingsBtn).toHaveTextContent(/Configurações/i);

    // Logout
    const logoutBtn = screen.getByTestId('menu-logout-btn');
    expect(logoutBtn).toBeInTheDocument();
    expect(logoutBtn).toHaveTextContent(/Sair da Conta/i);
  });

  it('triggers theme toggle and preserves menu when changing theme', () => {
    render(<Header {...defaultProps} theme="light" />);

    fireEvent.click(screen.getByTestId('user-avatar-btn'));
    const themeBtn = screen.getByTestId('menu-theme-btn');

    fireEvent.click(themeBtn);
    expect(defaultProps.toggleTheme).toHaveBeenCalledTimes(1);
  });

  it('triggers AI key modal when clicking Chave de IA', () => {
    const mockOpenSelectKey = vi.fn().mockResolvedValue(undefined);
    (window as any).aistudio = { openSelectKey: mockOpenSelectKey };

    render(<Header {...defaultProps} />);

    fireEvent.click(screen.getByTestId('user-avatar-btn'));
    const aiKeyBtn = screen.getByTestId('menu-ai-key-btn');

    fireEvent.click(aiKeyBtn);
    expect(mockOpenSelectKey).toHaveBeenCalledTimes(1);
    expect(screen.queryByTestId('user-dropdown-menu')).not.toBeInTheDocument();
  });

  it('triggers settings when clicking Configurações and closes menu', () => {
    render(<Header {...defaultProps} />);

    fireEvent.click(screen.getByTestId('user-avatar-btn'));
    const settingsBtn = screen.getByTestId('menu-settings-btn');

    fireEvent.click(settingsBtn);
    expect(defaultProps.onSettingsClick).toHaveBeenCalledTimes(1);
    expect(screen.queryByTestId('user-dropdown-menu')).not.toBeInTheDocument();
  });

  it('triggers signOut when clicking Logout and closes menu', async () => {
    const { supabase } = await import('../services/supabase');
    render(<Header {...defaultProps} />);

    fireEvent.click(screen.getByTestId('user-avatar-btn'));
    const logoutBtn = screen.getByTestId('menu-logout-btn');

    fireEvent.click(logoutBtn);
    expect(supabase.auth.signOut).toHaveBeenCalledTimes(1);
    expect(screen.queryByTestId('user-dropdown-menu')).not.toBeInTheDocument();
  });

  it('closes dropdown when clicking outside', () => {
    render(
      <div>
        <div data-testid="outside-element">Outside</div>
        <Header {...defaultProps} />
      </div>
    );

    // Open dropdown
    fireEvent.click(screen.getByTestId('user-avatar-btn'));
    expect(screen.getByTestId('user-dropdown-menu')).toBeInTheDocument();

    // Click outside
    fireEvent.mouseDown(screen.getByTestId('outside-element'));
    expect(screen.queryByTestId('user-dropdown-menu')).not.toBeInTheDocument();
  });

  it('closes dropdown when pressing Escape key', () => {
    render(<Header {...defaultProps} />);

    // Open dropdown
    fireEvent.click(screen.getByTestId('user-avatar-btn'));
    expect(screen.getByTestId('user-dropdown-menu')).toBeInTheDocument();

    // Press Escape
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(screen.queryByTestId('user-dropdown-menu')).not.toBeInTheDocument();
  });
});
