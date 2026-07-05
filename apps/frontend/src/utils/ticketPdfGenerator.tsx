import React from 'react';
import { createRoot } from 'react-dom/client';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { MapPin, Calendar, Landmark, QrCode } from 'lucide-react';

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

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(value);
};

const formatDate = (dateStr?: string) => {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  return d.toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: '2-digit', day: '2-digit' });
};

const formatTime = (dateStr?: string) => {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
};

const TicketTemplate: React.FC<{ ticket: TicketInfo }> = ({ ticket }) => {
  // Group seats by segment type to display totals per segment
  const seatGroups = ticket.seats.reduce((acc, seat) => {
    if (!acc[seat.segmentName]) {
      acc[seat.segmentName] = {
        qty: 0,
        priceEach: seat.priceEach,
        total: 0,
      };
    }
    acc[seat.segmentName].qty += 1;
    acc[seat.segmentName].total += seat.priceEach;
    return acc;
  }, {} as Record<string, { qty: number; priceEach: number; total: number }>);

  // Calculate subtotal before discounts
  const subtotal = ticket.seats.reduce((sum, seat) => sum + seat.priceEach, 0);
  // Calculate total discount applied
  const discountAmount = subtotal - ticket.totalPrice;

  return (
    <div
      id="pdf-ticket-template"
      style={{
        width: '450px',
        background: '#1f1f27', // surface-container
        color: '#e4e1ed', // on-surface
        fontFamily: "'Montserrat', 'Manrope', 'Segoe UI', sans-serif",
        borderRadius: '20px',
        boxSizing: 'border-box',
        position: 'relative',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
        border: '1px solid rgba(255, 255, 255, 0.05)', // glass-highlight
        overflow: 'hidden',
      }}
    >
      {/* Decorative Ticket Circle Cuts */}
      <div style={{ position: 'absolute', left: '-12px', top: '72%', width: '24px', height: '24px', borderRadius: '50%', background: '#0F0F17', zIndex: 10 }}></div>
      <div style={{ position: 'absolute', right: '-12px', top: '72%', width: '24px', height: '24px', borderRadius: '50%', background: '#0F0F17', zIndex: 10 }}></div>

      {/* Ticket Header Wrapper */}
      <div style={{ padding: '32px 32px 20px 32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#ff8c00', color: '#623200', fontSize: '10px', fontWeight: 800, padding: '4px 12px', borderRadius: '4px', letterSpacing: '0.5px', height: '24px', boxSizing: 'border-box' }}>
            {ticket.formatName || '2D DIGITAL'}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #564334', color: '#ddc1ae', fontSize: '10px', fontWeight: 700, padding: '4px 16px', borderRadius: '9999px', letterSpacing: '2px', height: '24px', boxSizing: 'border-box' }}>
            E-TICKET
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <h2 style={{ margin: '0 0 4px 0', fontSize: '24px', fontWeight: 800, color: '#e4e1ed', lineHeight: '1.2' }}>
            {ticket.movieName}
          </h2>
          <p style={{ margin: 0, fontSize: '11px', color: '#a48c7a', fontWeight: 700, letterSpacing: '1px' }}>
            Mã đơn: #{ticket.orderId.substring(0, 8).toUpperCase()}
          </p>
        </div>
      </div>

      {/* Details Section */}
      <div style={{ padding: '0 32px' }}>
        <div style={{ background: '#1b1b23', borderRadius: '12px', padding: '20px', border: '1px solid rgba(255, 255, 255, 0.05)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ffb77d', marginBottom: '6px', lineHeight: '1' }}>
              <Calendar size={14} style={{ display: 'inline-block', flexShrink: 0 }} />
              <span style={{ fontSize: '10px', color: '#a48c7a', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', lineHeight: '1', display: 'inline-block' }}>THỜI GIAN</span>
            </div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: '#e4e1ed', paddingLeft: '22px' }}>{formatDate(ticket.showTime)}</div>
            <div style={{ fontSize: '20px', fontWeight: 700, color: '#ff8c00', marginTop: '2px', paddingLeft: '22px' }}>{formatTime(ticket.showTime)}</div>
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ffb77d', marginBottom: '6px', lineHeight: '1' }}>
              <Landmark size={14} style={{ display: 'inline-block', flexShrink: 0 }} />
              <span style={{ fontSize: '10px', color: '#a48c7a', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', lineHeight: '1', display: 'inline-block' }}>RẠP / PHÒNG</span>
            </div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: '#e4e1ed', paddingLeft: '22px' }}>{ticket.cinemaName}</div>
            <div style={{ fontSize: '12px', color: '#ddc1ae', marginTop: '2px', paddingLeft: '22px' }}>Phòng chiếu: {ticket.auditoriumNumber || 'Cinema Room'}</div>
          </div>
          <div style={{ gridColumn: 'span 2' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ffb77d', marginBottom: '6px', lineHeight: '1' }}>
              <MapPin size={14} style={{ display: 'inline-block', flexShrink: 0 }} />
              <span style={{ fontSize: '10px', color: '#a48c7a', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', lineHeight: '1', display: 'inline-block' }}>ĐỊA ĐIỂM RẠP</span>
            </div>
            <div style={{ fontSize: '12px', color: '#ddc1ae', lineHeight: '1.4', paddingLeft: '22px' }}>
              {ticket.cinemaAddress || 'Galaxy Cinema Center Complex'}
            </div>
          </div>
        </div>
      </div>

      {/* Seat Selection */}
      <div style={{ padding: '24px 32px' }}>
        <h4 style={{ margin: '0 0 10px 0', fontSize: '10px', color: '#a48c7a', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase' }}>DANH SÁCH GHẾ CHỌN</h4>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
          {ticket.seats.map((seat, index) => (
            <div
              key={index}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '12px',
                background: 'rgba(208, 0, 65, 0.08)',
                border: '1px solid #d00041',
                borderRadius: '8px',
                padding: '8px 16px',
                height: '38px',
                boxSizing: 'border-box',
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', fontWeight: 700, color: '#ffb2b7', lineHeight: 1 }}>{seat.seatNumber}</span>
              <div style={{ height: '18px', width: '1px', background: '#564334' }}></div>
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700, color: '#ffe1e2', letterSpacing: '0.5px', lineHeight: 1 }}>{seat.segmentName}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Payment Summary & Perforation */}
      <div style={{ borderTop: '2px dashed #34343d', paddingTop: '24px', paddingLeft: '32px', paddingRight: '32px', paddingBottom: '28px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px', color: '#ddc1ae', marginBottom: '16px' }}>
          <span>Phương thức:</span>
          <span style={{ fontWeight: 600, color: '#e4e1ed' }}>Thanh toán trực tuyến</span>
        </div>

        {/* Detailed Seat breakdown */}
        <div style={{ borderBottom: '1px solid #34343d', paddingBottom: '12px', marginBottom: '14px' }}>
          <div style={{ fontSize: '10px', color: '#a48c7a', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '8px' }}>
            Chi tiết vé
          </div>
          {Object.entries(seatGroups).map(([segmentName, data], index) => (
            <div key={index} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#ddc1ae', marginBottom: '6px' }}>
              <span>Vé {segmentName} ({data.qty} vé x {formatCurrency(data.priceEach)})</span>
              <span style={{ fontWeight: 600, color: '#e4e1ed' }}>{formatCurrency(data.total)}</span>
            </div>
          ))}
        </div>

        {/* Subtotal & Discounts */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', color: '#ddc1ae' }}>
            <span>Tổng cộng tiền vé:</span>
            <span>{formatCurrency(subtotal)}</span>
          </div>
          {discountAmount > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', color: '#ffb2b7', fontWeight: 600 }}>
              <span>Chiết khấu / Giảm giá:</span>
              <span>-{formatCurrency(discountAmount)}</span>
            </div>
          )}
        </div>

        {/* Grand Total */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #34343d', paddingTop: '16px' }}>
          <span style={{ fontSize: '12px', fontWeight: 700, color: '#ffb77d', letterSpacing: '1px' }}>TỔNG THANH TOÁN</span>
          <span style={{ fontSize: '24px', fontWeight: 800, color: '#ff8c00' }}>{formatCurrency(ticket.totalPrice)}</span>
        </div>
      </div>

      {/* QR Code Section (The "Stub") */}
      <div style={{ background: '#34343d', padding: '24px 32px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
        <div style={{ background: '#ffffff', padding: '16px', borderRadius: '12px', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.06)' }}>
          <QrCode size={110} style={{ color: '#090e1a' }} />
        </div>
        <p style={{ margin: 0, fontSize: '10px', color: '#a48c7a', fontWeight: 700, letterSpacing: '2px', textAlign: 'center', lineHeight: '1.6' }}>
          QUÉT MÃ TẠI QUẦY ĐỂ NHẬN VÉ CỨNG
        </p>
        <div style={{ textAlign: 'center' }}>
          <p style={{ margin: 0, fontSize: '10px', color: '#ddc1ae', opacity: 0.6, fontWeight: 700, letterSpacing: '0.5px' }}>
            Galaxy Cinema &bull; Enjoy Your Movie
          </p>
        </div>
      </div>
    </div>
  );
};

export const downloadTicketAsPdf = async (ticket: TicketInfo): Promise<void> => {
  const tempContainer = document.createElement('div');
  tempContainer.style.position = 'absolute';
  tempContainer.style.left = '-9999px';
  tempContainer.style.top = '-9999px';
  document.body.appendChild(tempContainer);

  const root = createRoot(tempContainer);
  root.render(<TicketTemplate ticket={ticket} />);

  // Wait for React to mount and icons to load
  await new Promise((resolve) => setTimeout(resolve, 300));

  try {
    const ticketElement = document.getElementById('pdf-ticket-template');
    if (!ticketElement) {
      throw new Error('Failed to find ticket template element.');
    }

    const canvas = await html2canvas(ticketElement, {
      scale: 2,
      useCORS: true,
      backgroundColor: null,
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'px',
      format: [450, canvas.height / 2],
    });

    pdf.addImage(imgData, 'PNG', 0, 0, 450, canvas.height / 2);
    pdf.save(`ticket_${ticket.orderId.substring(0, 8).toUpperCase()}.pdf`);
  } catch (error) {
    console.error('Error generating PDF ticket:', error);
    throw error;
  } finally {
    root.unmount();
    document.body.removeChild(tempContainer);
  }
};
