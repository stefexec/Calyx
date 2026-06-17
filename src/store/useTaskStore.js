import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { addDays, startOfDay } from 'date-fns';

export const TaskCategory = {
  WATERING: 'Watering',
  NUTRIENTS: 'Nutrients',
  TRAINING: 'Training/Pruning',
  PHASE_SHIFT: 'Phase Shift (e.g. Flower)',
  FLUSHING: 'Flushing',
  HARVEST: 'Harvest',
  OTHER: 'Other'
};

const useTaskStore = create(
  persist(
    (set, get) => ({
      tasks: [
        {
          id: 't1',
          date: startOfDay(new Date()).toISOString(),
          plantId: 'p1',
          category: TaskCategory.WATERING,
          description: 'Water (1.5L) + BioBizz Week 3',
          isCompleted: false
        },
        {
          id: 't2',
          date: startOfDay(addDays(new Date(), 3)).toISOString(),
          plantId: 'p2',
          category: TaskCategory.TRAINING,
          description: 'Defoliation & LST Adjustments',
          isCompleted: false
        }
      ],
      addTask: (task) => set((state) => ({ 
        tasks: [...state.tasks, { ...task, id: Date.now().toString(36) + Math.random().toString(36).substring(2), isCompleted: false }] 
      })),
      toggleTaskCompletion: (id) => set((state) => ({
        tasks: state.tasks.map(t => t.id === id ? { ...t, isCompleted: !t.isCompleted } : t)
      })),
      deleteTask: (id) => set((state) => ({
        tasks: state.tasks.filter(t => t.id !== id)
      })),
    }),
    {
      name: 'calyx-task-storage',
    }
  )
);

export default useTaskStore;
