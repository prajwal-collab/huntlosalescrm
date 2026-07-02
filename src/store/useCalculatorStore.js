import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useCalculatorStore = create(
  persist(
    (set, get) => ({
      // Admin Config settings
      config: {
        india: {
          searchCost: 2,
          emailRevealCost: 1,
          mobileRevealCost: 2,
          emailOutreachCost: 1,
          whatsappCost: 5,
          aiVoiceCost: 5, // per min
        },
        international: { // UAE / USA
          searchCost: 2,
          emailRevealCost: 1,
          mobileRevealCost: 2,
          emailOutreachCost: 1,
          whatsappCost: 10,
          aiVoiceCost: 8, // per min
        },
        margin: 50, // Percentage
        quarterlyDiscount: 5, // Percentage
        annualDiscount: 12, // Percentage
      },

      // Update config settings
      updateConfig: (newConfig) => set((state) => ({ config: { ...state.config, ...newConfig } })),
      
      // Update specific regional config
      updateRegionalConfig: (region, values) => set((state) => ({
        config: {
          ...state.config,
          [region]: { ...state.config[region], ...values }
        }
      })),

    }),
    {
      name: 'huntlo-calculator-config',
    }
  )
);

export default useCalculatorStore;
