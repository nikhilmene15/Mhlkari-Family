'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { BsArrowLeft, BsArrowRight, BsStarFill } from 'react-icons/bs';

export default function CardSlider({ items }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [itemsPerView, setItemsPerView] = useState(3);
  const sliderRef = useRef(null);
  const totalSlides = Math.ceil(items.length / itemsPerView);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 640) setItemsPerView(1);
      else if (window.innerWidth < 1024) setItemsPerView(2);
      else setItemsPerView(3);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    setCurrentIndex(0);
  }, [itemsPerView]);

  const goToSlide = (index) => {
    if (index < 0) index = totalSlides - 1;
    if (index >= totalSlides) index = 0;
    setCurrentIndex(index);
  };

  const getVisibleItems = () => {
    const start = currentIndex * itemsPerView;
    return items.slice(start, start + itemsPerView);
  };

  return (
    <div className="card-slider">
      {/* Navigation Arrows */}
      <button
        className="slider-arrow slider-arrow-left"
        onClick={() => goToSlide(currentIndex - 1)}
        aria-label="Previous"
      >
        <BsArrowLeft />
      </button>

      {/* Cards Container */}
      <div className="slider-container" ref={sliderRef}>
        <div
          className="slider-track"
          style={{
            transform: `translateX(-${currentIndex * (100 / itemsPerView)}%)`,
            transition: 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        >
          {items.map((item, index) => (
            <div
              key={index}
              className="slider-slide"
              style={{ flex: `0 0 ${100 / itemsPerView}%` }}
            >
              <Link href={item.href} className="testimonial-card">
                {/* Stars */}
                <div className="card-stars">
                  {[...Array(5)].map((_, i) => (
                    <BsStarFill key={i} className="star-icon" />
                  ))}
                </div>

                {/* Icon */}
                <div className="card-icon-wrapper" style={{ background: item.gradient }}>
                  <span className="card-emoji" style={{ color: 'white' }}>{item.icon}</span>
                </div>

                {/* Content */}
                <h3 className="card-heading">{item.title}</h3>
                <p className="card-body">{item.desc}</p>

                {/* Footer */}
                <div className="card-footer-row">
                  <span className="card-cta">
                    Explore <BsArrowRight />
                  </span>
                </div>
              </Link>
            </div>
          ))}
        </div>
      </div>

      {/* Navigation Arrows */}
      <button
        className="slider-arrow slider-arrow-right"
        onClick={() => goToSlide(currentIndex + 1)}
        aria-label="Next"
      >
        <BsArrowRight />
      </button>

      {/* Dot Indicators */}
      <div className="slider-dots">
        {[...Array(totalSlides)].map((_, i) => (
          <button
            key={i}
            className={`slider-dot${i === currentIndex ? ' active' : ''}`}
            onClick={() => goToSlide(i)}
            aria-label={`Go to slide ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
