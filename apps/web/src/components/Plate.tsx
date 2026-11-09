import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react';
import { formatPlate } from '@app/shared';

/** The blue IL strip on the left edge of an Israeli plate. */
function PlateStrip({ size }: { size: 'sm' | 'lg' }) {
  return (
    <span
      aria-hidden="true"
      className={`flex shrink-0 flex-col items-center justify-center bg-plate-blue font-bold text-white ${
        size === 'lg' ? 'w-12 text-xs' : 'w-7 text-[9px]'
      }`}
    >
      <span>IL</span>
      {size === 'lg' && <span className="text-[10px] font-normal">ישראל</span>}
    </span>
  );
}

function PlateFrame({ size, children }: { size: 'sm' | 'lg'; children: ReactNode }) {
  return (
    <span
      dir="ltr"
      className={`inline-flex overflow-hidden border-black bg-plate text-black ${
        size === 'lg'
          ? 'w-full max-w-md rounded-xl border-4 shadow-md focus-within:ring-4 focus-within:ring-blue-500'
          : 'rounded-md border-2'
      }`}
    >
      <PlateStrip size={size} />
      {children}
    </span>
  );
}

/** Plate-style dashes for 7/8-digit plates; shorter legacy plates are shown as-is. */
export function displayPlate(plate: string): string {
  return plate.length >= 7 ? formatPlate(plate) : plate;
}

/** Read-only plate display. */
export function PlateBadge({ plate }: { plate: string }) {
  return (
    <PlateFrame size="sm">
      <span className="px-2 py-0.5 font-plate text-lg font-bold tracking-wider">
        {displayPlate(plate)}
      </span>
    </PlateFrame>
  );
}

/** Large yellow-plate text input. Formatting is handled by the parent via `formatPlate`. */
export const PlateInputField = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  function PlateInputField(props, ref) {
    return (
      <PlateFrame size="lg">
        <input
          ref={ref}
          type="text"
          inputMode="numeric"
          autoComplete="off"
          spellCheck={false}
          maxLength={10}
          placeholder="12-345-67"
          className="w-full min-w-0 bg-transparent px-3 py-3 text-center font-plate text-4xl font-bold tracking-widest text-black placeholder:text-black/25 focus:outline-none sm:text-5xl"
          {...props}
        />
      </PlateFrame>
    );
  },
);
