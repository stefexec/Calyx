import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useGalleryStore = create(
  persist(
    (set) => ({
      images: [],
      addGalleryImage: (imageObj) => set((state) => ({ 
        images: [{
          id: Date.now().toString(36) + Math.random().toString(36).substring(2),
          timestamp: new Date().toISOString(),
          ...imageObj
        }, ...state.images] 
      })),
      deleteGalleryImage: (id) => set((state) => ({
        images: state.images.filter(img => img.id !== id)
      })),
    }),
    {
      name: 'calyx-gallery-storage',
    }
  )
);

export default useGalleryStore;
