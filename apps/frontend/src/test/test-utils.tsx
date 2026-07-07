import React, { type ReactElement } from 'react'
import { render, type RenderOptions } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { I18nextProvider } from 'react-i18next'
import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

// Initialize a minimal i18n for tests
i18n.use(initReactI18next).init({
  lng: 'en',
  fallbackLng: 'en',
  resources: { en: { translation: {} } },
  interpolation: { escapeValue: false },
})

function AllProviders({ children }: { children: React.ReactNode }) {
  return (
    <BrowserRouter>
      <I18nextProvider i18n={i18n}>
        {children}
      </I18nextProvider>
    </BrowserRouter>
  )
}

function customRender(ui: ReactElement, options?: Omit<RenderOptions, 'wrapper'>) {
  return render(ui, { wrapper: AllProviders, ...options })
}

export { customRender as render }
export { screen, fireEvent, waitFor, within } from '@testing-library/react'
export { userEvent } from '@testing-library/user-event'
