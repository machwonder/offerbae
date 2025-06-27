import { create } from 'zustand';
import type { Coupon } from '@/lib/types';

interface ModalData {
  coupon?: Coupon;
  url?: string;
}

type ModalType = 'coupon' | 'redirect' | 'termsOfService' | 'privacyPolicy';

interface ModalStore {
  type: ModalType | null;
  data: ModalData;
  isOpen: boolean;
  onOpen: (type: ModalType, data?: ModalData) => void;
  onClose: () => void;
}

export const useModal = create<ModalStore>((set) => ({
  type: null,
  data: {},
  isOpen: false,
  onOpen: (type, data = {}) => {
    // Combined flow: show redirect modal, open link, then show coupon modal
    if (type === 'redirect' && data.url && data.coupon) {
      set({ isOpen: true, type: 'redirect', data: {} });
      setTimeout(() => {
        window.open(data.url, '_blank', 'noopener,noreferrer');
        set({ isOpen: true, type: 'coupon', data: { coupon: data.coupon } });
      }, 1000);
    } 
    // Simple redirect flow: show redirect modal, open link, then close
    else if (type === 'redirect' && data.url) {
      set({ isOpen: true, type: 'redirect', data: {} });
      setTimeout(() => {
        window.open(data.url, '_blank', 'noopener,noreferrer');
        set({ isOpen: false, type: null, data: {} });
      }, 1000);
    }
    // Direct modal open (e.g., for sharing a coupon link which opens on page load)
    else {
      set({ isOpen: true, type, data });
    }
  },
  onClose: () => set({ type: null, isOpen: false, data: {} }),
}));
