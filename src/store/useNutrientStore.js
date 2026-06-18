import { create } from 'zustand';
import { fetchApi } from '../utils/api';

const useNutrientStore = create((set, get) => ({
  brands: ['BioBizz', 'Advanced Nutrients', 'Canna', 'Plagron'], // Can be static for now or computed from products
  products: [],
  recipes: [],
  isLoading: false,

  fetchNutrients: async () => {
    set({ isLoading: true });
    try {
      const [productsData, recipesData] = await Promise.all([
        fetchApi('/nutrients/products'),
        fetchApi('/nutrients/recipes')
      ]);
      
      const mappedProducts = productsData.map(p => ({
        id: p.id, brand: p.brand, name: p.name
      }));
      
      const mappedRecipes = recipesData.map(r => ({
        id: r.id, name: r.name, ingredients: r.ingredients || []
      }));
      
      set({ products: mappedProducts, recipes: mappedRecipes, isLoading: false });
    } catch (error) {
      console.error("Failed to fetch nutrients", error);
      set({ isLoading: false });
    }
  },

  addProduct: async (product) => {
    try {
      const created = await fetchApi('/nutrients/products', {
        method: 'POST',
        body: JSON.stringify({ brand: product.brand, name: product.name })
      });
      set((state) => ({ products: [...state.products, created] }));
    } catch (error) {
      console.error("Failed to add product", error);
    }
  },

  addRecipe: async (recipe) => {
    try {
      const created = await fetchApi('/nutrients/recipes', {
        method: 'POST',
        body: JSON.stringify({ name: recipe.name, ingredients: recipe.ingredients })
      });
      set((state) => ({ recipes: [...state.recipes, created] }));
    } catch (error) {
      console.error("Failed to add recipe", error);
    }
  },

  deleteRecipe: async (id) => {
    try {
      await fetchApi(`/nutrients/recipes/${id}`, { method: 'DELETE' });
      set((state) => ({ recipes: state.recipes.filter(r => r.id !== id) }));
    } catch (error) {
      console.error("Failed to delete recipe", error);
    }
  }
}));

export default useNutrientStore;
