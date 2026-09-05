import React from 'react';
import type { ConcessionMenuItemDto } from '../../../types/concession.types';

interface BookingConcessionsProps {
  concessionMenu: ConcessionMenuItemDto[];
  concessionQuantities: Record<string, number>;
  concessionsLoading: boolean;
  concessionTab: 'all' | 'products' | 'combos';
  onTabChange: (tab: 'all' | 'products' | 'combos') => void;
  onUpdateQuantity: (productId: string, delta: number) => void;
}

export const BookingConcessions: React.FC<BookingConcessionsProps> = ({
  concessionMenu,
  concessionQuantities,
  concessionsLoading,
  concessionTab,
  onTabChange,
  onUpdateQuantity,
}) => {
  const filteredMenu = concessionMenu.filter((item) => {
    if (concessionTab === 'products') return !item.isCombo;
    if (concessionTab === 'combos') return item.isCombo;
    return true;
  });

  return (
    <section className="glass-card rounded-2xl p-6 border border-white/10">
      <div className="flex justify-between items-center border-b border-white/10 pb-4 mb-4">
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-zinc-800 text-zinc-300 font-extrabold text-xs">
            3
          </span>
          <h2 className="text-lg md:text-xl font-bold text-white m-0">
            Thêm bắp nước <span className="text-xs text-zinc-500 font-normal ml-2">(Tuỳ chọn)</span>
          </h2>
        </div>
      </div>

      {/* Centered Segmented Category Tabs */}
      <div className="flex justify-center my-4">
        <div className="inline-flex p-1 bg-white/5 border border-white/10 rounded-xl gap-1">
          <button
            type="button"
            onClick={() => onTabChange('all')}
            className={`px-5 py-2 rounded-lg text-xs font-bold transition-all border-none cursor-pointer ${
              concessionTab === 'all'
                ? 'bg-[#ff8a00] text-black shadow-[0_0_12px_rgba(255,138,0,0.4)] font-extrabold'
                : 'bg-transparent text-zinc-400 hover:text-white'
            }`}
          >
            Tất cả ({concessionMenu.length})
          </button>
          <button
            type="button"
            onClick={() => onTabChange('products')}
            className={`px-5 py-2 rounded-lg text-xs font-bold transition-all border-none cursor-pointer ${
              concessionTab === 'products'
                ? 'bg-[#ff8a00] text-black shadow-[0_0_12px_rgba(255,138,0,0.4)] font-extrabold'
                : 'bg-transparent text-zinc-400 hover:text-white'
            }`}
          >
            Sản phẩm ({concessionMenu.filter((i) => !i.isCombo).length})
          </button>
          <button
            type="button"
            onClick={() => onTabChange('combos')}
            className={`px-5 py-2 rounded-lg text-xs font-bold transition-all border-none cursor-pointer ${
              concessionTab === 'combos'
                ? 'bg-[#ff8a00] text-black shadow-[0_0_12px_rgba(255,138,0,0.4)] font-extrabold'
                : 'bg-transparent text-zinc-400 hover:text-white'
            }`}
          >
            Combo ({concessionMenu.filter((i) => i.isCombo).length})
          </button>
        </div>
      </div>

      {/* Scrollable Container with max-h-[480px] */}
      <div className="overflow-y-auto max-h-[480px] custom-scrollbar p-1.5">
        {concessionsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[1, 2, 3, 4].map((k) => (
              <div key={k} className="h-20 bg-white/5 animate-pulse rounded-xl" />
            ))}
          </div>
        ) : concessionMenu.length === 0 ? (
          <div className="p-8 text-center text-xs text-zinc-500">
            Hiện tại rạp chưa mở bán bắp nước online.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filteredMenu.map((item) => {
              const quantity = concessionQuantities[item.productId] || 0;
              const outOfStock = item.isOutOfStock || item.availableToSell <= 0;
              return (
                <div
                  key={item.productId}
                  className={`group bg-zinc-950/70 p-4 rounded-xl border ${
                    quantity > 0
                      ? 'border-[#ff8a00] shadow-[0_0_15px_rgba(255,138,0,0.2)]'
                      : 'border-white/10 hover:border-[#ff8a00]'
                  } flex gap-4 items-center transition-all duration-200 hover:shadow-[0_0_20px_rgba(255,138,0,0.25)] hover:bg-zinc-900/90 cursor-pointer`}
                >
                  <div className="w-20 h-20 sm:w-22 sm:h-22 bg-zinc-900 rounded-xl flex-shrink-0 overflow-hidden flex items-center justify-center relative border border-white/5 group-hover:border-[#ff8a00]/40 transition-colors">
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt={item.productName}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 ease-out"
                      />
                    ) : (
                      <span className="material-symbols-outlined text-[#ff8a00] text-4xl group-hover:scale-110 transition-transform duration-300">
                        {item.category === 'Drink' ? 'local_cafe' : 'fastfood'}
                      </span>
                    )}
                    {item.isCombo && (
                      <span className="absolute top-1 left-1 bg-[#ff8a00] text-black text-[10px] font-extrabold px-1.5 py-0.5 rounded uppercase tracking-wider shadow-sm z-10">
                        COMBO
                      </span>
                    )}
                  </div>

                  <div className="flex-1 min-w-0 pr-1">
                    <h3 className="font-bold text-sm text-white group-hover:text-[#ff8a00] transition-colors leading-snug break-words m-0">
                      {item.productName}
                    </h3>
                    <p className="text-xs font-semibold text-[#ff8a00] mt-1.5 m-0">
                      {item.unitPrice.toLocaleString('vi-VN')}đ
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 bg-zinc-900/90 px-2.5 py-1.5 rounded-lg border border-white/10 group-hover:border-[#ff8a00]/40 transition-colors shadow-inner flex-shrink-0">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onUpdateQuantity(item.productId, -1);
                      }}
                      disabled={quantity === 0}
                      className="text-zinc-400 hover:text-white hover:bg-white/10 active:scale-85 disabled:opacity-20 transition-all rounded-md border-none bg-transparent cursor-pointer p-1 flex items-center justify-center"
                      title="Giảm"
                    >
                      <span className="material-symbols-outlined text-[16px]">remove</span>
                    </button>
                    <span className="font-bold w-5 text-center text-xs text-white select-none">
                      {quantity}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onUpdateQuantity(item.productId, 1);
                      }}
                      disabled={outOfStock || quantity >= 10}
                      className="text-[#ff8a00] hover:text-black hover:bg-[#ff8a00] active:scale-85 disabled:opacity-20 transition-all rounded-md border-none bg-transparent cursor-pointer p-1 flex items-center justify-center shadow-sm"
                      title="Thêm"
                    >
                      <span className="material-symbols-outlined text-[16px]">add</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
};

export default BookingConcessions;
