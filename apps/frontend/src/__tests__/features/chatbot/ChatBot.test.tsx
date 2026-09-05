import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { render } from '@/test/test-utils';
import ChatBot from '@/components/ChatBot';

vi.mock('@/api/axiosClient', () => ({
  API_BASE_URL: 'http://localhost:5000',
  identityAxios: {
    post: vi.fn().mockResolvedValue({
      data: {
        data: {
          response: 'Chào bạn, tôi có thể giúp gì cho bạn?',
          uiActions: [],
        },
      },
    }),
  },
}));

vi.mock('@/api/bookingApi', () => ({
  bookingApi: {
    getTicketInfo: vi.fn(),
  },
}));

vi.mock('@/api/signalrClient', () => ({
  signalrClient: {
    createPaymentConnection: vi.fn(() => ({
      on: vi.fn(),
      start: vi.fn().mockResolvedValue(undefined),
      stop: vi.fn().mockResolvedValue(undefined),
    })),
  },
  stopConnection: vi.fn(),
}));

describe('ChatBot component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
  });

  it('renders the floating trigger button', () => {
    render(<ChatBot />);
    const triggerBtn = screen.getByLabelText(/Open CinemaPro AI/i);
    expect(triggerBtn).toBeInTheDocument();
  });

  it('opens and closes the chat panel when clicking trigger button and close button', async () => {
    render(<ChatBot />);
    const triggerBtn = screen.getByLabelText(/Open CinemaPro AI/i);

    // Open chat
    fireEvent.click(triggerBtn);

    expect(screen.getByText('CinemaPro AI')).toBeInTheDocument();
    // Default greeting should be present
    expect(screen.getByText(/Tôi là CinemaPro AI/i)).toBeInTheDocument();

    // Close chat
    const closeBtn = screen.getByTitle(/Close|Đóng/i);
    fireEvent.click(closeBtn);

    await waitFor(() => {
      expect(screen.queryByText('CinemaPro AI')).not.toBeInTheDocument();
    });
  });

  it('populates input when clicking a quick action button', () => {
    render(<ChatBot />);
    fireEvent.click(screen.getByLabelText(/Open CinemaPro AI/i));

    const quickBookBtn = screen.getByRole('button', { name: /Book|Đặt vé/i });
    fireEvent.click(quickBookBtn);

    const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;
    expect(textarea.value).toMatch(/Book tickets for me|đặt vé tự động/i);
  });

  it('allows user to type and send a message', async () => {
    // Mock fetch for SSE stream to fail and trigger HTTP fallback
    global.fetch = vi.fn().mockRejectedValue(new Error('SSE fallback trigger'));

    render(<ChatBot />);
    fireEvent.click(screen.getByLabelText(/Open CinemaPro AI/i));

    const textarea = screen.getByRole('textbox');
    fireEvent.change(textarea, { target: { value: 'Tôi muốn tìm phim hành động' } });

    const sendBtn = screen.getByTitle(/Send|Gửi/i);
    expect(sendBtn).not.toBeDisabled();

    fireEvent.click(sendBtn);

    // User message should appear in chat
    expect(screen.getByText('Tôi muốn tìm phim hành động')).toBeInTheDocument();

    // Bot response should arrive via fallback
    await waitFor(() => {
      expect(screen.getByText('Chào bạn, tôi có thể giúp gì cho bạn?')).toBeInTheDocument();
    });
  });
});
