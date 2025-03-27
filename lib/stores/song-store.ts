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
  initializeSampleData: () => void
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

      // Add a function to initialize sample data
      initializeSampleData: () => {
        const { songs } = get()

        // Only add sample data if there are no songs yet
        if (songs.length > 0) {
          console.log("Sample data not initialized - songs already exist")
          return
        }

        const now = new Date().toISOString()
        const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
        const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()

        // Create sample songs with mock lyrics
        const sampleSongs: Song[] = [
          {
            id: "mock-song-1",
            title: "Echoes of Tomorrow",
            lyrics:
              "Silent whispers in the night\nEchoes of a distant light\nMemories fade into the blue\nAs I find my way back to you\n\nChorus:\nTime keeps flowing like a river\nChanging landscapes as it goes\nBut my heart remains forever\nIn the place where your love grows\n\nVerse 2:\nStars align in cosmic dance\nGiving dreamers one more chance\nThrough the darkness we will find\nPaths that heal a troubled mind\n\nBridge:\nBreaking through the walls of doubt\nLetting all the light shine out\nEvery moment, every day\nGuides us on our way\n\nChorus:\nTime keeps flowing like a river\nChanging landscapes as it goes\nBut my heart remains forever\nIn the place where your love grows",
            sections: [
              {
                start: 0,
                end: 107,
                type: "verse",
                artists: ["Me"],
              },
              {
                start: 108,
                end: 237,
                type: "chorus",
                artists: ["Me", "Alex Turner"],
              },
              {
                start: 238,
                end: 345,
                type: "verse",
                artists: ["Alex Turner"],
              },
              {
                start: 346,
                end: 435,
                type: "bridge",
                artists: ["Me"],
              },
              {
                start: 436,
                end: 565,
                type: "chorus",
                artists: ["Me", "Alex Turner"],
              },
            ],
            arrangement: [
              {
                type: "verse",
                start: 0,
                end: 107,
                artists: ["Me"],
              },
              {
                type: "chorus",
                start: 108,
                end: 237,
                artists: ["Me", "Alex Turner"],
              },
              {
                type: "verse",
                start: 238,
                end: 345,
                artists: ["Alex Turner"],
              },
              {
                type: "bridge",
                start: 346,
                end: 435,
                artists: ["Me"],
              },
              {
                type: "chorus",
                start: 436,
                end: 565,
                artists: ["Me", "Alex Turner"],
              },
            ],
            versions: [
              {
                id: "v1-mock-song-1",
                timestamp: yesterday,
                lyrics:
                  "Silent whispers in the night\nEchoes of a distant light\nMemories fade into the blue\nAs I find my way back to you\n\nChorus:\nTime keeps flowing like a river\nChanging landscapes as it goes\nBut my heart remains forever\nIn the place where your love grows\n\nVerse 2:\nStars align in cosmic dance\nGiving dreamers one more chance\nThrough the darkness we will find\nPaths that heal a troubled mind\n\nBridge:\nBreaking through the walls of doubt\nLetting all the light shine out\nEvery moment, every day\nGuides us on our way\n\nChorus:\nTime keeps flowing like a river\nChanging landscapes as it goes\nBut my heart remains forever\nIn the place where your love grows",
                sections: [
                  {
                    start: 0,
                    end: 107,
                    type: "verse",
                    artists: ["Me"],
                  },
                  {
                    start: 108,
                    end: 237,
                    type: "chorus",
                    artists: ["Me", "Alex Turner"],
                  },
                  {
                    start: 238,
                    end: 345,
                    type: "verse",
                    artists: ["Alex Turner"],
                  },
                  {
                    start: 346,
                    end: 435,
                    type: "bridge",
                    artists: ["Me"],
                  },
                  {
                    start: 436,
                    end: 565,
                    type: "chorus",
                    artists: ["Me", "Alex Turner"],
                  },
                ],
              },
            ],
            categories: ["Rock", "Alternative"],
            featuredArtists: ["Alex Turner"],
            createdAt: yesterday,
            updatedAt: now,
          },
          {
            id: "mock-song-2",
            title: "Crystal Skies",
            lyrics:
              "Intro:\nShimmering lights in crystal skies\nReflections dancing before my eyes\n\nVerse 1:\nWalking through fields of endless green\nChasing visions of what could have been\nEvery step takes me further away\nFrom the shadows of yesterday\n\nPre-chorus:\nRising up, breaking free\nFinding the strength inside of me\n\nChorus:\nUnder crystal skies we'll fly\nWhere dreams and reality collide\nNo more fears to hold us down\nAs we claim our rightful crown\n\nVerse 2:\nOceans deep and mountains high\nCan't keep me from reaching the sky\nEvery challenge makes me strong\nHelping me where I belong\n\nBridge:\nWhen darkness falls and hope seems lost\nRemember what we've come across\nTogether we will find our way\nInto a brighter day\n\nOutro:\nShimmering lights in crystal skies\nReflections dancing before my eyes",
            sections: [
              {
                start: 0,
                end: 70,
                type: "intro",
                artists: ["Maya Johnson"],
              },
              {
                start: 71,
                end: 220,
                type: "verse",
                artists: ["Maya Johnson"],
              },
              {
                start: 221,
                end: 280,
                type: "pre-chorus",
                artists: ["Maya Johnson", "Me"],
              },
              {
                start: 281,
                end: 400,
                type: "chorus",
                artists: ["Maya Johnson", "Me"],
              },
              {
                start: 401,
                end: 550,
                type: "verse",
                artists: ["Me"],
              },
              {
                start: 551,
                end: 670,
                type: "bridge",
                artists: ["Maya Johnson", "Me"],
              },
              {
                start: 671,
                end: 741,
                type: "outro",
                artists: ["Maya Johnson"],
              },
            ],
            arrangement: [
              {
                type: "intro",
                start: 0,
                end: 70,
                artists: ["Maya Johnson"],
              },
              {
                type: "verse",
                start: 71,
                end: 220,
                artists: ["Maya Johnson"],
              },
              {
                type: "pre-chorus",
                start: 221,
                end: 280,
                artists: ["Maya Johnson", "Me"],
              },
              {
                type: "chorus",
                start: 281,
                end: 400,
                artists: ["Maya Johnson", "Me"],
              },
              {
                type: "verse",
                start: 401,
                end: 550,
                artists: ["Me"],
              },
              {
                type: "bridge",
                start: 551,
                end: 670,
                artists: ["Maya Johnson", "Me"],
              },
              {
                type: "outro",
                start: 671,
                end: 741,
                artists: ["Maya Johnson"],
              },
            ],
            versions: [
              {
                id: "v1-mock-song-2",
                timestamp: twoDaysAgo,
                lyrics:
                  "Intro:\nShimmering lights in crystal skies\nReflections dancing before my eyes\n\nVerse 1:\nWalking through fields of endless green\nChasing visions of what could have been\nEvery step takes me further away\nFrom the shadows of yesterday\n\nPre-chorus:\nRising up, breaking free\nFinding the strength inside of me\n\nChorus:\nUnder crystal skies we'll fly\nWhere dreams and reality collide\nNo more fears to hold us down\nAs we claim our rightful crown\n\nVerse 2:\nOceans deep and mountains high\nCan't keep me from reaching the sky\nEvery challenge makes me strong\nHelping me where I belong\n\nBridge:\nWhen darkness falls and hope seems lost\nRemember what we've come across\nTogether we will find our way\nInto a brighter day\n\nOutro:\nShimmering lights in crystal skies\nReflections dancing before my eyes",
                sections: [
                  {
                    start: 0,
                    end: 70,
                    type: "intro",
                    artists: ["Maya Johnson"],
                  },
                  {
                    start: 71,
                    end: 220,
                    type: "verse",
                    artists: ["Maya Johnson"],
                  },
                  {
                    start: 221,
                    end: 280,
                    type: "pre-chorus",
                    artists: ["Maya Johnson", "Me"],
                  },
                  {
                    start: 281,
                    end: 400,
                    type: "chorus",
                    artists: ["Maya Johnson", "Me"],
                  },
                  {
                    start: 401,
                    end: 550,
                    type: "verse",
                    artists: ["Me"],
                  },
                  {
                    start: 551,
                    end: 670,
                    type: "bridge",
                    artists: ["Maya Johnson", "Me"],
                  },
                  {
                    start: 671,
                    end: 741,
                    type: "outro",
                    artists: ["Maya Johnson"],
                  },
                ],
              },
            ],
            categories: ["Pop", "Electronic"],
            featuredArtists: ["Maya Johnson"],
            createdAt: twoDaysAgo,
            updatedAt: yesterday,
          },
          {
            id: "mock-song-3",
            title: "Urban Rhythm",
            lyrics:
              "Verse 1:\nCity lights flash across the night\nStreet sounds create the perfect vibe\nMoving through the urban maze\nLiving life in different ways\nEvery corner tells a story\nEvery face reveals its glory\n\nHook:\nUrban rhythm in my soul\nCity beats make me whole\n\nChorus:\nThis is our time, this is our place\nMoving at our own pace\nUrban rhythm, urban flow\nThis is all we need to know\n\nVerse 2:\nSubway trains and taxi cabs\nBillboard dreams and fashion labs\nCoffee shops at break of dawn\nNight clubs until the early morn\nEndless cycles, endless motion\nCity life is my devotion\n\nBridge:\nThrough the chaos, through the noise\nFind the balance, find your voice\nIn the concrete jungle deep\nSecrets that the city keeps\n\nHook:\nUrban rhythm in my soul\nCity beats make me whole\n\nChorus:\nThis is our time, this is our place\nMoving at our own pace\nUrban rhythm, urban flow\nThis is all we need to know",
            sections: [
              {
                start: 0,
                end: 180,
                type: "verse",
                artists: ["Marcus Lee"],
              },
              {
                start: 181,
                end: 230,
                type: "hook",
                artists: ["Marcus Lee", "Me"],
              },
              {
                start: 231,
                end: 330,
                type: "chorus",
                artists: ["Me"],
              },
              {
                start: 331,
                end: 510,
                type: "verse",
                artists: ["Marcus Lee"],
              },
              {
                start: 511,
                end: 630,
                type: "bridge",
                artists: ["Marcus Lee", "Me"],
              },
              {
                start: 631,
                end: 680,
                type: "hook",
                artists: ["Marcus Lee", "Me"],
              },
              {
                start: 681,
                end: 780,
                type: "chorus",
                artists: ["Me"],
              },
            ],
            arrangement: [
              {
                type: "verse",
                start: 0,
                end: 180,
                artists: ["Marcus Lee"],
              },
              {
                type: "hook",
                start: 181,
                end: 230,
                artists: ["Marcus Lee", "Me"],
              },
              {
                type: "chorus",
                start: 231,
                end: 330,
                artists: ["Me"],
              },
              {
                type: "verse",
                start: 331,
                end: 510,
                artists: ["Marcus Lee"],
              },
              {
                type: "bridge",
                start: 511,
                end: 630,
                artists: ["Marcus Lee", "Me"],
              },
              {
                type: "hook",
                start: 631,
                end: 680,
                artists: ["Marcus Lee", "Me"],
              },
              {
                type: "chorus",
                start: 681,
                end: 780,
                artists: ["Me"],
              },
            ],
            versions: [
              {
                id: "v1-mock-song-3",
                timestamp: twoDaysAgo,
                lyrics:
                  "Verse 1:\nCity lights flash across the night\nStreet sounds create the perfect vibe\nMoving through the urban maze\nLiving life in different ways\nEvery corner tells a story\nEvery face reveals its glory\n\nHook:\nUrban rhythm in my soul\nCity beats make me whole\n\nChorus:\nThis is our time, this is our place\nMoving at our own pace\nUrban rhythm, urban flow\nThis is all we need to know\n\nVerse 2:\nSubway trains and taxi cabs\nBillboard dreams and fashion labs\nCoffee shops at break of dawn\nNight clubs until the early morn\nEndless cycles, endless motion\nCity life is my devotion\n\nBridge:\nThrough the chaos, through the noise\nFind the balance, find your voice\nIn the concrete jungle deep\nSecrets that the city keeps\n\nHook:\nUrban rhythm in my soul\nCity beats make me whole\n\nChorus:\nThis is our time, this is our place\nMoving at our own pace\nUrban rhythm, urban flow\nThis is all we need to know",
                sections: [
                  {
                    start: 0,
                    end: 180,
                    type: "verse",
                    artists: ["Marcus Lee"],
                  },
                  {
                    start: 181,
                    end: 230,
                    type: "hook",
                    artists: ["Marcus Lee", "Me"],
                  },
                  {
                    start: 231,
                    end: 330,
                    type: "chorus",
                    artists: ["Me"],
                  },
                  {
                    start: 331,
                    end: 510,
                    type: "verse",
                    artists: ["Marcus Lee"],
                  },
                  {
                    start: 511,
                    end: 630,
                    type: "bridge",
                    artists: ["Marcus Lee", "Me"],
                  },
                  {
                    start: 631,
                    end: 680,
                    type: "hook",
                    artists: ["Marcus Lee", "Me"],
                  },
                  {
                    start: 681,
                    end: 780,
                    type: "chorus",
                    artists: ["Me"],
                  },
                ],
              },
            ],
            categories: ["Hip-Hop", "R&B"],
            featuredArtists: ["Marcus Lee"],
            createdAt: twoDaysAgo,
            updatedAt: twoDaysAgo,
          },
        ]

        // Add the sample songs
        set((state) => ({
          songs: [...state.songs, ...sampleSongs],
        }))

        console.log("Sample data initialized with 3 songs")
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

