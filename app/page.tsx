'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import axios from 'axios'
import Image from 'next/image'
import StepperWithValidation, { Step } from '@/components/StepperWithValidation'
import { FormData, formSchema } from '@/types/form'
import { formSteps } from '@/lib/formSteps'
import { saveFormData, loadFormData, clearFormData } from '@/lib/localStorage'

export default function Home() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const [currentStep, setCurrentStep] = useState(1)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    setValue,
    trigger,
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    mode: 'onChange',
  })

  useEffect(() => {
    const savedData = loadFormData()
    if (savedData) {
      Object.keys(savedData).forEach((key) => {
        setValue(key as keyof FormData, savedData[key as keyof FormData] as any)
      })
    }
  }, [setValue])

  useEffect(() => {
    const subscription = watch((value) => {
      saveFormData(value as Partial<FormData>)
    })
    return () => subscription.unsubscribe()
  }, [watch])

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true)
    try {
      await axios.post('https://hook.eu2.make.com/uryu3mv7m9tu3dtbkqto6qfdbnrdbjr0', data, {
        headers: {
          'Content-Type': 'application/json',
        },
      })

      setSubmitSuccess(true)
      clearFormData()

      setTimeout(() => {
        window.location.reload()
      }, 3000)
    } catch (error) {
      console.error('Error submitting form:', error)
      alert('אירעה שגיאה בשליחת הטופס. אנא נסה שנית.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleStepChange = (step: number) => {
    setCurrentStep(step)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleNextStep = async (step: number) => {
    const stepConfig = formSteps[step - 1]
    const fieldsToValidate = stepConfig.fields.map((field) => field.name)
    const isValid = await trigger(fieldsToValidate)
    return isValid
  }

  const handleFinalStep = () => {
    handleSubmit(onSubmit)()
  }

  if (submitSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12 text-center max-w-md w-full">
          <div className="w-20 h-20 md:w-24 md:h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg
              className="w-10 h-10 md:w-12 md:h-12 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-4">
            הטופס נשלח בהצלחה
          </h2>
          <p className="text-gray-600">
            תודה על מילוי הבריף. נחזור אליך בהקדם.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 py-4 md:py-8">
      <div className="max-w-5xl mx-auto px-3 md:px-4 mb-4 md:mb-8">
        <div className="bg-white rounded-lg md:rounded-xl shadow-md p-4 md:p-6 text-center">
          <div className="flex justify-center mb-3 md:mb-4">
            <Image
              src="/logo.png"
              alt="Leaders Logo"
              width={150}
              height={60}
              className="object-contain md:w-[180px] md:h-[72px]"
              priority
            />
          </div>
          <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-800 mb-2">
            טופס בריף ללקוחות
          </h1>
          <p className="text-sm md:text-base text-gray-600 px-2">
            מלא את הפרטים בקפידה כדי שנוכל ליצור עבורך את המהלך המושלם
          </p>
          <div className="mt-3 md:mt-4 inline-flex items-center gap-2 bg-green-50 px-3 md:px-4 py-1.5 md:py-2 rounded-full">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse flex-shrink-0" />
            <p className="text-xs md:text-sm text-green-700 font-medium">
              הנתונים נשמרים אוטומטית במהלך המילוי
            </p>
          </div>
        </div>
      </div>

      <StepperWithValidation
        initialStep={currentStep}
        onStepChange={handleStepChange}
        onNextStep={handleNextStep}
        onFinalStepCompleted={handleFinalStep}
        backButtonText="חזור"
        nextButtonText="הבא"
        disableStepIndicators={false}
      >
        {formSteps.map((stepConfig, index) => (
          <Step key={index}>
            <div className="mb-4 md:mb-6">
              <h2 className="text-lg md:text-xl lg:text-2xl font-bold text-gray-800 mb-1 md:mb-2">
                {stepConfig.title}
              </h2>
              <p className="text-sm md:text-base text-gray-600">{stepConfig.description}</p>
            </div>

            {stepConfig.fields.map((field) => {
              const error = errors[field.name]
              return (
                <div key={field.name} className="mb-4 md:mb-6">
                  <label
                    htmlFor={field.name}
                    className="block text-sm md:text-base font-semibold text-gray-700 mb-2"
                  >
                    {field.label}
                    {field.required && <span className="text-red-500 mr-1">*</span>}
                  </label>
                  {field.type === 'textarea' ? (
                    <textarea
                      id={field.name}
                      {...register(field.name)}
                      placeholder={field.placeholder}
                      rows={4}
                      className={`w-full px-3 md:px-4 py-2 md:py-3 text-sm md:text-base border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all ${
                        error ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                  ) : (
                    <input
                      id={field.name}
                      type={field.type}
                      {...register(field.name)}
                      placeholder={field.placeholder}
                      className={`w-full px-3 md:px-4 py-2 md:py-3 text-sm md:text-base border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all ${
                        error ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                  )}
                  {error && (
                    <p className="mt-1 text-xs md:text-sm text-red-600 flex items-center gap-1">
                      <svg className="w-3 h-3 md:w-4 md:h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span className="break-words">{error.message as string}</span>
                    </p>
                  )}
                </div>
              )
            })}
          </Step>
        ))}
      </StepperWithValidation>
    </div>
  )
}
