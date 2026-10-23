import { Component } from 'react';
import type { ReactNode } from 'react';

/** Keeps one broken screen from taking the board down: the card shows the error, the rest keeps working. */
export class ErrorBoundary extends Component<{ name: string; children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error) {
    console.error(`[orbito] screen "${this.props.name}" crashed`, error);
  }

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <div className="pd-crash">
        <b>{this.props.name}</b>
        <pre>{this.state.error.message}</pre>
      </div>
    );
  }
}
