import type { FunctionComponent } from 'preact'
import { useEffect, useState, useRef } from 'preact/hooks'

export type ToastState = 'generating' | 'error' | 'success'

interface Props {
  state: ToastState
  message: string
  onDone?: () => void          // called after fade completes
}

export const SummaryToast: FunctionComponent<Props> = ({ state, message, onDone }) => {
  const [fading, setFading] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    // For error state, start fade after 4 seconds
    if (state === 'error') {
      timerRef.current = setTimeout(() => {
        setFading(true)
        setTimeout(() => onDone?.(), 450)
      }, 4000)
    }
    // For success state, start fade after 3 seconds
    if (state === 'success') {
      timerRef.current = setTimeout(() => {
        setFading(true)
        setTimeout(() => onDone?.(), 450)
      }, 3000)
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [state, onDone])

  const isError = state === 'error'
  const isSuccess = state === 'success'

  return (
    <div class={`chronicle-toast${isError ? ' chronicle-toast-error' : ''}${isSuccess ? ' chronicle-toast-success' : ''}${fading ? ' chronicle-toast-fading' : ''}`}>
      {state === 'generating' && <span class="chronicle-summarize-spinner" />}
      {state === 'success' && <span class="chronicle-toast-icon">✓</span>}
      <span>{message}</span>
    </div>
  )
}
