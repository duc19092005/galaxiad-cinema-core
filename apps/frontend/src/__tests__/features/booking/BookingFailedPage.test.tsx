import { describe, it, expect, vi } from 'vitest'
import { screen } from '@testing-library/react'
import { render } from '@/test/test-utils'
import BookingFailedPage from '@/features/booking/BookingFailedPage'

describe('BookingFailedPage', () => {
  it('shows default failure message', () => {
    window.history.pushState({}, '', '/booking/failed?orderId=order-123')

    render(<BookingFailedPage />)

    // "Payment Failed" comes from t('booking.payment_failed')
    const failElements = screen.getAllByText(/payment failed|that bai|error/i)
    expect(failElements.length).toBeGreaterThan(0)
  })

  it('shows processing error message when error param is processing_error', () => {
    window.history.pushState({}, '', '/booking/failed?orderId=order-123&error=processing_error')

    render(<BookingFailedPage />)

    // "Processing Error" comes from t('booking.processing_error_title')
    const processingElements = screen.getAllByText(/processing|xu ly|error/i)
    expect(processingElements.length).toBeGreaterThan(0)
  })

  it('renders retry button', () => {
    window.history.pushState({}, '', '/booking/failed?orderId=order-123')

    render(<BookingFailedPage />)

    // "Try Again" comes from t('booking.try_again')
    expect(screen.getByText(/try again|retry|thu lai/i)).toBeInTheDocument()
  })

  it('renders back to home button', () => {
    window.history.pushState({}, '', '/booking/failed?orderId=order-123')

    render(<BookingFailedPage />)

    // "Return to Home" comes from t('booking.return_home')
    expect(screen.getByText(/return to home|home|trang chu|movies/i)).toBeInTheDocument()
  })
})
