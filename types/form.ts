import { z } from 'zod'

// Schema definition with validation
export const formSchema = z.object({
  // מסך 1 - פרטים כלליים
  date: z.string().min(1, 'שדה חובה'),
  submitterName: z.string().min(1, 'שדה חובה'),
  clientName: z.string().min(1, 'שדה חובה'),
  productService: z.string().min(1, 'שדה חובה'),
  deadline: z.string().min(1, 'שדה חובה'),
  services: z.array(z.string()).min(1, 'יש לבחור לפחות שירות אחד'),

  // מסך 2 - רקע
  marketCategory: z.string().min(1, 'שדה חובה'),
  productDescription: z.string().min(1, 'שדה חובה'),
  competitors: z.string().min(1, 'שדה חובה'),
  challenge: z.string().min(1, 'שדה חובה'),

  // מסך 3 - קהל היעד
  targetAudience: z.string().min(1, 'שדה חובה'),
  audienceCharacteristics: z.string().min(1, 'שדה חובה'),
  audienceInsights: z.string().min(1, 'שדה חובה'),

  // מסך 4 - מטרות
  campaignGoals: z.string().min(1, 'שדה חובה'),
  desiredResponse: z.string().min(1, 'שדה חובה'),
  timing: z.string().optional(),

  // מסך 5 - תובנה ומסר
  insight: z.string().min(1, 'שדה חובה'),
  solution: z.string().min(1, 'שדה חובה'),
  mainMessage: z.string().min(1, 'שדה חובה'),
  keyTakeaway: z.string().min(1, 'שדה חובה'),

  // מסך 6 - דרישות ותקציב
  requirements: z.string().min(1, 'שדה חובה'),
  campaignType: z.string().min(1, 'שדה חובה'),
  budget: z.string().min(1, 'שדה חובה'),
  notes: z.string().optional(),
})

export type FormData = z.infer<typeof formSchema>

export interface StepConfig {
  title: string
  description: string
  fields: {
    name: keyof FormData
    label: string
    type: 'text' | 'textarea' | 'date' | 'checkbox-group'
    placeholder?: string
    required?: boolean
    options?: string[]
  }[]
}

