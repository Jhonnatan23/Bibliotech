import React, { useState } from 'react';
import { StarIcon, StarIconFilled } from '../../../components/Icons';

export interface RatingStarsProps {
  /**
   * Rating value on a 0.0 to 5.0 scale.
   */
  rating: number;
  /**
   * Maximum number of stars. Defaults strictly to 5.
   */
  maxStars?: number;
  /**
   * Read-only mode disables click/hover interactions.
   * If not provided, defaults to false if onChange is provided, true otherwise.
   */
  readOnly?: boolean;
  /**
   * Callback fired when a rating is selected.
   */
  onChange?: (newRating: number) => void;
  /**
   * Visual size variant of the stars.
   */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  /**
   * Precision step when clicking/hovering: 0.1, 0.5, or 1.0 (default: 0.5).
   */
  precision?: 0.1 | 0.5 | 1.0;
  /**
   * Whether to display the numeric label formatted as `X.X / 5.0`.
   */
  showLabel?: boolean;
  /**
   * Optional custom label text or formatter.
   */
  formatLabel?: (rating: number, max: number) => string;
  /**
   * Additional wrapper class names.
   */
  className?: string;
  /**
   * Additional class names for each star element.
   */
  starClassName?: string;
  /**
   * Additional class names for the numeric label.
   */
  labelClassName?: string;
  /**
   * Accessible label.
   */
  'aria-label'?: string;
  id?: string;
}

const SIZE_MAP = {
  xs: { star: 'w-3 h-3', text: 'text-[10px]' },
  sm: { star: 'w-4 h-4', text: 'text-xs' },
  md: { star: 'w-5 h-5', text: 'text-sm' },
  lg: { star: 'w-7 h-7', text: 'text-base' },
  xl: { star: 'w-9 h-9', text: 'text-lg' },
};

/**
 * Standard 5-star rating component supporting precision float/half-star values,
 * smooth hover previews, and consistent `X.X / 5.0` scale.
 */
export const RatingStars: React.FC<RatingStarsProps> = ({
  rating = 0,
  maxStars = 5,
  readOnly: explicitReadOnly,
  onChange,
  size = 'md',
  precision = 0.5,
  showLabel = false,
  formatLabel,
  className = '',
  starClassName = '',
  labelClassName = '',
  'aria-label': ariaLabel,
  id,
}) => {
  const isReadOnly = explicitReadOnly !== undefined ? explicitReadOnly : !onChange;
  const [hoverRating, setHoverRating] = useState<number | null>(null);

  // Safe clamped values strictly within 0.0 to 5.0
  const normalizedRating = Math.max(0, Math.min(maxStars, Number(rating) || 0));
  const activeRating = hoverRating !== null ? hoverRating : normalizedRating;
  const currentSize = SIZE_MAP[size] || SIZE_MAP.md;

  const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement | HTMLDivElement>, index: number) => {
    if (isReadOnly || !onChange) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const width = rect.width || 1;

    let computedVal: number;
    if (precision === 0.1) {
      const fraction = Math.max(0.1, Math.min(1.0, x / width));
      computedVal = parseFloat((index + fraction).toFixed(1));
    } else if (precision === 1.0) {
      computedVal = index + 1;
    } else {
      // 0.5 half-star precision
      const isLeftHalf = x < width / 2;
      computedVal = index + (isLeftHalf ? 0.5 : 1.0);
    }

    setHoverRating(Math.max(0.5, Math.min(maxStars, computedVal)));
  };

  const handleClick = (e: React.MouseEvent<HTMLButtonElement | HTMLDivElement>, index: number) => {
    if (isReadOnly || !onChange) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const width = rect.width || 1;

    let computedVal: number;
    if (precision === 0.1) {
      const fraction = Math.max(0.1, Math.min(1.0, x / width));
      computedVal = parseFloat((index + fraction).toFixed(1));
    } else if (precision === 1.0) {
      computedVal = index + 1;
    } else {
      const isLeftHalf = x < width / 2;
      computedVal = index + (isLeftHalf ? 0.5 : 1.0);
    }

    const finalVal = Math.max(0, Math.min(maxStars, computedVal));
    onChange(finalVal);
    setHoverRating(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (isReadOnly || !onChange) return;
    const step = precision === 0.1 ? 0.1 : 0.5;

    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
      e.preventDefault();
      const next = Math.min(maxStars, parseFloat((normalizedRating + step).toFixed(1)));
      onChange(next);
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
      e.preventDefault();
      const prev = Math.max(0, parseFloat((normalizedRating - step).toFixed(1)));
      onChange(prev);
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onChange(index + 1);
    }
  };

  const formattedLabelText = formatLabel
    ? formatLabel(activeRating, maxStars)
    : `${activeRating.toFixed(1)} / ${maxStars.toFixed(1)}`;

  return (
    <div
      id={id}
      className={`inline-flex items-center gap-2 select-none ${className}`}
      onMouseLeave={() => !isReadOnly && setHoverRating(null)}
      role={isReadOnly ? 'img' : 'radiogroup'}
      aria-label={ariaLabel || `Avaliação: ${activeRating.toFixed(1)} de ${maxStars} estrelas`}
    >
      <div className="flex items-center gap-1">
        {Array.from({ length: maxStars }).map((_, index) => {
          const starNumber = index + 1;
          const diff = activeRating - index;
          const fillPercentage = Math.max(0, Math.min(100, Math.round(diff * 100)));

          const starContent = (
            <>
              {/* Star Background (Unfilled) */}
              <StarIcon
                className={`${currentSize.star} text-slate-200 dark:text-slate-700 transition-colors duration-150 pointer-events-none`}
              />

              {/* Star Foreground (Filled with amber-500 and percentage clip for partial/half fills) */}
              {fillPercentage > 0 && (
                <div
                  className="absolute inset-0 overflow-hidden pointer-events-none p-0.5"
                  style={{ width: `${fillPercentage}%` }}
                  data-testid={`star-fill-${index + 1}`}
                >
                  <StarIconFilled
                    className={`${currentSize.star} text-amber-500 fill-amber-500 drop-shadow-sm transition-colors duration-150`}
                  />
                </div>
              )}
            </>
          );

          if (isReadOnly) {
            return (
              <div
                key={index}
                data-testid={`star-${index + 1}`}
                className={`relative inline-flex items-center justify-center p-0.5 rounded ${starClassName}`}
              >
                {starContent}
              </div>
            );
          }

          return (
            <button
              key={index}
              type="button"
              data-testid={`star-${index + 1}`}
              onClick={(e) => handleClick(e, index)}
              onMouseMove={(e) => handleMouseMove(e, index)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              aria-label={`${starNumber} de ${maxStars} estrelas`}
              tabIndex={0}
              className={`relative inline-flex items-center justify-center p-0.5 rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 transition-transform duration-150 cursor-pointer hover:scale-115 active:scale-95 ${starClassName}`}
            >
              {starContent}
            </button>
          );
        })}
      </div>

      {showLabel && (
        <span
          data-testid="rating-label"
          className={`font-black text-amber-600 dark:text-amber-400 tracking-tight font-mono ${currentSize.text} ${labelClassName}`}
        >
          {formattedLabelText}
        </span>
      )}
    </div>
  );
};

export default RatingStars;
