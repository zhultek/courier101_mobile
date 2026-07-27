import { create } from 'zustand';

interface UiState {
  menuOpen: boolean;
  openMenu: () => void;
  closeMenu: () => void;
}

export const useUi = create<UiState>((set) => ({
  menuOpen: false,
  openMenu: () => set({ menuOpen: true }),
  closeMenu: () => set({ menuOpen: false }),
}));
