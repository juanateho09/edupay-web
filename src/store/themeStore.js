import { create } from 'zustand'

const TEMA_KEY = 'ep-tema'

const obtenerTemaInicial = () => {
  const guardado = localStorage.getItem(TEMA_KEY)
  if (guardado === 'light' || guardado === 'dark') return guardado
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

const aplicarTema = (tema) => {
  document.documentElement.setAttribute('data-theme', tema)
  localStorage.setItem(TEMA_KEY, tema)
}

const temaInicial = obtenerTemaInicial()
aplicarTema(temaInicial)

export const useThemeStore = create((set, get) => ({
  tema: temaInicial,
  toggleTema: () => {
    const nuevoTema = get().tema === 'light' ? 'dark' : 'light'
    aplicarTema(nuevoTema)
    set({ tema: nuevoTema })
  },
}))
