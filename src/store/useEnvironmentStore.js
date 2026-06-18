import { create } from 'zustand';
import { fetchApi } from '../utils/api';

export const GrowMedium = {
  SOIL: 'Soil',
  COCO: 'Coco',
  HYDROPONICS: 'Hydroponics',
  AEROPONICS: 'Aeroponics'
};

const useEnvironmentStore = create((set, get) => ({
  environments: [],
  isLoading: false,
  error: null,

  fetchEnvironments: async () => {
    set({ isLoading: true, error: null });
    try {
      const data = await fetchApi('/environments/');
      // Map backend model to frontend model where needed
      const mapped = data.map(env => ({
        id: env.id,
        name: env.name,
        growMedium: env.medium || GrowMedium.SOIL,
        lightHoursOn: 18, // Legacy local prop (not in backend schema, defaulting)
        lightHoursOff: 6,
        homeAssistantSensors: env.ha_entity_ids || [],
        plugConfig: env.plug_config || {
          light: { enabled: true, entityId: '', isOn: false },
          exhaust: { enabled: true, entityId: '', isOn: false },
          humidifier: { enabled: true, entityId: '', isOn: false }
        },
        history: [] // Sensor history was local mock, keeping empty array
      }));
      set({ environments: mapped, isLoading: false });
    } catch (error) {
      set({ error: error.message, isLoading: false });
    }
  },

  addEnvironment: async (env) => {
    try {
      const payload = {
        name: env.name,
        medium: env.growMedium,
        ha_entity_ids: env.homeAssistantSensors || [],
        plug_config: env.plugConfig || {
          light: { enabled: true, entityId: '', isOn: false },
          exhaust: { enabled: true, entityId: '', isOn: false },
          humidifier: { enabled: true, entityId: '', isOn: false }
        }
      };
      const created = await fetchApi('/environments/', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      
      const newEnv = {
        id: created.id,
        name: created.name,
        growMedium: created.medium || GrowMedium.SOIL,
        lightHoursOn: env.lightHoursOn || 18,
        lightHoursOff: env.lightHoursOff || 6,
        homeAssistantSensors: created.ha_entity_ids || [],
        plugConfig: env.plugConfig || {
          light: { enabled: true, entityId: '', isOn: false },
          exhaust: { enabled: true, entityId: '', isOn: false },
          humidifier: { enabled: true, entityId: '', isOn: false }
        },
        history: []
      };

      set((state) => ({ environments: [...state.environments, newEnv] }));
    } catch (error) {
      console.error("Failed to add environment", error);
    }
  },

  updateEnvironment: async (id, updatedEnv) => {
    set((state) => ({
      environments: state.environments.map(e => e.id === id ? { ...e, ...updatedEnv } : e)
    }));
    try {
      // Create a payload matching backend schema
      const payload = {
        name: updatedEnv.name,
        medium: updatedEnv.growMedium,
        ha_entity_ids: updatedEnv.homeAssistantSensors,
        plug_config: updatedEnv.plugConfig
      };
      
      // Clean up undefined properties
      Object.keys(payload).forEach(key => payload[key] === undefined && delete payload[key]);

      await fetchApi(`/environments/${id}`, {
        method: 'PUT',
        body: JSON.stringify(payload)
      });
    } catch (error) {
      console.error("Failed to update environment", error);
    }
  },

  deleteEnvironment: async (id) => {
    try {
      await fetchApi(`/environments/${id}`, { method: 'DELETE' });
      set((state) => ({
        environments: state.environments.filter(e => e.id !== id)
      }));
    } catch (error) {
      console.error("Failed to delete environment", error);
    }
  },

  // Client-side only toggles (since plug states aren't persisted in backend schema)
  togglePlug: (envId, plugName) => set((state) => ({
    environments: state.environments.map(e => {
      if (e.id !== envId) return e;
      const currentPlugConfig = e.plugConfig?.[plugName] || { isOn: !!e.plugs?.[plugName] };
      return {
        ...e,
        plugConfig: {
          ...(e.plugConfig || {}),
          [plugName]: { ...currentPlugConfig, isOn: !currentPlugConfig.isOn }
        }
      };
    })
  })),

  updatePlugConfig: async (envId, plugName, configUpdate) => {
    // Optimistically update UI
    set((state) => ({
      environments: state.environments.map(e => 
        e.id === envId 
          ? { ...e, plugConfig: { ...(e.plugConfig || {}), [plugName]: { ...(e.plugConfig?.[plugName] || {}), ...configUpdate } } } 
          : e
      )
    }));
    
    // Sync to backend
    const updatedEnv = get().environments.find(e => e.id === envId);
    if (updatedEnv) {
      get().updateEnvironment(envId, { plugConfig: updatedEnv.plugConfig });
    }
  }
}));

export default useEnvironmentStore;
