import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import api from '../api/axios'

export const useAuthStore = create(
  persist(
    (set, get) => ({
      usuario: null,
      token: null,
      cargando: false,

      login: async (email, password) => {
        set({ cargando: true })
        try {
          const { data } = await api.post('/auth/login', { email, password })
          set({ usuario: data.usuario, token: data.token, cargando: false })
          return data
        } catch (error) {
          set({ cargando: false })
          throw error
        }
      },

      registrar: async (nombre, email, password) => {
        set({ cargando: true })
        try {
          await api.post('/auth/register', { nombre, email, password })
          return await get().login(email, password)
        } catch (error) {
          set({ cargando: false })
          throw error
        }
      },

      logout: () => {
        set({ usuario: null, token: null })
      },

      cargarUsuario: async () => {
        const { token } = get()
        if (!token) return
        set({ cargando: true })
        try {
          const { data } = await api.get('/auth/me')
          set({ usuario: data, cargando: false })
        } catch {
          set({ usuario: null, token: null, cargando: false })
        }
      },
    }),
    {
      name: 'ep-auth',
      partialize: (state) => ({ usuario: state.usuario, token: state.token }),
    }
  )
)
