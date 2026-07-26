import React from 'react';
import { Flame, Minus, PackageOpen, Plus, Popcorn, Sparkles, X } from 'lucide-react';
import type { ConcessionMenuItemDto } from '../../types/concession.types';

type Props = {
    menu: ConcessionMenuItemDto[];
    quantities: Record<string, number>;
    loading: boolean;
    isOpen: boolean;
    onChange: (productId: string, delta: number) => void;
    onClose: () => void;
};

const formatMoney = (value: number) => `${value.toLocaleString('vi-VN')}đ`;

const ProductGroup: React.FC<{
    title: string;
    description: string;
    icon: React.ReactNode;
    items: ConcessionMenuItemDto[];
    quantities: Record<string, number>;
    onChange: (productId: string, delta: number) => void;
}> = ({ title, description, icon, items, quantities, onChange }) => (
    <section>
        <div className="mb-4 flex items-start gap-3">
            <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[#ff8a00]/25 bg-[#ff8a00]/10 text-[#ff8a00]">
                {icon}
            </span>
            <div>
                <h4 className="m-0 text-sm font-extrabold text-white">{title}</h4>
                <p className="mt-1 text-xs text-zinc-500">{description}</p>
            </div>
        </div>

        {items.length === 0 ? (
            <div className="rounded-xl border border-dashed border-white/10 px-4 py-6 text-center text-xs text-zinc-500">
                Chưa có sản phẩm đang bán online trong nhóm này.
            </div>
        ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {items.map((item) => {
                    const quantity = quantities[item.productId] || 0;
                    const outOfStock = item.isOutOfStock || item.availableToSell <= 0;
                    return (
                        <article
                            key={item.productId}
                            className={`overflow-hidden rounded-xl border bg-zinc-950/60 transition-colors ${
                                quantity > 0 ? 'border-[#ff8a00]/60' : 'border-white/10 hover:border-white/20'
                            } ${outOfStock ? 'opacity-55' : ''}`}
                        >
                            <div className="relative aspect-[16/9] overflow-hidden bg-zinc-900">
                                {item.imageUrl ? (
                                    <img src={item.imageUrl} alt={item.productName} className="h-full w-full object-cover" loading="lazy" />
                                ) : (
                                    <div className="flex h-full items-center justify-center text-zinc-700"><PackageOpen size={28} /></div>
                                )}
                                {item.isCombo && (
                                    <span className="absolute left-2 top-2 rounded-md border border-[#ff8a00]/30 bg-zinc-950/90 px-2 py-1 text-[10px] font-extrabold uppercase tracking-wider text-[#ff8a00]">
                                        Combo
                                    </span>
                                )}
                                <div className="absolute right-2 top-2 flex flex-col items-end gap-1.5">
                                    {item.isHot && (
                                        <span className="inline-flex items-center gap-1 rounded-md border border-red-400/35 bg-zinc-950/90 px-2 py-1 text-[10px] font-extrabold uppercase tracking-wider text-red-300">
                                            <Flame size={11} strokeWidth={2} /> Đang hot
                                        </span>
                                    )}
                                    {item.isLowStock && !outOfStock && (
                                        <span className="rounded-md border border-amber-400/35 bg-zinc-950/90 px-2 py-1 text-[10px] font-extrabold uppercase tracking-wider text-amber-300">
                                            Sắp hết
                                        </span>
                                    )}
                                </div>
                            </div>
                            <div className="p-3">
                                <div className="min-h-10">
                                    <h5 className="m-0 line-clamp-1 text-sm font-bold text-white">{item.productName}</h5>
                                    <p className="mt-1 line-clamp-1 text-[11px] text-zinc-500">{item.description || item.category}</p>
                                </div>
                                {item.isLowStock && !outOfStock && (
                                    <p className="mt-2 text-[11px] font-medium text-amber-300">Mua ngay — số phần còn lại đang rất ít.</p>
                                )}
                                <div className="mt-3 flex items-center justify-between gap-3">
                                    <div className="text-sm font-extrabold text-[#ff8a00]">{formatMoney(item.unitPrice)}</div>
                                    <div className="flex h-9 items-center overflow-hidden rounded-lg border border-white/10 bg-zinc-900">
                                        <button
                                            type="button"
                                            onClick={() => onChange(item.productId, -1)}
                                            disabled={quantity === 0}
                                            aria-label={`Giảm ${item.productName}`}
                                            className="flex h-full w-9 items-center justify-center border-0 bg-transparent text-zinc-300 hover:bg-white/10 active:scale-[0.96] disabled:cursor-not-allowed disabled:opacity-30"
                                        >
                                            <Minus size={14} />
                                        </button>
                                        <span className="w-7 text-center text-xs font-extrabold text-white">{quantity}</span>
                                        <button
                                            type="button"
                                            onClick={() => onChange(item.productId, 1)}
                                            disabled={outOfStock || quantity >= 10}
                                            aria-label={`Thêm ${item.productName}`}
                                            className="flex h-full w-9 items-center justify-center border-0 bg-[#ff8a00] text-black hover:bg-[#ff9f2b] active:scale-[0.96] disabled:cursor-not-allowed disabled:bg-zinc-800 disabled:text-zinc-600"
                                        >
                                            <Plus size={14} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </article>
                    );
                })}
            </div>
        )}
    </section>
);

const BookingConcessionsSection: React.FC<Props> = ({ menu, quantities, loading, isOpen, onChange, onClose }) => {
    if (!isOpen) return null;

    const products = menu.filter((item) => !item.isCombo);
    const combos = menu.filter((item) => item.isCombo);
    const selectedQuantity = Object.values(quantities).reduce((sum, quantity) => sum + quantity, 0);
    const subtotal = menu.reduce((sum, item) => sum + item.unitPrice * (quantities[item.productId] || 0), 0);

    return (
        <div className="fixed inset-0 z-40 flex items-end bg-black/75 p-0 sm:items-center sm:p-6" role="dialog" aria-modal="true" aria-label="Chọn bắp nước">
            <button type="button" aria-label="Đóng chọn bắp nước" className="absolute inset-0 cursor-default border-0 bg-transparent" onClick={onClose} />
            <section className="relative flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-2xl border border-white/10 bg-zinc-950 shadow-[0_-16px_48px_rgba(0,0,0,0.42)] sm:mx-auto sm:max-w-4xl sm:rounded-2xl">
                <header className="flex items-start justify-between gap-4 border-b border-white/10 px-5 py-4 md:px-6">
                    <div className="flex items-start gap-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[#ff8a00]/25 bg-[#ff8a00]/10 text-[#ff8a00]">
                            <Popcorn size={18} />
                        </span>
                        <div>
                            <h3 className="m-0 text-base font-extrabold text-white md:text-lg">Bắp nước tuỳ chọn</h3>
                            <p className="mt-1 text-xs text-zinc-500">Bạn có thể chọn ngay hoặc bỏ qua để tiếp tục đặt vé.</p>
                        </div>
                    </div>
                    <button type="button" aria-label="Đóng" onClick={onClose} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-zinc-300 hover:bg-white/10 active:scale-[0.96]">
                        <X size={18} />
                    </button>
                </header>

                <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto px-5 py-5 md:px-6">
                    {loading ? (
                        <div className="grid grid-cols-2 gap-3">
                            {[0, 1, 2, 3].map((key) => <div key={key} className="h-44 animate-pulse rounded-xl bg-white/5" />)}
                        </div>
                    ) : menu.length === 0 ? (
                        <div className="rounded-xl border border-dashed border-white/10 px-5 py-10 text-center">
                            <PackageOpen size={28} className="mx-auto mb-3 text-zinc-700" />
                            <p className="m-0 text-sm font-semibold text-zinc-400">Rạp chưa mở bán bắp nước online.</p>
                        </div>
                    ) : (
                        <div className="space-y-8">
                            <ProductGroup title="Sản phẩm lẻ" description="Bắp rang, nước uống và đồ ăn nhẹ" icon={<Popcorn size={17} />} items={products} quantities={quantities} onChange={onChange} />
                            <ProductGroup title="Combo" description="Các gói kết hợp tiện lợi" icon={<Sparkles size={17} />} items={combos} quantities={quantities} onChange={onChange} />
                        </div>
                    )}
                </div>

                <footer className="flex items-center justify-between gap-4 border-t border-white/10 bg-zinc-950 px-5 py-4 md:px-6">
                    <div className="min-w-0">
                        <p className="m-0 text-xs text-zinc-500">{selectedQuantity > 0 ? `Đã chọn ${selectedQuantity} sản phẩm` : 'Chưa chọn bắp nước'}</p>
                        <p className="mt-1 text-base font-extrabold text-[#ff8a00]">{formatMoney(subtotal)}</p>
                    </div>
                    <button type="button" onClick={onClose} className="h-10 shrink-0 rounded-lg border-0 bg-[#ff8a00] px-4 text-sm font-extrabold text-black hover:bg-[#ff9f2b] active:scale-[0.98]">
                        Xong, tiếp tục đặt vé
                    </button>
                </footer>
            </section>
        </div>
    );
};

export default BookingConcessionsSection;