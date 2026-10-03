import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useCalculatorStore = create(
  persist(
    (set, get) => ({
      // Admin Config settings
      config: {
        standardPlans: [
          { id: 'monthly', name: 'Monthly', price: 10000, duration: 1, capacity: { search: 300, mobile: 300, whatsapp: 500, voice: 1000, seats: 2 } },
          { id: 'quarterly', name: 'Quarterly', price: 27000, duration: 3, capacity: { search: 400, mobile: 500, whatsapp: 600, voice: 1000, seats: 3 } },
          { id: '6month', name: '6-Month', price: 48000, duration: 6, capacity: { search: 500, mobile: 750, whatsapp: 750, voice: 1000, seats: 5 } },
          { id: 'annual', name: 'Annual', price: 90000, duration: 12, capacity: { search: 600, mobile: 1000, whatsapp: 1000, voice: 1000, seats: 5 } },
        ],
        pricingProfiles: [
          {
            id: 'standard',
            name: 'Standard',
            search: 2,
            mobile: 2,
            whatsapp: 5,
            voice: { tier1Max: 10000, tier1Price: 5, tier2Max: 25000, tier2Price: 4.5 }
          },
          {
            id: 'custom_high_volume',
            name: 'Custom High-Volume',
            search: 2,
            mobile: 2,
            whatsapp: 3,
            voice: { tier1Max: 10000, tier1Price: 4.5, tier2Max: 25000, tier2Price: 4.5 }
          }
        ],
        cogs: {
          search: 0.5,
          mobile: 0.5,
          whatsapp: 0.8,
          voice: 1.5,
          setup: 0,
          integration: 0,
          support: 0
        },
        controls: {
          targetMargin: 50,
          minimumMargin: 50,
          maxSalesDiscount: 10,
          maxSalesHeadDiscount: 20,
          minimumSellingPrice: 5000,
          gstRate: 18,
          defaultValidityDays: 15
        }
      },

      updateConfig: (newConfig) => set((state) => ({ config: { ...state.config, ...newConfig } })),
      
      updateStandardPlan: (id, updates) => set((state) => ({
        config: {
          ...state.config,
          standardPlans: state.config.standardPlans.map(plan => plan.id === id ? { ...plan, ...updates } : plan)
        }
      })),

      updateCogs: (updates) => set((state) => ({
        config: { ...state.config, cogs: { ...state.config.cogs, ...updates } }
      })),
      
      updateControls: (updates) => set((state) => ({
        config: { ...state.config, controls: { ...state.config.controls, ...updates } }
      })),

      // Quotes history
      quotes: [],
      saveQuote: (quote) => set((state) => ({
        quotes: [{ ...quote, id: `QT-${Date.now()}`, createdAt: new Date().toISOString() }, ...state.quotes]
      }))
    }),
    {
      name: 'huntlo-calculator-config-v2',
    }
  )
);

export default useCalculatorStore;
