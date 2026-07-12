'use client';

import { useState, useEffect } from 'react';
import { BsStarFill } from 'react-icons/bs';

function getTimeLeft(targetDate) {
  const now = new Date();
  const target = new Date(targetDate);
  const diff = target - now;
  if (diff <= 0) return null;
  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  };
}

export default function CountdownTimer({ date }) {
  const [timeLeft, setTimeLeft] = useState(getTimeLeft(date));

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(getTimeLeft(date));
    }, 1000);
    return () => clearInterval(timer);
  }, [date]);

  if (!timeLeft) {
    return (
      <div className="festival-past-badge">
        <BsStarFill /> Celebrating today!
      </div>
    );
  }

  const units = [
    { value: timeLeft.days, label: 'days' },
    { value: timeLeft.hours, label: 'hrs' },
    { value: timeLeft.minutes, label: 'min' },
    { value: timeLeft.seconds, label: 'sec' },
  ];

  return (
    <div className="countdown-wrap">
      {units.map((u, i) => (
        <div key={u.label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div className="countdown-unit">
            <span className="countdown-num">{String(u.value).padStart(2, '0')}</span>
            <span className="countdown-label">{u.label}</span>
          </div>
          {i < units.length - 1 && <span className="countdown-sep">:</span>}
        </div>
      ))}
    </div>
  );
}
