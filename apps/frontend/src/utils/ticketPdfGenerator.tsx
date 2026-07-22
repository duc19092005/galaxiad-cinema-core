import React from 'react';
import { createRoot } from 'react-dom/client';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

interface TicketSeatDetail {
  seatNumber: string;
  segmentName: string;
  priceEach: number;
}

export interface TicketInfo {
  orderId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerAddress: string;
  movieName: string;
  movieImageUrl?: string;
  cinemaName: string;
  cinemaAddress: string;
  auditoriumNumber: string;
  formatName: string;
  showTime: string;
  endedTime: string;
  orderDate: string;
  totalPrice: number;
  vnPayTransactionId: string;
  seats: TicketSeatDetail[];
}

const ORANGE = '#ff8a00';
const INK = '#1a1a1f';
const MUTED = '#5c6370';
const LINE = '#e5e7eb';
const SOFT = '#f5f3f0';
const CARD = '#ffffff';

/** Fixed height + line-height for vertical centering in html2canvas */
const chipBase: React.CSSProperties = {
  display: 'inline-block',
  boxSizing: 'border-box',
  height: 30,
  lineHeight: '30px',
  padding: '0 14px',
  fontSize: 11,
  fontWeight: 800,
  textAlign: 'center',
  verticalAlign: 'middle',
  whiteSpace: 'nowrap',
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);

const formatDate = (dateStr?: string) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('vi-VN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

const formatTime = (dateStr?: string) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
  });
};

const shortCode = (orderId: string) =>
  (orderId || '').replace(/-/g, '').slice(0, 8).toUpperCase();

const SectionTitle: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div
    style={{
      fontSize: 10,
      fontWeight: 800,
      letterSpacing: '0.1em',
      textTransform: 'uppercase',
      color: MUTED,
      lineHeight: '14px',
      marginBottom: 12,
    }}
  >
    {children}
  </div>
);

const Field: React.FC<{
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
  accent?: boolean;
}> = ({ label, value, sub, accent }) => (
  <div style={{ minWidth: 0 }}>
    <div
      style={{
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        color: MUTED,
        lineHeight: '14px',
        marginBottom: 8,
      }}
    >
      {label}
    </div>
    <div
      style={{
        fontSize: 14,
        fontWeight: 700,
        color: accent ? ORANGE : INK,
        lineHeight: '20px',
        wordBreak: 'break-word',
      }}
    >
      {value}
    </div>
    {sub != null && sub !== '' && (
      <div
        style={{
          fontSize: 11,
          color: MUTED,
          lineHeight: '16px',
          marginTop: 6,
          wordBreak: 'break-word',
        }}
      >
        {sub}
      </div>
    )}
  </div>
);

/** Fetch QR as data URL so html2canvas never hits CORS / blank image */
async function fetchQrDataUrl(payload: string): Promise<string> {
  const url =
    `https://api.qrserver.com/v1/create-qr-code/` +
    `?size=220x220&margin=10&color=1a1a1f&bgcolor=ffffff` +
    `&data=${encodeURIComponent(payload)}`;

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`QR HTTP ${res.status}`);
    const blob = await res.blob();
    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ''));
      reader.onerror = () => reject(new Error('QR FileReader failed'));
      reader.readAsDataURL(blob);
    });
  } catch {
    // Offline / blocked: draw a clear placeholder (still visible, not blank)
    const canvas = document.createElement('canvas');
    canvas.width = 220;
    canvas.height = 220;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, 220, 220);
      ctx.strokeStyle = '#1a1a1f';
      ctx.lineWidth = 3;
      ctx.strokeRect(8, 8, 204, 204);
      ctx.fillStyle = '#1a1a1f';
      ctx.font = 'bold 14px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('QR', 110, 100);
      ctx.font = '11px Arial';
      ctx.fillText('unavailable', 110, 124);
    }
    return canvas.toDataURL('image/png');
  }
}

const TicketTemplate: React.FC<{ ticket: TicketInfo; qrDataUrl: string }> = ({
  ticket,
  qrDataUrl,
}) => {
  const code = shortCode(ticket.orderId);
  const seatGroups = ticket.seats.reduce(
    (acc, seat) => {
      if (!acc[seat.segmentName]) {
        acc[seat.segmentName] = { qty: 0, priceEach: seat.priceEach, total: 0, seats: [] as string[] };
      }
      acc[seat.segmentName].qty += 1;
      acc[seat.segmentName].total += seat.priceEach;
      acc[seat.segmentName].seats.push(seat.seatNumber);
      return acc;
    },
    {} as Record<string, { qty: number; priceEach: number; total: number; seats: string[] }>
  );

  const subtotal = ticket.seats.reduce((sum, s) => sum + s.priceEach, 0);
  const discount = Math.max(0, subtotal - ticket.totalPrice);
  const seatList = ticket.seats.map((s) => s.seatNumber).join(', ');

  return (
    <div
      id="pdf-ticket-template"
      style={{
        width: 580,
        background: CARD,
        color: INK,
        fontFamily: 'Arial, Helvetica, sans-serif',
        boxSizing: 'border-box',
        position: 'relative',
        overflow: 'hidden',
        borderRadius: 16,
        border: `1px solid ${LINE}`,
        lineHeight: 1.4,
      }}
    >
      {/* HEADER — dark bg, light text only */}
      <div style={{ background: '#1a1a1f', padding: '28px 32px 26px', boxSizing: 'border-box' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <tbody>
            <tr>
              <td style={{ verticalAlign: 'top', width: '68%', padding: 0 }}>
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 800,
                    letterSpacing: '0.2em',
                    color: ORANGE,
                    lineHeight: '16px',
                    marginBottom: 12,
                  }}
                >
                  GALAXIAD CINEMA
                </div>
                <div
                  style={{
                    fontSize: 22,
                    fontWeight: 800,
                    color: '#ffffff',
                    lineHeight: '28px',
                    marginBottom: 16,
                    maxWidth: 360,
                  }}
                >
                  {ticket.movieName}
                </div>
                <div style={{ marginTop: 4 }}>
                  <span
                    style={{
                      ...chipBase,
                      background: ORANGE,
                      color: '#1a1a1f',
                      borderRadius: 8,
                      marginRight: 10,
                    }}
                  >
                    {(ticket.formatName || '2D').toUpperCase()}
                  </span>
                  <span
                    style={{
                      ...chipBase,
                      background: 'transparent',
                      color: '#f5e6d3',
                      border: '1px solid rgba(255,255,255,0.35)',
                      borderRadius: 999,
                    }}
                  >
                    E-TICKET
                  </span>
                </div>
              </td>
              <td style={{ verticalAlign: 'middle', textAlign: 'right', padding: 0 }}>
                <div
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    color: '#d4c4b0',
                    lineHeight: '14px',
                    marginBottom: 8,
                  }}
                >
                  MÃ ĐẶT VÉ
                </div>
                <div
                  style={{
                    fontSize: 22,
                    fontWeight: 800,
                    color: ORANGE,
                    fontFamily: 'Courier New, monospace',
                    letterSpacing: '0.1em',
                    lineHeight: '28px',
                  }}
                >
                  {code}
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div style={{ height: 5, background: ORANGE }} />

      <div style={{ padding: '28px 32px 8px', boxSizing: 'border-box', background: CARD }}>
        {/* Info */}
        <div
          style={{
            background: SOFT,
            border: `1px solid ${LINE}`,
            borderRadius: 14,
            padding: '20px 22px',
            marginBottom: 22,
            boxSizing: 'border-box',
          }}
        >
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <tbody>
              <tr>
                <td style={{ width: '34%', verticalAlign: 'top', padding: '0 16px 0 0' }}>
                  <Field
                    label="Khách hàng"
                    value={ticket.customerName || '—'}
                    sub={ticket.customerPhone || undefined}
                  />
                </td>
                <td style={{ width: '38%', verticalAlign: 'top', padding: '0 16px' }}>
                  <Field label="Ngày chiếu" value={formatDate(ticket.showTime)} />
                </td>
                <td style={{ width: '28%', verticalAlign: 'top', padding: '0 0 0 16px' }}>
                  <Field
                    label="Giờ chiếu"
                    value={
                      formatTime(ticket.showTime) +
                      (ticket.endedTime ? ` – ${formatTime(ticket.endedTime)}` : '')
                    }
                    accent
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Cinema */}
        <div
          style={{
            border: `1px solid ${LINE}`,
            borderRadius: 14,
            padding: '20px 22px',
            marginBottom: 22,
            boxSizing: 'border-box',
            background: CARD,
          }}
        >
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <tbody>
              <tr>
                <td style={{ width: '55%', verticalAlign: 'top', padding: '0 20px 0 0' }}>
                  <Field
                    label="Rạp"
                    value={ticket.cinemaName}
                    sub={ticket.cinemaAddress || undefined}
                  />
                </td>
                <td style={{ width: '45%', verticalAlign: 'top', padding: '0 0 0 20px' }}>
                  <Field
                    label="Phòng chiếu"
                    value={ticket.auditoriumNumber || '—'}
                    sub={`${ticket.seats.length} ghế · Đặt lúc ${
                      ticket.orderDate
                        ? new Date(ticket.orderDate).toLocaleString('vi-VN', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : '—'
                    }`}
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Seats */}
        <div
          style={{
            border: `1px solid ${LINE}`,
            borderRadius: 14,
            padding: '20px 22px',
            marginBottom: 22,
            boxSizing: 'border-box',
            background: CARD,
          }}
        >
          <SectionTitle>Ghế đã chọn</SectionTitle>
          <div style={{ marginBottom: 10, lineHeight: 0 }}>
            {ticket.seats.map((seat, i) => (
              <span
                key={`${seat.seatNumber}-${i}`}
                style={{
                  ...chipBase,
                  background: '#fff7ed',
                  border: `1.5px solid ${ORANGE}`,
                  borderRadius: 10,
                  color: INK,
                  marginRight: 10,
                  marginBottom: 10,
                  padding: '0 12px',
                }}
              >
                <span style={{ lineHeight: '30px', verticalAlign: 'middle' }}>{seat.seatNumber}</span>
                <span
                  style={{
                    display: 'inline-block',
                    width: 1,
                    height: 12,
                    background: '#e0b07a',
                    margin: '0 8px',
                    verticalAlign: 'middle',
                  }}
                />
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    color: MUTED,
                    lineHeight: '30px',
                    verticalAlign: 'middle',
                  }}
                >
                  {seat.segmentName}
                </span>
              </span>
            ))}
          </div>
          <div style={{ fontSize: 12, color: MUTED, lineHeight: '18px' }}>
            Danh sách:{' '}
            <span style={{ color: INK, fontWeight: 700 }}>{seatList || '—'}</span>
          </div>
        </div>

        {/* Payment — full width, no side QR box */}
        <div
          style={{
            border: `1px solid ${LINE}`,
            borderRadius: 14,
            padding: '20px 22px',
            marginBottom: 28,
            boxSizing: 'border-box',
            background: CARD,
          }}
        >
          <SectionTitle>Chi tiết thanh toán</SectionTitle>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <tbody>
              {Object.entries(seatGroups).map(([name, data]) => (
                <tr key={name}>
                  <td
                    style={{
                      padding: '12px 0',
                      borderBottom: `1px solid ${LINE}`,
                      verticalAlign: 'middle',
                    }}
                  >
                    <div style={{ fontSize: 13, fontWeight: 700, color: INK, lineHeight: '18px' }}>
                      {name} × {data.qty}
                    </div>
                    <div style={{ fontSize: 11, color: MUTED, lineHeight: '16px', marginTop: 4 }}>
                      {data.seats.join(', ')} · {formatCurrency(data.priceEach)}/vé
                    </div>
                  </td>
                  <td
                    style={{
                      padding: '12px 0 12px 12px',
                      borderBottom: `1px solid ${LINE}`,
                      verticalAlign: 'middle',
                      textAlign: 'right',
                      whiteSpace: 'nowrap',
                      fontSize: 13,
                      fontWeight: 700,
                      color: INK,
                    }}
                  >
                    {formatCurrency(data.total)}
                  </td>
                </tr>
              ))}
              <tr>
                <td style={{ padding: '14px 0 6px', color: MUTED, fontSize: 12, verticalAlign: 'middle' }}>
                  Tạm tính
                </td>
                <td
                  style={{
                    padding: '14px 0 6px',
                    textAlign: 'right',
                    color: MUTED,
                    fontSize: 12,
                    verticalAlign: 'middle',
                  }}
                >
                  {formatCurrency(subtotal)}
                </td>
              </tr>
              {discount > 0 && (
                <tr>
                  <td
                    style={{
                      padding: '6px 0',
                      color: '#047857',
                      fontSize: 12,
                      fontWeight: 700,
                      verticalAlign: 'middle',
                    }}
                  >
                    Giảm giá
                  </td>
                  <td
                    style={{
                      padding: '6px 0',
                      textAlign: 'right',
                      color: '#047857',
                      fontSize: 12,
                      fontWeight: 700,
                      verticalAlign: 'middle',
                    }}
                  >
                    -{formatCurrency(discount)}
                  </td>
                </tr>
              )}
              <tr>
                <td
                  style={{
                    padding: '16px 0 0',
                    borderTop: `2px solid ${INK}`,
                    fontSize: 12,
                    fontWeight: 800,
                    letterSpacing: '0.06em',
                    verticalAlign: 'middle',
                    color: INK,
                  }}
                >
                  TỔNG THANH TOÁN
                </td>
                <td
                  style={{
                    padding: '16px 0 0',
                    borderTop: `2px solid ${INK}`,
                    textAlign: 'right',
                    fontSize: 22,
                    fontWeight: 800,
                    color: ORANGE,
                    verticalAlign: 'middle',
                    lineHeight: '28px',
                  }}
                >
                  {formatCurrency(ticket.totalPrice)}
                </td>
              </tr>
            </tbody>
          </table>
          {ticket.vnPayTransactionId && (
            <div style={{ fontSize: 10, color: MUTED, textAlign: 'right', marginTop: 12, lineHeight: '14px' }}>
              VNPAY: {ticket.vnPayTransactionId}
            </div>
          )}
        </div>

        {/* QR — no box, centered, high contrast on white */}
        <div
          style={{
            textAlign: 'center',
            padding: '8px 0 28px',
            background: CARD,
          }}
        >
          <div
            style={{
              fontSize: 10,
              fontWeight: 800,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: MUTED,
              lineHeight: '14px',
              marginBottom: 16,
            }}
          >
            Quét mã tại quầy
          </div>

          {/* Pure content: QR image only — white plate so modules always visible */}
          <div style={{ textAlign: 'center', lineHeight: 0, marginBottom: 14 }}>
            <img
              src={qrDataUrl}
              alt="QR code"
              width={160}
              height={160}
              style={{
                display: 'inline-block',
                width: 160,
                height: 160,
                background: '#ffffff',
                border: 0,
                verticalAlign: 'middle',
              }}
            />
          </div>

          <div
            style={{
              fontSize: 15,
              fontWeight: 800,
              color: INK,
              fontFamily: 'Courier New, monospace',
              letterSpacing: '0.1em',
              lineHeight: '22px',
              marginBottom: 6,
            }}
          >
            GXD-{code}
          </div>
          <div style={{ fontSize: 11, color: MUTED, lineHeight: '16px' }}>
            Xuất trình mã QR hoặc mã đặt vé khi vào rạp
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <div
        style={{
          borderTop: `1px dashed ${LINE}`,
          background: '#fafafa',
          padding: '18px 32px 20px',
          boxSizing: 'border-box',
        }}
      >
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <tbody>
            <tr>
              <td style={{ verticalAlign: 'middle', padding: 0, width: '72%' }}>
                <div style={{ fontSize: 10, color: MUTED, lineHeight: '16px' }}>
                  Vui lòng đến trước giờ chiếu ít nhất 15 phút. Vé đã thanh toán áp dụng theo chính sách
                  rạp.
                </div>
              </td>
              <td style={{ verticalAlign: 'middle', textAlign: 'right', padding: 0 }}>
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 800,
                    color: ORANGE,
                    lineHeight: '16px',
                    letterSpacing: '0.08em',
                  }}
                >
                  GALAXIAD
                </div>
                <div style={{ fontSize: 10, color: MUTED, lineHeight: '14px', marginTop: 4 }}>
                  Enjoy your movie
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export const downloadTicketAsPdf = async (ticket: TicketInfo): Promise<void> => {
  const code = shortCode(ticket.orderId);
  const qrPayload = `GXD-${code}|${ticket.orderId}|${ticket.showTime}|${ticket.seats
    .map((s) => s.seatNumber)
    .join(',')}`;

  // Load QR first as data URL (avoids blank capture from CORS)
  const qrDataUrl = await fetchQrDataUrl(qrPayload);

  const tempContainer = document.createElement('div');
  tempContainer.style.position = 'fixed';
  tempContainer.style.left = '-10000px';
  tempContainer.style.top = '0';
  tempContainer.style.zIndex = '-1';
  tempContainer.style.pointerEvents = 'none';
  tempContainer.style.fontFamily = 'Arial, Helvetica, sans-serif';
  tempContainer.style.lineHeight = 'normal';
  tempContainer.style.fontSize = '14px';
  tempContainer.style.background = '#ffffff';
  document.body.appendChild(tempContainer);

  const root = createRoot(tempContainer);
  root.render(<TicketTemplate ticket={ticket} qrDataUrl={qrDataUrl} />);

  await new Promise((r) => setTimeout(r, 200));

  try {
    const ticketElement = document.getElementById('pdf-ticket-template');
    if (!ticketElement) {
      throw new Error('Failed to find ticket template element.');
    }

    // Ensure data-URL image is decoded
    const img = ticketElement.querySelector('img');
    if (img && !img.complete) {
      await new Promise<void>((resolve) => {
        img.onload = () => resolve();
        img.onerror = () => resolve();
        setTimeout(() => resolve(), 2000);
      });
    }
    await new Promise((r) => requestAnimationFrame(() => setTimeout(r, 80)));

    const canvas = await html2canvas(ticketElement, {
      scale: 3,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false,
      scrollX: 0,
      scrollY: 0,
      width: ticketElement.offsetWidth,
      height: ticketElement.scrollHeight,
      onclone: (_doc, el) => {
        el.style.fontFamily = 'Arial, Helvetica, sans-serif';
        el.style.background = '#ffffff';
      },
    });

    const imgData = canvas.toDataURL('image/png', 1.0);
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true,
    });

    const pageW = pdf.internal.pageSize.getWidth();
    const pageH = pdf.internal.pageSize.getHeight();
    const margin = 14;
    const maxW = pageW - margin * 2;
    const maxH = pageH - margin * 2;

    const ratio = canvas.width / canvas.height;
    let drawW = maxW;
    let drawH = drawW / ratio;
    if (drawH > maxH) {
      drawH = maxH;
      drawW = drawH * ratio;
    }

    const x = (pageW - drawW) / 2;
    const y = margin;

    pdf.setFillColor(255, 255, 255);
    pdf.rect(0, 0, pageW, pageH, 'F');
    pdf.addImage(imgData, 'PNG', x, y, drawW, drawH, undefined, 'FAST');
    pdf.save(`Galaxiad_Ticket_${code}.pdf`);
  } catch (error) {
    console.error('Error generating PDF ticket:', error);
    throw error;
  } finally {
    root.unmount();
    document.body.removeChild(tempContainer);
  }
};
