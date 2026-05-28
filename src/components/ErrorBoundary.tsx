import { Component } from 'preact'
import type { ComponentChildren } from 'preact'

interface ErrorBoundaryProps {
  children: ComponentChildren
  name?: string
}

interface ErrorBoundaryState {
  error: string | null
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { error: null }
  }

  componentDidCatch(err: Error) {
    const label = this.props.name ? `[Chronicle:${this.props.name}]` : '[Chronicle]'
    console.error(`${label} Render error:`, err)
    this.setState({ error: err.message })
  }

  render() {
    if (this.state.error) {
      return (
        <div data-chronicle="error-boundary" class="chronicle-error-boundary">
          <div class="chronicle-error-boundary-icon">⚠</div>
          <div class="chronicle-error-boundary-title">Chronicle Error</div>
          <div class="chronicle-error-boundary-msg">{this.state.error}</div>
          <button
            class="chronicle-error-boundary-dismiss"
            onClick={() => this.setState({ error: null })}
          >
            Dismiss
          </button>
        </div>
      )
    }
    return <>{this.props.children}</>
  }
}
