import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useNutrientStore = create(
  persist(
    (set, get) => ({
      brands: ['BioBizz', 'Advanced Nutrients', 'Canna', 'Plagron'],
      products: [
        { id: 'prod1', brand: 'BioBizz', name: 'Grow' },
        { id: 'prod2', brand: 'BioBizz', name: 'Bloom' },
        { id: 'prod3', brand: 'BioBizz', name: 'Top-Max' },
      ],
      recipes: [
        {
          id: 'rec1',
          name: 'BioBizz Week 3 Veg',
          ingredients: [
            { productId: 'prod1', mlPerLiter: 2.0 },
          ]
        },
        {
          id: 'rec2',
          name: 'BioBizz Week 3 Flower',
          ingredients: [
            { productId: 'prod1', mlPerLiter: 1.0 },
            { productId: 'prod2', mlPerLiter: 2.0 },
            { productId: 'prod3', mlPerLiter: 1.0 },
          ]
        }
      ],
      addRecipe: (recipe) => set((state) => ({ recipes: [...state.recipes, recipe] })),
      deleteRecipe: (id) => set((state) => ({ recipes: state.recipes.filter(r => r.id !== id) })),
    }),
    {
      name: 'calyx-nutrient-storage',
    }
  )
);

export default useNutrientStore;
