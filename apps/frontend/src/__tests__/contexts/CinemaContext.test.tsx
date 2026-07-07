import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { CinemaProvider, useCinema } from '@/contexts/CinemaContext'

function TestComponent() {
  const { activeCinemaId, setActiveCinemaId, managedCinemas } = useCinema()
  return (
    <div>
      <span data-testid="cinema-id">{activeCinemaId || 'none'}</span>
      <span data-testid="cinema-count">{managedCinemas.length}</span>
      <button onClick={() => setActiveCinemaId('cinema-1')}>Set Cinema 1</button>
      <button onClick={() => setActiveCinemaId('cinema-2')}>Set Cinema 2</button>
    </div>
  )
}

describe('CinemaContext', () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
  })

  it('provides default state with no active cinema', () => {
    render(
      <CinemaProvider>
        <TestComponent />
      </CinemaProvider>
    )

    expect(screen.getByTestId('cinema-id').textContent).toBe('none')
  })

  it('sets active cinema ID', () => {
    render(
      <CinemaProvider>
        <TestComponent />
      </CinemaProvider>
    )

    fireEvent.click(screen.getByText('Set Cinema 1'))
    expect(screen.getByTestId('cinema-id').textContent).toBe('cinema-1')
  })

  it('switches between cinemas', () => {
    render(
      <CinemaProvider>
        <TestComponent />
      </CinemaProvider>
    )

    fireEvent.click(screen.getByText('Set Cinema 1'))
    expect(screen.getByTestId('cinema-id').textContent).toBe('cinema-1')

    fireEvent.click(screen.getByText('Set Cinema 2'))
    expect(screen.getByTestId('cinema-id').textContent).toBe('cinema-2')
  })

  it('reads managed cinemas from user_info', () => {
    localStorage.setItem('user_info', JSON.stringify({
      userId: 'user-1',
      managedCinemas: [
        { cinemaId: 'c1', cinemaName: 'Cinema 1' },
        { cinemaId: 'c2', cinemaName: 'Cinema 2' },
      ],
    }))

    render(
      <CinemaProvider>
        <TestComponent />
      </CinemaProvider>
    )

    expect(screen.getByTestId('cinema-count').textContent).toBe('2')
  })
})
