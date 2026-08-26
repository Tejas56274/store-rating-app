import React, { useState } from 'react';

export default function StarRating({ value, onChange, disabled }) {
  const [hover, setHover] = useState(0);

  return (
    <div className="star-rating">
      {[1, 2, 3, 4, 5].map((star) => (
        <span
          key={star}
          className={`star ${(hover || value) >= star ? 'star-filled' : ''}`}
          onClick={() => !disabled && onChange(star)}
          onMouseEnter={() => !disabled && setHover(star)}
          onMouseLeave={() => !disabled && setHover(0)}
        >
          ★
        </span>
      ))}
    </div>
  );
}
