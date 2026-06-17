import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { addDays } from 'date-fns';

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

const usePlantStore = create(
  persist(
    (set, get) => ({
      plants: [
        {
          id: 'p1',
          environmentId: '1',
          name: 'KES #1',
          strainName: 'Super Lemon Haze',
          strainType: StrainType.PHOTOPERIODIC,
          dateGerminated: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 days ago
          dateFlippedToFlower: null,
          currentPhase: PlantPhase.VEGETATION,
          image: null,
          hasSoilMoistureSensor: true,
          currentMoistureLevel: 25, // 25% (Needs watering soon)
          history: Array.from({ length: 24 }).map((_, i) => ({
            time: `${i}:00`,
            moisture: 45 - i * 0.8,
            temp: 22 + Math.sin(i / 3) * 1.5,
            lux: i > 6 && i < 20 ? 40000 + Math.sin(i / 4) * 5000 : 0
          }))
        },
        {
          id: 'p2',
          environmentId: '2',
          name: 'KES #2',
          strainName: 'Super Lemon Haze',
          strainType: StrainType.PHOTOPERIODIC,
          dateGerminated: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString(),
          dateFlippedToFlower: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
          currentPhase: PlantPhase.FLOWERING,
          image: null,
          hasSoilMoistureSensor: false,
          currentMoistureLevel: null,
          history: []
        }
      ],
      addPlant: (plant) => set((state) => ({ plants: [...state.plants, { ...plant, image: plant.image || null, hasSoilMoistureSensor: false, currentMoistureLevel: null, history: [] }] })),
      updatePlant: (id, updatedPlant) => set((state) => ({
        plants: state.plants.map(p => p.id === id ? { ...p, ...updatedPlant } : p)
      })),
      toggleMoistureSensor: (id, isEnabled) => set((state) => ({
        plants: state.plants.map(p => p.id === id ? { ...p, hasSoilMoistureSensor: isEnabled, currentMoistureLevel: isEnabled ? 50 : null, history: isEnabled ? [] : [] } : p)
      })),
      deletePlant: (id) => set((state) => ({
        plants: state.plants.filter(p => p.id !== id)
      })),
    }),
    {
      name: 'calyx-plant-storage',
    }
  )
);

export default usePlantStore;
