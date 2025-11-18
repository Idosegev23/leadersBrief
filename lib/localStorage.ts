import { FormData } from '@/types/form'

const STORAGE_KEY = 'leaders-form-data'

export const saveFormData = (data: Partial<FormData>): void => {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    } catch (error) {
      console.error('Error saving to localStorage:', error)
    }
  }
}

export const loadFormData = (): Partial<FormData> | null => {
  if (typeof window !== 'undefined') {
    try {
      const data = localStorage.getItem(STORAGE_KEY)
      return data ? JSON.parse(data) : null
    } catch (error) {
      console.error('Error loading from localStorage:', error)
      return null
    }
  }
  return null
}

export const clearFormData = (): void => {
  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch (error) {
      console.error('Error clearing localStorage:', error)
    }
  }
}

