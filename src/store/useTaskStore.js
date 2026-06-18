import { create } from 'zustand';
import { fetchApi } from '../utils/api';

export const TaskCategory = {
  WATERING: 'Watering',
  NUTRIENTS: 'Nutrients',
  TRAINING: 'Training/Pruning',
  PHASE_SHIFT: 'Phase Shift (e.g. Flower)',
  FLUSHING: 'Flushing',
  HARVEST: 'Harvest',
  OTHER: 'Other'
};

const useTaskStore = create((set, get) => ({
  tasks: [],
  isLoading: false,

  fetchTasks: async () => {
    set({ isLoading: true });
    try {
      const data = await fetchApi('/tasks/');
      const mapped = data.map(task => ({
        id: task.id,
        date: task.date ? task.date + "Z" : new Date().toISOString(),
        plantId: task.plant_id,
        category: task.category,
        description: task.description,
        isCompleted: task.is_completed || false
      }));
      set({ tasks: mapped, isLoading: false });
    } catch (error) {
      console.error("Failed to fetch tasks", error);
      set({ isLoading: false });
    }
  },

  addTask: async (task) => {
    try {
      const payload = {
        date: task.date ? new Date(task.date).toISOString().replace('Z', '') : null,
        plant_id: task.plantId,
        category: task.category,
        description: task.description,
        is_completed: task.isCompleted || false
      };

      const created = await fetchApi('/tasks/', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      const newTask = {
        id: created.id,
        date: created.date ? created.date + "Z" : new Date().toISOString(),
        plantId: created.plant_id,
        category: created.category,
        description: created.description,
        isCompleted: created.is_completed || false
      };

      set((state) => ({ 
        tasks: [...state.tasks, newTask]
      }));
    } catch (error) {
      console.error("Failed to add task", error);
    }
  },

  toggleTaskCompletion: async (id) => {
    try {
      const task = get().tasks.find(t => t.id === id);
      if (!task) return;
      
      const newStatus = !task.isCompleted;
      await fetchApi(`/tasks/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ is_completed: newStatus })
      });

      set((state) => ({
        tasks: state.tasks.map(t => t.id === id ? { ...t, isCompleted: newStatus } : t)
      }));
    } catch (error) {
      console.error("Failed to toggle task", error);
    }
  },

  deleteTask: async (id) => {
    try {
      await fetchApi(`/tasks/${id}`, { method: 'DELETE' });
      set((state) => ({
        tasks: state.tasks.filter(t => t.id !== id)
      }));
    } catch (error) {
      console.error("Failed to delete task", error);
    }
  }
}));

export default useTaskStore;
