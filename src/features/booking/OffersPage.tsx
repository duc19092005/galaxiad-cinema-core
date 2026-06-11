// src/features/booking/OffersPage.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Ticket, Sparkles, ShoppingBag, Wallet, Coins, Clock, ShieldAlert, Loader2 } from 'lucide-react';
import { voucherApi, type VoucherDto, type UserVoucherDto } from '../../api/voucherApi';
import { bookingApi } from '../../api/bookingApi';
import Header from '../../components/Header';
import { showSuccess, showError } from '../../utils/ToastUtils';

const MOCK_PROMOTIONS = [
  {
    id: 'p1',
    title: 'Student Discount Day',
    description: 'Every Monday & Tuesday, present your student ID to get 10% off plus free popcorn!',
    code: 'STUDENTDAY',
    image: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=600',
    tag: 'Student Offer'
  },
  {
    id: 'p2',
    title: 'Midnight Cinema Special',
    description: 'Save 20% on any showtime after 22:00. Perfect for night owls!',
    code: 'MIDNIGHT20',
    image: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=600',
    tag: 'Special Promo'
  },
  {
    id: 'p3',
    title: 'Double Points Weekend',
    description: 'Earn 2x reward points on all tickets bought between Friday and Sunday.',
    code: 'DOUBLEPOINTS',
    image: 'https://images.unsplash.com/photo-1560169897-fc0cdbdfa4d5?auto=format&fit=crop&w=600',
    tag: 'Points Booster'
  },
  {
    id: 'p4',
    title: 'First booking Coupon',
    description: 'First time booking tickets online? Enter code WELCOME5 at checkout to save 5%.',
    code: 'WELCOME5',
    image: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=600',
    tag: 'New Member'
  }
];

export const OffersPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'offers' | 'store' | 'wallet'>('offers');
  
  // Auth state
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userPoints, setUserPoints] = useState<number>(0);
  const [userRole, setUserRole] = useState<string>('Guest');

  // Point Store & Wallet state
  const [activeVouchers, setActiveVouchers] = useState<VoucherDto[]>([]);
  const [myVouchers, setMyVouchers] = useState<UserVoucherDto[]>([]);
  
  const [loadingStore, setLoadingStore] = useState(false);
  const [loadingWallet, setLoadingWallet] = useState(false);
  const [redeemingId, setRedeemingId] = useState<string | null>(null);

  useEffect(() => {
    const checkLogin = () => {
      const stored = localStorage.getItem('user_info');
      if (stored) {
        setIsLoggedIn(true);
        try {
          const parsed = JSON.parse(stored);
          setUserRole(parsed.selectedRole || 'Guest');
        } catch {
          // ignore
        }
        fetchUserData();
      } else {
        setIsLoggedIn(false);
      }
    };
    checkLogin();
  }, []);

  useEffect(() => {
    if (activeTab === 'store' && isLoggedIn) {
      fetchStoreVouchers();
    } else if (activeTab === 'wallet' && isLoggedIn) {
      fetchUserVouchers();
    }
  }, [activeTab, isLoggedIn]);

  const fetchUserData = async () => {
    try {
      const res = await bookingApi.getAccountInfo();
      if (res.isSuccess) {
        setUserPoints(res.data.rewardPoints || 0);
      }
    } catch (err) {
      console.error('Failed to load user reward points:', err);
    }
  };

  const fetchStoreVouchers = async () => {
    setLoadingStore(true);
    try {
      const res = await voucherApi.getActiveVouchers();
      if (res.isSuccess) {
        setActiveVouchers(res.data || []);
      }
    } catch (err) {
      console.error(err);
      showError('Failed to load voucher store listing.');
    } finally {
      setLoadingStore(false);
    }
  };

  const fetchUserVouchers = async () => {
    setLoadingWallet(true);
    try {
      const res = await voucherApi.getMyVouchers();
      if (res.isSuccess) {
        setMyVouchers(res.data || []);
      }
    } catch (err) {
      console.error(err);
      showError('Failed to load your voucher wallet.');
    } finally {
      setLoadingWallet(false);
    }
  };

  const handleRedeem = async (voucherId: string, cost: number, name: string) => {
    if (userPoints < cost) {
      showError('Insufficient reward points to redeem this voucher.');
      return;
    }

    setRedeemingId(voucherId);
    try {
      const res = await voucherApi.redeemVoucher(voucherId);
      if (res.isSuccess) {
        showSuccess(`Successfully redeemed: ${name}!`);
        // Deduct points locally
        setUserPoints((prev) => Math.max(0, prev - cost));
        // Refresh listings
        fetchStoreVouchers();
      } else {
        showError('Redemption failed. Please try again.');
      }
    } catch (err: any) {
      console.error(err);
      const msg = err.response?.data?.message || 'Error redeeming voucher.';
      showError(msg);
    } finally {
      setRedeemingId(null);
    }
  };

  const isVoucherExpired = (validTo: string | null) => {
    if (!validTo) return false;
    return new Date(validTo).getTime() < new Date().getTime();
  };

  const unusedVouchers = myVouchers.filter((v) => !v.isUsed && !isVoucherExpired(v.validTo));
  const historyVouchers = myVouchers.filter((v) => v.isUsed || isVoucherExpired(v.validTo));

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-base)', color: 'var(--text-primary)', overflowX: 'hidden' }}>
      <Header />

      <main style={{ paddingTop: '100px', paddingBottom: '60px', maxWidth: '1200px', margin: '0 auto', paddingLeft: '24px', paddingRight: '24px' }}>
        
        {/* Page Banner Header */}
        <div style={{ marginBottom: '40px', textAlign: 'center' }}>
          <span style={{
            fontSize: '12px',
            textTransform: 'uppercase',
            letterSpacing: '0.15em',
            color: 'var(--primary, #ff8a00)',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            marginBottom: '8px'
          }}>
            <Sparkles size={14} /> Rewards & Promotions
          </span>
          <h1 style={{ fontSize: '36px', fontWeight: 900, margin: 0, letterSpacing: '-0.02em' }}>
            Offers & Vouchers
          </h1>
        </div>

        {/* Tab Switcher Controls */}
        <div 
          style={{ 
            display: 'flex', 
            justifyContent: 'center',
            gap: '12px',
            marginBottom: '40px',
            flexWrap: 'wrap'
          }}
        >
          <button
            onClick={() => setActiveTab('offers')}
            style={{
              padding: '12px 24px',
              borderRadius: 'var(--radius-full)',
              background: activeTab === 'offers' ? 'linear-gradient(135deg, var(--primary, #ff8a00), #e17600)' : 'rgba(255,255,255,0.03)',
              border: activeTab === 'offers' ? 'none' : '1px solid rgba(255,255,255,0.05)',
              color: activeTab === 'offers' ? 'black' : 'var(--text-secondary)',
              fontWeight: 800,
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              cursor: 'pointer',
              boxShadow: activeTab === 'offers' ? '0 6px 20px rgba(255,138,0,0.2)' : 'none',
              transition: 'all 0.3s',
            }}
          >
            <Ticket size={16} /> Deals & Offers
          </button>

          <button
            onClick={() => setActiveTab('store')}
            style={{
              padding: '12px 24px',
              borderRadius: 'var(--radius-full)',
              background: activeTab === 'store' ? 'linear-gradient(135deg, var(--primary, #ff8a00), #e17600)' : 'rgba(255,255,255,0.03)',
              border: activeTab === 'store' ? 'none' : '1px solid rgba(255,255,255,0.05)',
              color: activeTab === 'store' ? 'black' : 'var(--text-secondary)',
              fontWeight: 800,
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              cursor: 'pointer',
              boxShadow: activeTab === 'store' ? '0 6px 20px rgba(255,138,0,0.2)' : 'none',
              transition: 'all 0.3s',
            }}
          >
            <ShoppingBag size={16} /> Points Store
          </button>

          <button
            onClick={() => setActiveTab('wallet')}
            style={{
              padding: '12px 24px',
              borderRadius: 'var(--radius-full)',
              background: activeTab === 'wallet' ? 'linear-gradient(135deg, var(--primary, #ff8a00), #e17600)' : 'rgba(255,255,255,0.03)',
              border: activeTab === 'wallet' ? 'none' : '1px solid rgba(255,255,255,0.05)',
              color: activeTab === 'wallet' ? 'black' : 'var(--text-secondary)',
              fontWeight: 800,
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              cursor: 'pointer',
              boxShadow: activeTab === 'wallet' ? '0 6px 20px rgba(255,138,0,0.2)' : 'none',
              transition: 'all 0.3s',
            }}
          >
            <Wallet size={16} /> My Wallet
          </button>
        </div>

        {/* -------------------- TAB CONTENT: DEALS & OFFERS -------------------- */}
        {activeTab === 'offers' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '30px' }}>
            {MOCK_PROMOTIONS.map((promo) => (
              <div 
                key={promo.id} 
                className="glass-card" 
                style={{ 
                  borderRadius: 'var(--radius-xl)', 
                  overflow: 'hidden', 
                  border: '1px solid rgba(255,255,255,0.05)',
                  background: 'rgba(18,18,20,0.3)',
                  display: 'flex',
                  flexDirection: 'column',
                  height: '100%'
                }}
              >
                {/* Image & tag */}
                <div style={{ height: '180px', position: 'relative', overflow: 'hidden' }}>
                  <img src={promo.image} alt={promo.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <span style={{
                    position: 'absolute',
                    top: '12px',
                    left: '12px',
                    fontSize: '10px',
                    fontWeight: 800,
                    padding: '4px 10px',
                    borderRadius: 'var(--radius-full)',
                    background: 'var(--primary, #ff8a00)',
                    color: 'black',
                    textTransform: 'uppercase'
                  }}>
                    {promo.tag}
                  </span>
                </div>

                {/* Content */}
                <div style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <h3 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '8px' }}>{promo.title}</h3>
                    <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.4', margin: '0 0 16px 0' }}>
                      {promo.description}
                    </p>
                  </div>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)', padding: '10px 14px', borderRadius: 'var(--radius-md)', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Promo Code:</span>
                    <span style={{ fontSize: '14px', fontWeight: 800, color: 'var(--primary, #ff8a00)', letterSpacing: '0.05em' }}>{promo.code}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* -------------------- TAB CONTENT: POINTS STORE -------------------- */}
        {activeTab === 'store' && (
          <div>
            {/* Points Balance Header Banner */}
            <div 
              className="glass-card" 
              style={{ 
                padding: '24px 30px', 
                borderRadius: 'var(--radius-xl)', 
                marginBottom: '32px',
                border: '1px solid rgba(255,138,0,0.15)',
                background: 'linear-gradient(135deg, rgba(255,138,0,0.06) 0%, rgba(0,0,0,0.3) 100%)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '20px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(255,138,0,0.15)', display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
                  <Coins size={24} />
                </div>
                <div>
                  <h3 style={{ fontSize: '14px', color: 'var(--text-secondary)', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Your Reward Points</h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '28px', fontWeight: 900, color: 'var(--text-primary)' }}>
                      {isLoggedIn ? userPoints : '0'}
                    </span>
                    <span style={{ fontSize: '14px', color: 'var(--primary, #ff8a00)', fontWeight: 600 }}>PTS</span>
                  </div>
                </div>
              </div>

              {!isLoggedIn ? (
                <button 
                  onClick={() => navigate('/login')}
                  style={{
                    padding: '10px 20px',
                    borderRadius: 'var(--radius-full)',
                    background: 'var(--primary, #ff8a00)',
                    color: 'black',
                    fontWeight: 700,
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '13px'
                  }}
                >
                  Sign In to Redeem
                </button>
              ) : (
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)', textAlign: 'right' }}>
                  Loyalty Tier: <span style={{ color: 'var(--primary)', fontWeight: 700 }}>{userRole}</span>
                </div>
              )}
            </div>

            {/* Vouchers Store List */}
            {!isLoggedIn ? (
              <div className="glass-card" style={{ padding: '48px', textAlign: 'center', borderRadius: 'var(--radius-xl)' }}>
                <ShieldAlert size={40} style={{ color: 'var(--text-secondary)', opacity: 0.2, margin: '0 auto 16px' }} />
                <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '8px' }}>Login Required</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '14px', margin: '0 0 16px 0' }}>
                  Please sign in to access the voucher point exchange store.
                </p>
                <button onClick={() => navigate('/login')} className="btn btn-primary" style={{ padding: '8px 20px', height: 'auto' }}>Sign In Now</button>
              </div>
            ) : loadingStore ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0' }}>
                <Loader2 size={32} className="animate-spin" style={{ color: 'var(--primary)', animation: 'spin 1s linear infinite' }} />
              </div>
            ) : activeVouchers.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-secondary)' }}>
                No active vouchers available for redemption at this time.
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '30px' }}>
                {activeVouchers.map((v) => {
                  const hasEnoughPoints = userPoints >= v.voucherPointsCost;
                  const isRedeeming = redeemingId === v.voucherId;
                  const isLimitReached = v.remainingQuantity <= 0;

                  return (
                    <div 
                      key={v.voucherId}
                      className="glass-card"
                      style={{
                        padding: '20px',
                        borderRadius: 'var(--radius-xl)',
                        border: '1px solid rgba(255,255,255,0.05)',
                        background: 'rgba(18,18,20,0.3)',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                      }}
                    >
                      <div>
                        {/* Title & discount amount */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
                          <div>
                            <span style={{ fontSize: '10px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Voucher Offer</span>
                            <h3 style={{ fontSize: '18px', fontWeight: 800, margin: '2px 0 0 0' }}>{v.voucherName}</h3>
                          </div>
                          <div style={{ fontSize: '24px', fontWeight: 900, color: 'var(--primary, #ff8a00)' }}>
                            {v.voucherDiscountPercent}% <span style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-secondary)' }}>OFF</span>
                          </div>
                        </div>

                        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '0 0 16px 0', lineHeight: '1.4' }}>
                          {v.voucherDescription}
                        </p>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '20px', background: 'rgba(255,255,255,0.01)', padding: '10px', borderRadius: 'var(--radius-sm)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span>Available stock:</span>
                            <span style={{ fontWeight: 700 }}>{v.remainingQuantity} / {v.voucherQuantity} left</span>
                          </div>
                          {v.validTo && (
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <span>Valid until:</span>
                              <span>{new Date(v.validTo).toLocaleDateString('vi-VN')}</span>
                            </div>
                          )}
                          {v.roleName && (
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <span>Exclusive for:</span>
                              <span style={{ color: 'var(--primary)', fontWeight: 600 }}>{v.roleName} only</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Redemption Button */}
                      <button
                        onClick={() => handleRedeem(v.voucherId, v.voucherPointsCost, v.voucherName)}
                        disabled={!hasEnoughPoints || isRedeeming || isLimitReached}
                        style={{
                          width: '100%',
                          padding: '12px',
                          borderRadius: 'var(--radius-md)',
                          background: isLimitReached 
                            ? 'rgba(255,255,255,0.04)' 
                            : !hasEnoughPoints 
                            ? 'rgba(255,138,0,0.04)' 
                            : 'linear-gradient(135deg, var(--primary, #ff8a00), #e17600)',
                          border: !hasEnoughPoints || isLimitReached ? '1px solid rgba(255,255,255,0.05)' : 'none',
                          color: isLimitReached || !hasEnoughPoints ? 'var(--text-secondary)' : 'black',
                          fontWeight: 800,
                          fontSize: '13px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                          cursor: isLimitReached || !hasEnoughPoints ? 'not-allowed' : 'pointer',
                          boxShadow: !hasEnoughPoints || isLimitReached ? 'none' : '0 4px 12px rgba(255,138,0,0.15)',
                          transition: 'all 0.2s',
                        }}
                      >
                        {isRedeeming ? (
                          <>
                            <Loader2 size={16} className="animate-spin" style={{ animation: 'spin 1s linear infinite' }} />
                            Exchanging...
                          </>
                        ) : isLimitReached ? (
                          'OUT OF STOCK'
                        ) : (
                          <>
                            <Coins size={16} />
                            Redeem for {v.voucherPointsCost} PTS
                          </>
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* -------------------- TAB CONTENT: MY WALLET -------------------- */}
        {activeTab === 'wallet' && (
          <div>
            {!isLoggedIn ? (
              <div className="glass-card" style={{ padding: '48px', textAlign: 'center', borderRadius: 'var(--radius-xl)' }}>
                <ShieldAlert size={40} style={{ color: 'var(--text-secondary)', opacity: 0.2, margin: '0 auto 16px' }} />
                <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '8px' }}>Login Required</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '14px', margin: '0 0 16px 0' }}>
                  Please sign in to view your voucher wallet.
                </p>
                <button onClick={() => navigate('/login')} className="btn btn-primary" style={{ padding: '8px 20px', height: 'auto' }}>Sign In Now</button>
              </div>
            ) : loadingWallet ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0' }}>
                <Loader2 size={32} className="animate-spin" style={{ color: 'var(--primary)', animation: 'spin 1s linear infinite' }} />
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
                
                {/* Active Unused Vouchers */}
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--primary, #ff8a00)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    Available Vouchers ({unusedVouchers.length})
                  </h3>
                  
                  {unusedVouchers.length === 0 ? (
                    <div className="glass-card" style={{ padding: '30px', textAlign: 'center', borderRadius: 'var(--radius-lg)', border: '1px solid rgba(255,255,255,0.04)' }}>
                      <span style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Your wallet is currently empty. Redeem some vouchers above!</span>
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
                      {unusedVouchers.map((v) => (
                        <div 
                          key={v.userVoucherId}
                          className="glass-card" 
                          style={{ 
                            padding: '18px 22px', 
                            borderRadius: 'var(--radius-lg)', 
                            borderLeft: '4px solid var(--primary, #ff8a00)', 
                            background: 'rgba(18,18,20,0.3)',
                            position: 'relative'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                            <div>
                              <h4 style={{ fontSize: '16px', fontWeight: 800, margin: 0 }}>{v.voucherName}</h4>
                              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
                                {v.voucherDescription}
                              </p>
                            </div>
                            <div style={{ fontSize: '20px', fontWeight: 900, color: 'var(--primary, #ff8a00)' }}>
                              {v.voucherDiscountPercent}%
                            </div>
                          </div>

                          <div style={{ display: 'flex', justifyItems: 'center', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', fontSize: '11px', color: 'var(--text-secondary)', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '10px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <Clock size={12} />
                              <span>Expires: {v.validTo ? new Date(v.validTo).toLocaleDateString('vi-VN') : 'Never'}</span>
                            </div>
                            <span style={{ color: 'var(--primary)', fontWeight: 700 }}>UNUSED</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Used/Expired History */}
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                    Usage History ({historyVouchers.length})
                  </h3>

                  {historyVouchers.length === 0 ? (
                    <div style={{ fontSize: '13px', color: 'var(--text-muted)', paddingLeft: '8px' }}>No historic entries.</div>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
                      {historyVouchers.map((v) => (
                        <div 
                          key={v.userVoucherId}
                          className="glass-card" 
                          style={{ 
                            padding: '18px 22px', 
                            borderRadius: 'var(--radius-lg)', 
                            borderLeft: '4px solid #52525b', 
                            background: 'rgba(18,18,20,0.15)',
                            opacity: 0.5
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                            <div>
                              <h4 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: 'var(--text-secondary)' }}>{v.voucherName}</h4>
                              <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
                                {v.voucherDescription}
                              </p>
                            </div>
                            <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-secondary)' }}>
                              {v.voucherDiscountPercent}%
                            </div>
                          </div>

                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', fontSize: '11px', color: 'var(--text-muted)', borderTop: '1px solid rgba(255,255,255,0.03)', paddingTop: '10px' }}>
                            <div>
                              {v.isUsed ? (
                                <span>Used on {v.usedAt ? new Date(v.usedAt).toLocaleDateString('vi-VN') : 'unknown date'}</span>
                              ) : (
                                <span>Expired on {v.validTo ? new Date(v.validTo).toLocaleDateString('vi-VN') : 'unknown date'}</span>
                              )}
                            </div>
                            <span style={{ fontWeight: 700 }}>{v.isUsed ? 'USED' : 'EXPIRED'}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>
            )}
          </div>
        )}

      </main>
    </div>
  );
};
