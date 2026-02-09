import { StrictMode, Component, type ReactNode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { ThemeProvider } from '@/components/ThemeProvider'
import App from './ChatApp.tsx'

/** 全局错误边界：捕获 React 渲染错误，显示错误信息而非白屏 */
class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state: { error: Error | null } = { error: null }
  static getDerivedStateFromError(error: Error) { return { error } }
  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 32, color: '#ff6b6b', fontFamily: 'monospace' }}>
          <h2>Application Error</h2>
          <p>{this.state.error.message}</p>
        </div>
      )
    }
    return this.props.children
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <ThemeProvider
        attribute="class"
        defaultTheme="dark"
        enableSystem
        disableTransitionOnChange
      >
        <App />
      </ThemeProvider>
    </ErrorBoundary>
  </StrictMode>,
)
