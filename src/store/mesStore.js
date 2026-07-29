import { create } from 'zustand'

const ahora = new Date()

export const useMesStore = create((set) => ({
  mes: ahora.getMonth() + 1,
  anio: ahora.getFullYear(),
  setMesAnio: (mes, anio) => set({ mes, anio }),
}))
