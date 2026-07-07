import { describe, it, expect, vi } from 'vitest'
import { screen } from '@testing-library/react'
import { render } from '@/test/test-utils'
import BookingFailedPage from '@/features/booking/BookingFailedPage'

describe('BookingFailedPage', () => {
  it('shows default failure message', () => {
    window.history.pushState({}, '', '/booking/failed?orderId=order-123')

    render(<BookingFailedPage />)

    expect(screen.getByText(/failed|that bai|error/i)).toBeInTheDocument()
  })

  it('shows processing error message when error param is processing_error', () => {
    window.history.pushState({}, '', '/booking/failed?orderId=order-123&error=processing_error')

    render(<BookingFailedPage />)

    expect(screen.getByText(/processing|xu ly|error/i)).toBeInTheDocument()
  })

  it('renders retry button', () => {
    window.history.pushState({}, '', '/booking/failed?orderId=order-123')

    render(<BookingFailedPage />)

    expect(screen.getByText(/retry|thu lai|try again/i)).toBeInTheDocument()
  })

  it('renders back to home button', () => {
    window.history.pushState({}, '', '/booking/failed?orderId=order-123')

    render(<BookingFailedPage />)

    expect(screen.getByText(/home|trang chu|movies/i)).toBeInTheDocument()
  })
})
