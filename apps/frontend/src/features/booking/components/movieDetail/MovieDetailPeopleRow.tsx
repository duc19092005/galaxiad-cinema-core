import React, { useRef } from 'react';
import { Link } from 'react-router-dom';
import type { PublicMoviePerson } from '../../../../types/public.types';

export const personAvatar = (name: string, profileUrl?: string | null) =>
  profileUrl?.trim() ||
  `https://ui-avatars.com/api/?name=${encodeURIComponent(name.trim())}&background=1a1a20&color=ffb77f&size=256&bold=true&format=svg`;

export const splitPeopleCsv = (raw?: string | null): PublicMoviePerson[] => {
  if (!raw?.trim()) return [];
  return raw
    .split(/[,;|]/)
    .map((s) => s.trim())
    .filter(Boolean)
    .map((name) => ({ name }));
};

/** Horizontal drag-scroll row with hidden x-scrollbar; click opens person detail */
export const MovieDetailPeopleRow: React.FC<{
  people: PublicMoviePerson[];
  role: 'actor' | 'director';
}> = ({ people, role }) => {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{
    pointerId: number | null;
    startX: number;
    scrollLeft: number;
    moved: boolean;
  }>({ pointerId: null, startX: 0, scrollLeft: 0, moved: false });

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    const el = scrollerRef.current;
    if (!el) return;
    drag.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      scrollLeft: el.scrollLeft,
      moved: false,
    };
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = scrollerRef.current;
    if (!el || drag.current.pointerId !== e.pointerId) return;
    const dx = e.clientX - drag.current.startX;
    if (!drag.current.moved && Math.abs(dx) < 8) return;
    if (!drag.current.moved) {
      drag.current.moved = true;
      el.classList.add('mdp-people-dragging');
      try {
        el.setPointerCapture(e.pointerId);
      } catch {
        /* ignore */
      }
    }
    el.scrollLeft = drag.current.scrollLeft - dx;
    e.preventDefault();
  };

  const endDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = scrollerRef.current;
    if (!el || drag.current.pointerId !== e.pointerId) return;
    const wasDragging = drag.current.moved;
    drag.current.pointerId = null;
    el.classList.remove('mdp-people-dragging');
    try {
      if (el.hasPointerCapture?.(e.pointerId)) el.releasePointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
    if (wasDragging) {
      window.setTimeout(() => {
        drag.current.moved = false;
      }, 0);
    } else {
      drag.current.moved = false;
    }
  };

  if (people.length === 0) return null;

  return (
    <div
      ref={scrollerRef}
      className="mdp-people-scroll flex gap-4 overflow-x-auto pb-1 select-none"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
    >
      {people.map((person) => {
        const href = `/person/${role}?name=${encodeURIComponent(person.name)}`;
        return (
          <Link
            key={`${person.tmdbId ?? ''}-${person.name}`}
            to={href}
            draggable={false}
            className="mdp-surface rounded-xl p-4 flex flex-col items-center text-center group shrink-0 w-[132px] md:w-[148px] transition-colors duration-300 no-underline"
            style={{ cursor: 'pointer' }}
            onClick={(e) => {
              if (drag.current.moved) {
                e.preventDefault();
                e.stopPropagation();
              }
            }}
          >
            <div className="w-20 h-20 md:w-24 md:h-24 rounded-full overflow-hidden mb-3 border-2 border-transparent group-hover:border-[rgba(255,138,0,0.5)] transition-colors duration-300 bg-[var(--bg-base)]">
              <img
                src={personAvatar(person.name, person.profileUrl)}
                alt={person.name}
                className="w-full h-full object-cover pointer-events-none"
                draggable={false}
                loading="lazy"
                onError={(e) => {
                  const img = e.currentTarget;
                  const fallback = personAvatar(person.name);
                  if (img.src !== fallback) img.src = fallback;
                }}
              />
            </div>
            <p className="text-sm font-bold text-[var(--text-primary)] leading-snug group-hover:text-[#ffb77f] transition-colors line-clamp-2">
              {person.name}
            </p>
          </Link>
        );
      })}
    </div>
  );
};
