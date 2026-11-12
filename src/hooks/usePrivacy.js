import { useContext } from 'react';
import { PrivacyContext } from '../context/privacyContextInstance';

export function usePrivacy() {
  const ctx = useContext(PrivacyContext);
  if (!ctx) {
    return {
      isMoneyHidden: false,
      toggleGlobalPrivacy: () => {},
      revealedKeys: new Set(),
      toggleRevealKey: () => {},
      isKeyRevealed: () => false,
    };
  }
  return ctx;
}
