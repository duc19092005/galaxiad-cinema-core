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

    // Use placeholder text since labels don't have htmlFor associations
    expect(screen.getByPlaceholderText(/your full name/i)).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/name@cinema.com/i)).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/0912345678/i)).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/123456789/i)).toBeInTheDocument()
  })

  it('shows error when passwords do not match', async () => {
    const user = userEvent.setup()
    render(<RegisterForm />)

    const nameInput = screen.getByPlaceholderText('Your full name')
    const emailInput = screen.getByPlaceholderText('name@cinema.com')

    await user.type(nameInput, 'Test User')
    await user.type(emailInput, 'test@example.com')

    const passwordInput = screen.getByPlaceholderText(/min.*6/i)
    const confirmPasswordInput = screen.getByPlaceholderText(/repeat/i)

    await user.type(passwordInput, 'P@ssword123!')
    await user.type(confirmPasswordInput, 'DifferentP@ss!')

    const submitButton = screen.getByRole('button', { name: /create account|register|sign up|dang ky/i })
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/password.*not match|mat khau.*khong/i)).toBeInTheDocument()
    })
  })

  it('submits registration form with valid data', async () => {
    const user = userEvent.setup()
    vi.mocked(authApi.regularRegister).mockResolvedValue({
      isSuccess: true,
      message: 'Registration successful',
    })

    render(<RegisterForm />)

    // Use exact placeholder texts to avoid ambiguous queries
    const nameInput = screen.getByPlaceholderText('Your full name')
    const emailInput = screen.getByPlaceholderText('name@cinema.com')

    await user.type(nameInput, 'Test User')
    await user.type(emailInput, 'new@test.com')

    const passwordInput = screen.getByPlaceholderText(/min.*6/i)
    const confirmPasswordInput = screen.getByPlaceholderText(/repeat/i)

    await user.type(passwordInput, 'P@ssword123!')
    await user.type(confirmPasswordInput, 'P@ssword123!')

    const submitButton = screen.getByRole('button', { name: /create account|register|sign up|dang ky/i })
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

    // Fill all required fields
    const nameInput = screen.getByPlaceholderText('Your full name')
    const emailInput = screen.getByPlaceholderText('name@cinema.com')

    await user.type(nameInput, 'Test User')
    await user.type(emailInput, 'existing@test.com')

    const passwordInput = screen.getByPlaceholderText(/min.*6/i)
    const confirmPasswordInput = screen.getByPlaceholderText(/repeat/i)

    await user.type(passwordInput, 'P@ssword123!')
    await user.type(confirmPasswordInput, 'P@ssword123!')

    const submitButton = screen.getByRole('button', { name: /create account|register|sign up|dang ky/i })
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/already exists|email.*taken/i)).toBeInTheDocument()
    })
  })
})
