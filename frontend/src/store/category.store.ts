import { create } from "zustand";
import { apiClient } from "@/services/api/client";
import { categoryDisplayName } from "@/lib/format";
import { useAuthStore } from "@/store/auth.store";
import { CreateCategoryBody, UpdateCategoryBody } from "@/types/api";

export type Category = {
  id: string;
  name: string;
  type: "INCOME" | "EXPENSE" | string;
  icon: string | null;
  createdAt: string;
  updatedAt: string;
};

type CategoryState = {
  categories: Category[];
  isLoading: boolean;
  hasFetched: boolean;
  fetchCategories: () => Promise<void>;
  createCategory: (
    name: string,
    type: "INCOME" | "EXPENSE",
    icon?: string,
  ) => Promise<Category>;
  updateCategory: (id: string, data: UpdateCategoryBody) => Promise<Category>;
  deleteCategory: (id: string) => Promise<void>;
};

async function renameLegacyCategories(categories: Category[]) {
  return Promise.all(
    categories.map(async (category) => {
      const englishName = categoryDisplayName(category.name);
      if (englishName === category.name) return category;
      try {
        const response = await apiClient.patch<Category>(
          `/categories/${category.id}`,
          {
            name: englishName,
          },
        );
        return response.data;
      } catch {
        return { ...category, name: englishName };
      }
    }),
  );
}

export const useCategoryStore = create<CategoryState>((set, get) => ({
  categories: [],
  isLoading: false,
  hasFetched: false,

  fetchCategories: async () => {
    if (!useAuthStore.getState().token) return;

    set({ isLoading: true });
    try {
      const response = await apiClient.get<Category[]>("/categories");
      const categories = await renameLegacyCategories(response.data);
      set({ categories, hasFetched: true });
    } catch (error) {
      console.error("Failed to fetch categories:", error);
      set({ hasFetched: true });
    } finally {
      set({ isLoading: false });
    }
  },

  createCategory: async (name, type, icon) => {
    const payload: CreateCategoryBody = {
      name,
      type,
      icon: icon || undefined,
    };
    const response = await apiClient.post<Category>("/categories", payload);
    set({ categories: [...get().categories, response.data] });
    return response.data;
  },

  updateCategory: async (id, data) => {
    const response = await apiClient.patch<Category>(`/categories/${id}`, data);
    set({
      categories: get().categories.map((c) =>
        c.id === id ? response.data : c,
      ),
    });
    return response.data;
  },

  deleteCategory: async (id) => {
    await apiClient.delete(`/categories/${id}`);
    set({
      categories: get().categories.filter((c) => c.id !== id),
    });
  },
}));
