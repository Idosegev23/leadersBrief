# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm run dev` — Start development server
- `npm run build` — Production build
- `npm run lint` — Run ESLint

## Architecture

This is a **Next.js 14 App Router** application — a multi-step client brief form for Leaders (a marketing agency). The entire app is a single-page RTL Hebrew form with 6 steps.

### Data Flow

1. **Form schema & validation**: `types/form.ts` defines a Zod schema (`formSchema`) with all fields, and exports option lists (`SERVICES_LIST`, `PLATFORMS_LIST`, `CAMPAIGN_GOAL_TYPES`, `TIMING_TYPES`).
2. **Step configuration**: `lib/formSteps.ts` maps each of the 6 steps to its fields, labels, and input types. The form renders dynamically from this config — no per-step components.
3. **Form state**: `app/page.tsx` uses `react-hook-form` with `zodResolver`. Form data auto-saves to localStorage via `lib/localStorage.ts` on every change.
4. **Stepper UI**: `components/StepperWithValidation.tsx` is the active stepper component (with `onNextStep` validation callback). `components/Stepper.tsx` is an older version without validation — not currently used.
5. **Submission**: Form data POSTs to a Make.com webhook. If a Hub `token` query param exists, Hub metadata is attached and the link is marked completed.

### Key Patterns

- All form fields are defined declaratively in `types/form.ts` (schema) and `lib/formSteps.ts` (UI config). To add/modify fields, update both files.
- Field types supported: `text`, `textarea`, `date`, `select`, `checkbox-group`.
- The stepper uses `framer-motion` for slide transitions between steps.
- Path alias: `@/*` maps to project root.
- Tailwind custom colors: `primary` (#1e3a8a) and `secondary` (#0ea5e9).
- The app is fully RTL (`dir="rtl"`, `lang="he"` in layout).
