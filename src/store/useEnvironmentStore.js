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
      const currentEnvs = get().environments;
      // Map backend model to frontend model where needed
      const mapped = data.map(env => {
        const existing = currentEnvs.find(e => e.id === env.id);
        return {
          id: env.id,
          name: env.name,
          growMedium: env.medium || GrowMedium.SOIL,
          lightHoursOn: 18, // Legacy local prop (not in backend schema, defaulting)
          lightHoursOff: 6,
          homeAssistantSensors: env.ha_entity_ids || [],
          tempSensor: env.ha_entity_ids ? env.ha_entity_ids[0] : '',
          rhSensor: env.ha_entity_ids ? env.ha_entity_ids[1] : '',
          luxSensor: env.ha_entity_ids ? env.ha_entity_ids[2] : '',
          plugConfig: existing && existing.plugConfig ? existing.plugConfig : (env.plug_config || {
            light: { enabled: true, entityId: '', isOn: false },
            exhaust: { enabled: true, entityId: '', isOn: false },
            humidifier: { enabled: true, entityId: '', isOn: false }
          }),
          history: existing && existing.history ? existing.history : [] 
        };
      });
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
        tempSensor: created.ha_entity_ids ? created.ha_entity_ids[0] : '',
        rhSensor: created.ha_entity_ids ? created.ha_entity_ids[1] : '',
        luxSensor: created.ha_entity_ids ? created.ha_entity_ids[2] : '',
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

  // HA toggle plug
  togglePlug: async (envId, plugName) => {
    const env = get().environments.find(e => e.id === envId);
    if (!env) return;
    
    const currentPlugConfig = env.plugConfig?.[plugName] || { isOn: false, entityId: '' };
    const entityId = currentPlugConfig.entityId;
    const newState = !currentPlugConfig.isOn;

    // Optimistically update UI
    set((state) => ({
      environments: state.environments.map(e => {
        if (e.id !== envId) return e;
        return {
          ...e,
          plugConfig: {
            ...(e.plugConfig || {}),
            [plugName]: { ...currentPlugConfig, isOn: newState }
          }
        };
      })
    }));

    if (entityId) {
      const domain = entityId.split('.')[0] || 'homeassistant';
      const service = newState ? 'turn_on' : 'turn_off';
      try {
        await fetchApi(`/ha/services/${domain}/${service}`, {
          method: 'POST',
          body: JSON.stringify({ entity_id: entityId })
        });
      } catch (error) {
        console.error("Failed to toggle plug in HA", error);
        // Revert on failure
        set((state) => ({
          environments: state.environments.map(e => {
            if (e.id !== envId) return e;
            return {
              ...e,
              plugConfig: {
                ...(e.plugConfig || {}),
                [plugName]: { ...currentPlugConfig, isOn: !newState }
              }
            };
          })
        }));
      }
    }
  },

  fetchPlugStates: async () => {
    const environments = get().environments;
    
    for (const env of environments) {
      if (!env.plugConfig) continue;
      
      let updated = false;
      const newPlugConfig = { ...env.plugConfig };
      
      for (const [plugName, config] of Object.entries(env.plugConfig)) {
        if (config.enabled && config.entityId) {
          try {
            const stateRes = await fetchApi(`/ha/states/${config.entityId}`);
            if (stateRes && stateRes.state) {
              const isOn = stateRes.state === 'on';
              if (config.isOn !== isOn) {
                newPlugConfig[plugName] = { ...config, isOn };
                updated = true;
              }
            }
          } catch (e) {
            // silent fail for states
          }
        }
      }
      
      if (updated) {
        set((state) => ({
          environments: state.environments.map(e => e.id === env.id ? { ...e, plugConfig: newPlugConfig } : e)
        }));
      }
    }
  },

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
  },

  fetchHistory: async (envId) => {
    const env = get().environments.find(e => e.id === envId);
    if (!env || !env.tempSensor) return;

    try {
      // Fetch temp and rh history
      const tempRes = await fetchApi(`/ha/history/${env.tempSensor}`);
      let rhRes = null;
      if (env.rhSensor) {
        rhRes = await fetchApi(`/ha/history/${env.rhSensor}`);
      }

      // Process history for Recharts
      // HA History returns an array of arrays [[{state: '24', last_updated: '...'}]]
      const historyData = [];
      if (tempRes && tempRes.length > 0 && tempRes[0].length > 0) {
        const tempStates = tempRes[0];
        const rhStates = rhRes && rhRes.length > 0 ? rhRes[0] : [];
        
        // Let's sample max 24 points to not overload the chart
        const step = Math.max(1, Math.floor(tempStates.length / 24));
        for (let i = 0; i < tempStates.length; i += step) {
          const tState = tempStates[i];
          const time = new Date(tState.last_changed).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          
          // Find closest RH state
          let rhVal = 0;
          if (rhStates.length > 0) {
            // Find the closest state by absolute time difference
            const tTime = new Date(tState.last_changed).getTime();
            let closestRh = rhStates[0];
            let minDiff = Infinity;
            
            for (const r of rhStates) {
              const rTime = new Date(r.last_changed).getTime();
              const diff = Math.abs(rTime - tTime);
              if (diff < minDiff) {
                minDiff = diff;
                closestRh = r;
              }
            }
            
            // Only use it if it's within a reasonable timeframe (e.g. 2 hours)
            if (minDiff < 7200000) {
              rhVal = parseFloat(closestRh.state);
            }
          }

          historyData.push({
            time,
            temp: parseFloat(tState.state) || 0,
            rh: rhVal || 0
          });
        }
      }

      set((state) => ({
        environments: state.environments.map(e => e.id === envId ? { ...e, history: historyData } : e)
      }));
    } catch (error) {
      console.error("Failed to fetch HA history", error);
    }
  }
}));

export default useEnvironmentStore;
