'use client'

import { useState } from 'react'
import { ArrowRightIcon } from '@heroicons/react/24/outline'
import type { PipelineTemplate } from '@/lib/pipelineTemplates'

interface Props {
  template: PipelineTemplate
  onSubmit: (values: Record<string, string>) => void
  onSkip: () => void
}

export function TemplateBriefModal({ template, onSubmit, onSkip }: Props) {
  const fields = template.briefFields || []
  const [values, setValues] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {}
    fields.forEach(f => { init[f.key] = f.defaultValue || '' })
    return init
  })
  const [errors, setErrors] = useState<Record<string, boolean>>({})

  const set = (key: string, value: string) => {
    setValues(v => ({ ...v, [key]: value }))
    setErrors(e => ({ ...e, [key]: false }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const newErrors: Record<string, boolean> = {}
    fields.forEach(f => { if (f.required && !values[f.key]?.trim()) newErrors[f.key] = true })
    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return }
    onSubmit(values)
  }

  const inputClass = (key: string) =>
    `w-full bg-surface-50 border rounded-lg px-3 py-2 text-xs text-ink-700 placeholder:text-ink-300 focus:outline-none focus:ring-2 focus:ring-accent-500/20 focus:border-accent-500 transition ${errors[key] ? 'border-red-300' : 'border-surface-300'}`

  return (
    <div className="min-h-screen flex items-start justify-center bg-surface pt-14 pb-10 px-6">
      <div className="w-full max-w-lg">

        {/* Template header */}
        <div className="flex items-center gap-3 mb-8">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
            style={{ background: template.color + '22' }}
          >
            {template.icon}
          </div>
          <div>
            <p className="text-[10px] text-ink-400 font-semibold uppercase tracking-wider mb-0.5">
              {template.category} · {template.steps.length} steps
            </p>
            <h1 className="text-xl font-bold text-ink-700">{template.name}</h1>
          </div>
        </div>

        {/* Form card */}
        <div className="glass-card p-6 mb-4">
          <p className="text-xs text-ink-400 mb-6 leading-relaxed">{template.description}</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {fields.map(field => (
              <div key={field.key}>
                <label className="block text-xs font-semibold text-ink-600 mb-1.5">
                  {field.label}
                  {field.required && <span className="text-red-400 ml-0.5"> *</span>}
                </label>

                {field.type === 'textarea' ? (
                  <textarea
                    value={values[field.key] || ''}
                    onChange={e => set(field.key, e.target.value)}
                    placeholder={field.placeholder}
                    rows={3}
                    className={inputClass(field.key) + ' resize-none'}
                  />
                ) : field.type === 'select' && field.options ? (
                  <select
                    value={values[field.key] || ''}
                    onChange={e => set(field.key, e.target.value)}
                    className={inputClass(field.key)}
                  >
                    <option value="">Choose…</option>
                    {field.options.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={values[field.key] || ''}
                    onChange={e => set(field.key, e.target.value)}
                    placeholder={field.placeholder}
                    className={inputClass(field.key)}
                  />
                )}

                {errors[field.key] && (
                  <p className="text-[10px] text-red-400 mt-1">This field is required</p>
                )}
              </div>
            ))}

            <div className="flex gap-3 pt-2">
              <button type="submit" className="btn-primary flex-1 flex items-center justify-center gap-2 py-2.5">
                Launch Pipeline
                <ArrowRightIcon className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={onSkip}
                className="btn-secondary px-4 py-2.5 text-xs whitespace-nowrap"
              >
                Customize in builder →
              </button>
            </div>
          </form>
        </div>

        {/* Pipeline steps preview */}
        <p className="text-[10px] text-ink-300 mb-2 font-semibold uppercase tracking-wider">Pipeline steps</p>
        <div className="flex flex-wrap gap-1.5">
          {template.steps.map((step, i) => (
            <span
              key={i}
              className="text-[10px] px-2.5 py-1 rounded-full bg-surface-100 border border-surface-300 text-ink-400 flex items-center gap-1"
            >
              <span className="text-ink-300 font-semibold">{i + 1}.</span> {step.label}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
