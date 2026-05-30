// ============================================
// HUNTLO SALES OS — KEYBOARD HOOK
// ============================================
import { useEffect } from 'react';

export function useKeyboard(bindings) {
  useEffect(() => {
    const handler = (e) => {
      for (const [combo, fn] of Object.entries(bindings)) {
        const parts = combo.split('+');
        const key = parts[parts.length - 1].toLowerCase();
        const needsCtrl = parts.includes('ctrl') || parts.includes('cmd');
        const needsShift = parts.includes('shift');
        const needsAlt = parts.includes('alt');

        const ctrlMatch = !needsCtrl || (e.ctrlKey || e.metaKey);
        const shiftMatch = !needsShift || e.shiftKey;
        const altMatch = !needsAlt || e.altKey;
        const keyMatch = e.key.toLowerCase() === key;

        if (ctrlMatch && shiftMatch && altMatch && keyMatch) {
          e.preventDefault();
          fn(e);
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [bindings]);
}
