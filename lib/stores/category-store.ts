"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"

export interface Category {
  id: string
  name: string
  createdAt: string
}

interface CategoryStore {
  categories: Category[]
  addCategory: (category: Category) => void
  updateCategory: (id: string, updates: Partial<Category>) => void
  removeCategory: (id: string) => void
  initializeSampleCategories: () => void
}

export const useCategoryStore = create<CategoryStore>()(
  persist(
    (set, get) => ({
      // Initialize with empty array instead of mock data
      categories: [],

      addCategory: (category) => {
        set((state) => {
          console.log("Adding category:", category.name)
          return { categories: [...state.categories, category] }
        })
      },

      updateCategory: (id, updates) => {
        set((state) => {
          console.log("Updating category:", id, updates)
          return {
            categories: state.categories.map((category) =>
              category.id === id ? { ...category, ...updates } : category,
            ),
          }
        })
      },

      removeCategory: (id) => {
        set((state) => {
          console.log("Removing category:", id)
          return {
            categories: state.categories.filter((category) => category.id !== id),
          }
        })
      },

      // Add a function to initialize sample categories
      initializeSampleCategories: () => {
        const { categories } = get()

        // Only add sample categories if there are none yet
        if (categories.length > 0) {
          console.log("Sample categories not initialized - categories already exist")
          return
        }

        const now = new Date().toISOString()

        // Create sample categories
        const sampleCategories: Category[] = [
          {
            id: "cat-rock",
            name: "Rock",
            createdAt: now,
          },
          {
            id: "cat-alternative",
            name: "Alternative",
            createdAt: now,
          },
          {
            id: "cat-pop",
            name: "Pop",
            createdAt: now,
          },
          {
            id: "cat-electronic",
            name: "Electronic",
            createdAt: now,
          },
          {
            id: "cat-hiphop",
            name: "Hip-Hop",
            createdAt: now,
          },
          {
            id: "cat-rnb",
            name: "R&B",
            createdAt: now,
          },
        ]

        // Add the sample categories
        set((state) => ({
          categories: [...state.categories, ...sampleCategories],
        }))

        console.log("Sample categories initialized with 6 categories")
      },
    }),
    {
      name: "lyrics-manager-categories",
      // This is the key fix - we need to merge the stored data with the initial state
      merge: (persistedState: any, currentState) => {
        // If there's persisted state, use it
        if (persistedState && persistedState.categories && persistedState.categories.length > 0) {
          console.log("Loading persisted categories from storage:", persistedState.categories.length)

          return {
            ...currentState,
            categories: persistedState.categories,
          }
        }

        // Otherwise use the current state (which is now an empty array)
        console.log("No persisted categories found, using empty array")
        return currentState
      },
      // Add storage event listener to sync across tabs
      storage: {
        getItem: (name) => {
          try {
            const value = localStorage.getItem(name)
            return value ? JSON.parse(value) : null
          } catch (error) {
            console.error("Error getting item from localStorage:", error)
            return null
          }
        },
        setItem: (name, value) => {
          try {
            console.log("Saving to localStorage:", name)
            localStorage.setItem(name, JSON.stringify(value))
          } catch (error) {
            console.error("Error setting item in localStorage:", error)
          }
        },
        removeItem: (name) => {
          try {
            localStorage.removeItem(name)
          } catch (error) {
            console.error("Error removing item from localStorage:", error)
          }
        },
      },
    },
  ),
)

