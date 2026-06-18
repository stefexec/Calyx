import { create } from 'zustand';
import { fetchApi } from '../utils/api';
import useSettingsStore from './useSettingsStore';

export const StrainType = {
  PHOTOPERIODIC: 'Photoperiodic',
  AUTO: 'Auto',
  REGULAR: 'Regular'
};

export const PlantPhase = {
  GERMINATION: 'Germination',
  VEGETATION: 'Vegetation',
  FLOWERING: 'Flowering',
  FLUSHED: 'Flushed',
  HARVESTED: 'Harvested'
};

const usePlantStore = create((set, get) => ({
  plants: [],
  isLoading: false,

  fetchPlants: async () => {
    set({ isLoading: true });
    try {
      const data = await fetchApi('/plants/');
      const mapped = data.map(plant => ({
        id: plant.id,
        environmentId: plant.environment_id,
        name: plant.name,
        strainName: plant.strain || '',
        strainType: plant.type || StrainType.PHOTOPERIODIC,
        dateGerminated: plant.date_germinated ? plant.date_germinated + "Z" : null,
        dateFlippedToFlower: plant.date_flipped ? plant.date_flipped + "Z" : null,
        currentPhase: plant.current_phase || PlantPhase.GERMINATION,
        hasSoilMoistureSensor: plant.has_soil_moisture_sensor || false,
        trackEC: true, // Default local settings
        trackPH: true,
        currentMoistureLevel: null,
        history: [], // Local mock history for charts
        image: null // Wait for gallery fetch to display profile
      }));
      set({ plants: mapped, isLoading: false });
    } catch (error) {
      console.error("Failed to fetch plants", error);
      set({ isLoading: false });
    }
  },

  addPlant: async (plant) => {
    try {
      const payload = {
        environment_id: plant.environmentId,
        name: plant.name,
        strain: plant.strainName,
        type: plant.strainType,
        current_phase: plant.currentPhase,
        date_germinated: plant.dateGerminated ? new Date(plant.dateGerminated).toISOString().replace('Z', '') : null,
        has_soil_moisture_sensor: plant.hasSoilMoistureSensor || false
      };
      
      const created = await fetchApi('/plants/', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      const newPlant = {
        id: created.id,
        environmentId: created.environment_id,
        name: created.name,
        strainName: created.strain || '',
        strainType: created.type || StrainType.PHOTOPERIODIC,
        dateGerminated: created.date_germinated ? created.date_germinated + "Z" : null,
        dateFlippedToFlower: created.date_flipped ? created.date_flipped + "Z" : null,
        currentPhase: created.current_phase || PlantPhase.GERMINATION,
        hasSoilMoistureSensor: created.has_soil_moisture_sensor || false,
        trackEC: true,
        trackPH: true,
        currentMoistureLevel: null,
        history: [],
        image: plant.image || null
      };

      set((state) => ({ plants: [...state.plants, newPlant] }));
      
      // Automatic harvest task scheduling
      if (plant.flowerDays) {
        try {
          const { defaultVegDays } = useSettingsStore.getState();
          const germDate = new Date(plant.dateGerminated || new Date());
          const estHarvestDate = new Date(germDate);
          
          if (plant.strainType === StrainType.AUTOFLOWER) {
            estHarvestDate.setDate(germDate.getDate() + plant.flowerDays);
          } else {
            estHarvestDate.setDate(germDate.getDate() + defaultVegDays + plant.flowerDays);
          }
          
          await fetchApi('/tasks/', {
            method: 'POST',
            body: JSON.stringify({
              date: estHarvestDate.toISOString().replace('Z', ''),
              plant_id: created.id,
              category: 'harvest',
              description: `Estimated Harvest Date for ${created.name} (${created.strain})`
            })
          });
        } catch (err) {
          console.error("Failed to schedule harvest task", err);
        }
      }

      return newPlant;
    } catch (error) {
      console.error("Failed to add plant", error);
    }
  },

  updatePlant: async (id, updatedPlant) => {
    set((state) => ({
      plants: state.plants.map(p => p.id === id ? { ...p, ...updatedPlant } : p)
    }));
    try {
      // Create partial payload mapped to backend schema
      const payload = {};
      if (updatedPlant.environmentId !== undefined) payload.environment_id = updatedPlant.environmentId;
      if (updatedPlant.name !== undefined) payload.name = updatedPlant.name;
      if (updatedPlant.strainName !== undefined) payload.strain = updatedPlant.strainName;
      if (updatedPlant.strainType !== undefined) payload.type = updatedPlant.strainType;
      if (updatedPlant.currentPhase !== undefined) payload.current_phase = updatedPlant.currentPhase;
      if (updatedPlant.dateGerminated !== undefined) payload.date_germinated = updatedPlant.dateGerminated ? new Date(updatedPlant.dateGerminated).toISOString().replace('Z', '') : null;
      if (updatedPlant.dateFlippedToFlower !== undefined) payload.date_flipped = updatedPlant.dateFlippedToFlower ? new Date(updatedPlant.dateFlippedToFlower).toISOString().replace('Z', '') : null;
      if (updatedPlant.hasSoilMoistureSensor !== undefined) payload.has_soil_moisture_sensor = updatedPlant.hasSoilMoistureSensor;

      // Only send PUT if there are backend fields to update
      if (Object.keys(payload).length > 0) {
        await fetchApi(`/plants/${id}`, {
          method: 'PUT',
          body: JSON.stringify(payload)
        });
      }
    } catch (error) {
      console.error("Failed to update plant", error);
    }
  },

  toggleMoistureSensor: async (id, isEnabled) => {
    set((state) => ({
      plants: state.plants.map(p => p.id === id ? { ...p, hasSoilMoistureSensor: isEnabled, currentMoistureLevel: isEnabled ? 50 : null, history: isEnabled ? [] : [] } : p)
    }));
    try {
      await fetchApi(`/plants/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ has_soil_moisture_sensor: isEnabled })
      });
    } catch (error) {
      console.error("Failed to toggle sensor", error);
    }
  },

  deletePlant: async (id) => {
    try {
      await fetchApi(`/plants/${id}`, { method: 'DELETE' });
      set((state) => ({
        plants: state.plants.filter(p => p.id !== id)
      }));
    } catch (error) {
      console.error("Failed to delete plant", error);
    }
  }
}));

export default usePlantStore;
