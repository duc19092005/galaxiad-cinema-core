import { useState, useEffect } from 'react';
import { publicApi } from '../../../api/publicApi';
import { concessionApi } from '../../../api/concessionApi';
import { voucherApi, type UserVoucherDto } from '../../../api/voucherApi';
import type { PublicSeatMap, PublicPricing } from '../../../types/public.types';
import type { ConcessionMenuItemDto } from '../../../types/concession.types';

interface UseBookingDataReturn {
  seatMap: PublicSeatMap | null;
  pricing: PublicPricing | null;
  concessionMenu: ConcessionMenuItemDto[];
  myVouchers: UserVoucherDto[];
  loading: boolean;
  concessionsLoading: boolean;
  error: string | null;
  refetchData: () => Promise<void>;
}

export function useBookingData(scheduleId: string | undefined, isLoggedIn: boolean): UseBookingDataReturn {
  const [seatMap, setSeatMap] = useState<PublicSeatMap | null>(null);
  const [pricing, setPricing] = useState<PublicPricing | null>(null);
  const [concessionMenu, setConcessionMenu] = useState<ConcessionMenuItemDto[]>([]);
  const [myVouchers, setMyVouchers] = useState<UserVoucherDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [concessionsLoading, setConcessionsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    if (!scheduleId) return;
    setLoading(true);
    setError(null);
    try {
      const seatRes = await publicApi.getSeatMap(scheduleId);
      setSeatMap(seatRes.data);

      setConcessionsLoading(true);
      const [priceResult, menuResult] = await Promise.allSettled([
        publicApi.getPricing(scheduleId),
        seatRes.data.cinemaId
          ? concessionApi.getPublicMenu(seatRes.data.cinemaId)
          : Promise.resolve({ isSuccess: true, message: '', data: [] as ConcessionMenuItemDto[] }),
      ]);

      if (priceResult.status === 'fulfilled') {
        setPricing(priceResult.value.data);
      } else {
        console.warn('Pricing not found, skipping for now');
      }

      if (menuResult.status === 'fulfilled') {
        setConcessionMenu(menuResult.value.data || []);
      } else {
        console.warn('Concession menu not found, skipping for now');
        setConcessionMenu([]);
      }
      setConcessionsLoading(false);
    } catch {
      setError('Failed to load booking information.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (scheduleId) {
      fetchData();
    }
  }, [scheduleId]);

  useEffect(() => {
    if (isLoggedIn) {
      const fetchWallet = async () => {
        try {
          const res = await voucherApi.getMyVouchers();
          if (res.isSuccess) {
            const today = new Date().getTime();
            const unused = (res.data || []).filter(
              (v) => !v.isUsed && (!v.validTo || new Date(v.validTo).getTime() >= today)
            );
            setMyVouchers(unused);
          }
        } catch (err) {
          console.error('Error fetching user vouchers:', err);
        }
      };
      fetchWallet();
    }
  }, [isLoggedIn]);

  return {
    seatMap,
    pricing,
    concessionMenu,
    myVouchers,
    loading,
    concessionsLoading,
    error,
    refetchData: fetchData,
  };
}
