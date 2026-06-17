import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const GrowMedium = {
  SOIL: 'Soil',
  COCO: 'Coco',
  HYDROPONICS: 'Hydroponics',
  AEROPONICS: 'Aeroponics'
};

const useEnvironmentStore = create(
  persist(
    (set, get) => ({
      environments: [
        {
          id: '1',
          name: 'Tent #1 - Vegi',
          growMedium: GrowMedium.SOIL,
          lightHoursOn: 18,
          lightHoursOff: 6,
          homeAssistantSensors: ['sensor.tent1_temp', 'sensor.tent1_humidity'],
          plugConfig: {
            light: { enabled: true, entityId: 'switch.tent1_light', isOn: true },
            exhaust: { enabled: true, entityId: 'switch.tent1_exhaust', isOn: true },
            humidifier: { enabled: false, entityId: '', isOn: false }
          },
          history: Array.from({ length: 24 }).map((_, i) => ({
            time: `${i}:00`,
            temp: 24 + Math.sin(i / 3) * 2,
            rh: 60 + Math.cos(i / 3) * 10,
            vpd: 0.8 + Math.sin(i / 4) * 0.2
          }))
        },
        {
          id: '2',
          name: 'Tent #2 - Flower',
          growMedium: GrowMedium.SOIL,
          lightHoursOn: 12,
          lightHoursOff: 12,
          homeAssistantSensors: ['sensor.tent2_temp', 'sensor.tent2_humidity'],
          plugConfig: {
            light: { enabled: true, entityId: 'switch.tent2_light', isOn: false },
            exhaust: { enabled: true, entityId: 'switch.tent2_exhaust', isOn: true },
            humidifier: { enabled: false, entityId: '', isOn: false }
          },
          history: Array.from({ length: 24 }).map((_, i) => ({
            time: `${i}:00`,
            temp: 26 + Math.sin(i / 4) * 1.5,
            rh: 50 + Math.cos(i / 2) * 5,
            vpd: 1.2 + Math.sin(i / 3) * 0.1
          }))
        }
      ],
      addEnvironment: (env) => set((state) => ({ 
        environments: [...state.environments, { 
          ...env, 
          homeAssistantSensors: [],
          plugConfig: {
            light: { enabled: true, entityId: '', isOn: false },
            exhaust: { enabled: true, entityId: '', isOn: false },
            humidifier: { enabled: true, entityId: '', isOn: false }
          },
          history: [] 
        }] 
      })),
      updateEnvironment: (id, updatedEnv) => set((state) => ({
        environments: state.environments.map(e => e.id === id ? { ...e, ...updatedEnv } : e)
      })),
      togglePlug: (envId, plugName) => set((state) => ({
        environments: state.environments.map(e => 
          e.id === envId 
            ? { ...e, plugConfig: { ...e.plugConfig, [plugName]: { ...e.plugConfig[plugName], isOn: !e.plugConfig[plugName].isOn } } } 
            : e
        )
      })),
      updatePlugConfig: (envId, plugName, configUpdate) => set((state) => ({
        environments: state.environments.map(e => 
          e.id === envId 
            ? { ...e, plugConfig: { ...e.plugConfig, [plugName]: { ...e.plugConfig[plugName], ...configUpdate } } } 
            : e
        )
      })),
      deleteEnvironment: (id) => set((state) => ({
        environments: state.environments.filter(e => e.id !== id)
      })),
    }),
    {
      name: 'calyx-environment-storage',
    }
  )
);

export default useEnvironmentStore;
