import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { render } from '@/test/test-utils'
import RegisterForm from '@/features/auth/RegisterForm'

vi.mock('@/api/authApi', () => ({
  authApi: {
    regularRegister: vi.fn(),
  },
}))

import { authApi } from '@/api/authApi'

describe('RegisterForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders all registration fields', () => {
    render(<RegisterForm />)

    expect(screen.getByLabelText(/full name|ho ten/i) || screen.getByPlaceholderText(/name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/email/i) || screen.getByPlaceholderText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/phone/i) || screen.getByPlaceholderText(/phone/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/identity|cmnd|cccd/i) || screen.getByPlaceholderText(/identity/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/password/i) || screen.getByPlaceholderText(/password/i)).toBeInTheDocument()
  })

  it('shows error when passwords do not match', async () => {
    const user = userEvent.setup()
    render(<RegisterForm />)

    const passwordFields = screen.getAllByPlaceholderText(/password/i)
    if (passwordFields.length >= 2) {
      await user.type(passwordFields[0], 'P@ssword123!')
      await user.type(passwordFields[1], 'DifferentP@ss!')

      const submitButton = screen.getByRole('button', { name: /register|sign up|dang ky/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/password.*not match|mat khau.*khong/i)).toBeInTheDocument()
      })
    }
  })

  it('submits registration form with valid data', async () => {
    const user = userEvent.setup()
    vi.mocked(authApi.regularRegister).mockResolvedValue({
      isSuccess: true,
      message: 'Registration successful',
    })

    render(<RegisterForm />)

    const nameInput = screen.getByPlaceholderText(/name/i) || screen.getByLabelText(/name/i)
    const emailInput = screen.getByPlaceholderText(/email/i) || screen.getByLabelText(/email/i)

    if (nameInput && emailInput) {
      await user.type(nameInput, 'Test User')
      await user.type(emailInput, 'new@test.com')
    }

    // Fill password fields
    const passwordFields = screen.getAllByPlaceholderText(/password/i)
    for (const field of passwordFields) {
      await user.type(field, 'P@ssword123!')
    }

    const submitButton = screen.getByRole('button', { name: /register|sign up|dang ky/i })
    await user.click(submitButton)

    await waitFor(() => {
      expect(authApi.regularRegister).toHaveBeenCalled()
    })
  })

  it('shows error on duplicate email', async () => {
    const user = userEvent.setup()
    vi.mocked(authApi.regularRegister).mockRejectedValue({
      isAxiosError: true,
      response: {
        data: { message: 'Email already exists' },
      },
    })

    render(<RegisterForm />)

    const emailInput = screen.getByPlaceholderText(/email/i) || screen.getByLabelText(/email/i)
    if (emailInput) {
      await user.type(emailInput, 'existing@test.com')
    }

    const submitButton = screen.getByRole('button', { name: /register|sign up|dang ky/i })
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/already exists|email.*taken/i)).toBeInTheDocument()
    })
  })
})
