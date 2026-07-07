import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ThemeProvider, useTheme } from '@/contexts/ThemeContext'

function TestComponent() {
  const { theme, setTheme } = useTheme()
  return (
    <div>
      <span data-testid="current-theme">{theme}</span>
      <button onClick={() => setTheme('dark')}>Dark</button>
      <button onClick={() => setTheme('light')}>Light</button>
      <button onClick={() => setTheme('modern')}>Modern</button>
    </div>
  )
}

describe('ThemeContext', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('provides default theme', () => {
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    )

    const theme = screen.getByTestId('current-theme').textContent
    expect(['dark', 'light', 'modern']).toContain(theme)
  })

  it('switches to dark theme', () => {
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    )

    fireEvent.click(screen.getByText('Dark'))
    expect(screen.getByTestId('current-theme').textContent).toBe('dark')
  })

  it('switches to light theme', () => {
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    )

    fireEvent.click(screen.getByText('Light'))
    expect(screen.getByTestId('current-theme').textContent).toBe('light')
  })

  it('persists theme in localStorage', () => {
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    )

    fireEvent.click(screen.getByText('Modern'))
    expect(localStorage.getItem('theme')).toBe('modern')
  })

  it('reads theme from localStorage on init', () => {
    localStorage.setItem('theme', 'light')

    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    )

    expect(screen.getByTestId('current-theme').textContent).toBe('light')
  })
})
