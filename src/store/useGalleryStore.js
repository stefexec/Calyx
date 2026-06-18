import { create } from 'zustand';
import { fetchApi, HOST_URL } from '../utils/api';

const useGalleryStore = create((set) => ({
  images: [],
  isLoading: false,

  fetchGallery: async () => {
    set({ isLoading: true });
    try {
      const data = await fetchApi('/gallery/');
      const mapped = data.map(img => ({
        id: img.id,
        plantId: img.plant_id,
        timestamp: img.timestamp ? img.timestamp + "Z" : new Date().toISOString(),
        daysSinceGermination: img.days_since_germination,
        phase: img.phase,
        fileUrl: `${HOST_URL}${img.file_path}`
      }));
      set({ images: mapped, isLoading: false });
    } catch (error) {
      console.error("Failed to fetch gallery", error);
      set({ isLoading: false });
    }
  },

  addGalleryImage: async (imageObj, file) => {
    try {
      // Prepare FormData since backend expects multipart/form-data
      const formData = new FormData();
      formData.append('plant_id', imageObj.plantId);
      if (imageObj.daysSinceGermination !== undefined) {
        formData.append('days_since_germination', imageObj.daysSinceGermination);
      }
      if (imageObj.phase) {
        formData.append('phase', imageObj.phase);
      }
      formData.append('file', file); // The actual File object from <input>

      const created = await fetchApi('/gallery/upload', {
        method: 'POST',
        body: formData // do not stringify, do not set content-type header manually
      });

      const newImg = {
        id: created.id,
        plantId: created.plant_id,
        timestamp: created.timestamp ? created.timestamp + "Z" : new Date().toISOString(),
        daysSinceGermination: created.days_since_germination,
        phase: created.phase,
        fileUrl: `${HOST_URL}${created.file_path}`
      };

      set((state) => ({ 
        images: [newImg, ...state.images].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      }));
      
      return newImg;
    } catch (error) {
      console.error("Failed to add gallery image", error);
    }
  },

  deleteGalleryImage: async (id) => {
    try {
      await fetchApi(`/gallery/${id}`, { method: 'DELETE' });
      set((state) => ({
        images: state.images.filter(img => img.id !== id)
      }));
    } catch (error) {
      console.error("Failed to delete gallery image", error);
    }
  }
}));

export default useGalleryStore;
