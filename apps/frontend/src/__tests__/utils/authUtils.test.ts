import { describe, it, expect, vi, beforeEach } from 'vitest'
import { hasPermission, getUserInfo, clearAuth } from '@/utils/authUtils'

describe('authUtils', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  describe('getUserInfo', () => {
    it('returns parsed user info from localStorage', () => {
      const userData = { userId: 'u1', username: 'Test', roles: ['Customer'] }
      localStorage.setItem('user_info', JSON.stringify(userData))

      const result = getUserInfo()
      expect(result).toEqual(userData)
    })

    it('returns null when no user info stored', () => {
      const result = getUserInfo()
      expect(result).toBeNull()
    })

    it('returns null on invalid JSON', () => {
      localStorage.setItem('user_info', 'invalid-json')
      const result = getUserInfo()
      expect(result).toBeNull()
    })
  })

  describe('hasPermission', () => {
    it('returns true for Admin role', () => {
      localStorage.setItem('user_info', JSON.stringify({
        userId: 'admin-1',
        roles: ['Admin'],
      }))

      expect(hasPermission('any.permission')).toBe(true)
    })

    it('returns true when user has the specific permission', () => {
      localStorage.setItem('user_info', JSON.stringify({
        userId: 'user-1',
        roles: ['Cashier'],
        permissions: ['booking.create', 'booking.view'],
      }))

      expect(hasPermission('booking.create')).toBe(true)
    })

    it('returns false when user lacks the permission', () => {
      localStorage.setItem('user_info', JSON.stringify({
        userId: 'user-1',
        roles: ['Customer'],
        permissions: ['booking.view'],
      }))

      expect(hasPermission('admin.manage')).toBe(false)
    })

    it('returns false when no user info', () => {
      expect(hasPermission('any.permission')).toBe(false)
    })
  })

  describe('clearAuth', () => {
    it('removes user_info from localStorage', () => {
      localStorage.setItem('user_info', JSON.stringify({ userId: 'u1' }))
      clearAuth()
      expect(localStorage.getItem('user_info')).toBeNull()
    })

    it('removes X-Access-Token cookie', () => {
      document.cookie = 'X-Access-Token=test-token'
      clearAuth()
      expect(document.cookie).not.toContain('X-Access-Token')
    })
  })
})
