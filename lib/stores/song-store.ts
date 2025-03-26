"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"

// Update the section interface to support multiple artists
export interface SongVersion {
  id: string
  timestamp: string
  lyrics: string
  sections: {
    start: number
    end: number
    type: string
    artists?: string[]
  }[]
  arrangement?: {
    type: string
    start: number
    end: number
    artists?: string[]
  }[]
}

export interface Song {
  id: string
  title: string
  lyrics: string
  sections: {
    start: number
    end: number
    type: string
    artists?: string[]
  }[]
  arrangement?: {
    type: string
    start: number
    end: number
    artists?: string[]
  }[]
  previousArrangement?:
    | {
        type: string
        start: number
        end: number
        artists?: string[]
      }[]
    | null
  versions: SongVersion[]
  categories: string[]
  featuredArtists?: string[]
  createdAt: string
  updatedAt: string
}

interface SongStore {
  songs: Song[]
  addSong: (song: Song) => void
  updateSong: (song: Song) => void
  removeSong: (id: string) => void
  saveSongArrangement: (
    id: string,
    arrangement: { type: string; start: number; end: number; artists?: string[] }[],
  ) => void
  restorePreviousArrangement: (id: string) => void
}

export const useSongStore = create<SongStore>()(
  persist(
    (set, get) => ({
      // Initialize with empty array instead of mock data
      songs: [],

      addSong: (song) => {
        set((state) => {
          const newSongs = [...state.songs, song]
          console.log("Adding song:", song.id)
          return { songs: newSongs }
        })
      },

      updateSong: (updatedSong) => {
        set((state) => {
          console.log("Updating song:", updatedSong.id, {
            title: updatedSong.title,
            featuredArtists: updatedSong.featuredArtists,
            categories: updatedSong.categories,
            sections: updatedSong.sections?.length,
          })

          return {
            songs: state.songs.map((song) => (song.id === updatedSong.id ? updatedSong : song)),
          }
        })
      },

      removeSong: (id) => {
        set((state) => ({
          songs: state.songs.filter((song) => song.id !== id),
        }))
      },

      saveSongArrangement: (id, arrangement) => {
        const { songs } = get()
        const song = songs.find((s) => s.id === id)

        if (!song) {
          console.error("Song not found when saving arrangement:", id)
          return
        }

        try {
          // Store current arrangement as previous before updating
          const updatedSong = {
            ...song,
            previousArrangement: song.arrangement ? [...song.arrangement] : null,
            arrangement: [...arrangement],
            updatedAt: new Date().toISOString(),
          }

          // Create a new version
          const newVersion = {
            id: Date.now().toString(),
            timestamp: new Date().toISOString(),
            lyrics: song.lyrics,
            sections: song.sections,
            arrangement: [...arrangement],
          }

          updatedSong.versions = [...(song.versions || []), newVersion]

          // Log the update for debugging
          console.log("Updating song with new arrangement:", {
            songId: id,
            arrangementLength: arrangement.length,
          })

          set({
            songs: songs.map((s) => (s.id === id ? updatedSong : s)),
          })
        } catch (error) {
          console.error("Error saving song arrangement:", error)
        }
      },

      restorePreviousArrangement: (id) => {
        const { songs } = get()
        const song = songs.find((s) => s.id === id)

        if (!song) {
          console.error("Song not found when restoring arrangement:", id)
          return
        }

        if (!song.previousArrangement) {
          console.error("No previous arrangement to restore for song:", id)
          return
        }

        try {
          // Restore the previous arrangement
          const updatedSong = {
            ...song,
            arrangement: [...song.previousArrangement],
            previousArrangement: null, // Clear the previous arrangement
            updatedAt: new Date().toISOString(),
          }

          // Log the update for debugging
          console.log("Restoring previous arrangement:", {
            songId: id,
            arrangementLength: song.previousArrangement.length,
          })

          set({
            songs: songs.map((s) => (s.id === id ? updatedSong : s)),
          })
        } catch (error) {
          console.error("Error restoring previous arrangement:", error)
        }
      },
    }),
    {
      name: "lyrics-manager-songs",
      // This is the key fix - we need to merge the stored data with the initial state
      // instead of replacing it completely
      merge: (persistedState: any, currentState) => {
        // If there's persisted state, use it
        if (persistedState && persistedState.songs && persistedState.songs.length > 0) {
          console.log("Loading persisted songs from storage:", persistedState.songs.length)

          // Log the first song to help with debugging
          if (persistedState.songs[0]) {
            console.log("First persisted song:", {
              id: persistedState.songs[0].id,
              title: persistedState.songs[0].title,
              categories: persistedState.songs[0].categories,
              featuredArtists: persistedState.songs[0].featuredArtists,
            })
          }

          return {
            ...currentState,
            songs: persistedState.songs,
          }
        }

        // Otherwise use the current state (which is now an empty array)
        console.log("No persisted songs found, using empty array")
        return currentState
      },
      // Add storage event listener to sync across tabs
      storage: {
        getItem: (name) => {
          try {
            const value = localStorage.getItem(name)
            console.log(`Retrieved ${name} from localStorage, exists: ${!!value}`)
            return value ? JSON.parse(value) : null
          } catch (error) {
            console.error("Error getting item from localStorage:", error)
            return null
          }
        },
        setItem: (name, value) => {
          try {
            console.log(`Saving ${name} to localStorage, data size: ${JSON.stringify(value).length} bytes`)
            localStorage.setItem(name, JSON.stringify(value))
          } catch (error) {
            console.error("Error setting item in localStorage:", error)
          }
        },
        removeItem: (name) => {
          try {
            console.log(`Removing ${name} from localStorage`)
            localStorage.removeItem(name)
          } catch (error) {
            console.error("Error removing item from localStorage:", error)
          }
        },
      },
    },
  ),
)

