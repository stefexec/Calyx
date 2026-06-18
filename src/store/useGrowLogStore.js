import { create } from 'zustand';
import { fetchApi } from '../utils/api';

export const TrainingAction = {
  TOPPING: 'Topping',
  FIMING: 'FIMing',
  LST: 'LST',
  DEFOLIATION: 'Defoliation',
  REPOTTING: 'Repotting'
};

const useGrowLogStore = create((set, get) => ({
  logs: [],
  isLoading: false,

  fetchLogsForPlant: async (plantId) => {
    set({ isLoading: true });
    try {
      const data = await fetchApi(`/logs/plant/${plantId}`);
      const mapped = data.map(log => ({
        id: log.id,
        plantId: log.plant_id,
        timestamp: log.timestamp ? log.timestamp + "Z" : new Date().toISOString(),
        waterVolumeLiters: log.water_amount,
        ecInput: log.ec,
        phInput: log.ph,
        notes: log.notes,
        appliedRecipeId: log.recipe_id,
        recipeScale: log.recipe_scale
      }));
      
      set((state) => {
        // Remove existing logs for this plant, then append new ones
        const otherLogs = state.logs.filter(l => l.plantId !== plantId);
        return { logs: [...otherLogs, ...mapped], isLoading: false };
      });
    } catch (error) {
      console.error("Failed to fetch logs", error);
      set({ isLoading: false });
    }
  },

  addLog: async (log) => {
    try {
      const payload = {
        plant_id: log.plantId,
        water_amount: log.waterVolumeLiters,
        ec: log.ecInput,
        ph: log.phInput,
        recipe_id: log.appliedRecipeId,
        recipe_scale: log.recipeScale,
        notes: log.notes
      };

      const created = await fetchApi('/logs/', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      const newLog = {
        id: created.id,
        plantId: created.plant_id,
        timestamp: created.timestamp ? created.timestamp + "Z" : new Date().toISOString(),
        waterVolumeLiters: created.water_amount,
        ecInput: created.ec,
        phInput: created.ph,
        notes: created.notes,
        appliedRecipeId: created.recipe_id,
        recipeScale: created.recipe_scale
      };

      set((state) => ({ 
        logs: [newLog, ...state.logs].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      }));
    } catch (error) {
      console.error("Failed to add log", error);
    }
  },

  deleteLog: async (id) => {
    try {
      await fetchApi(`/logs/${id}`, { method: 'DELETE' });
      set((state) => ({ logs: state.logs.filter(l => l.id !== id) }));
    } catch (error) {
      console.error("Failed to delete log", error);
    }
  }
}));

export default useGrowLogStore;
