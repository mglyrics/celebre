import React from 'react';

interface CelebreLogoProps {
  variant?: 'full' | 'compact' | 'white' | 'gold' | 'badge' | 'box-stamp';
  className?: string;
  showPhone?: boolean;
}

export const CelebreLogo: React.FC<CelebreLogoProps> = ({
  variant = 'full',
  className = '',
  showPhone = false,
}) => {
  const isWhite = variant === 'white';
  const isGold = variant === 'gold';

  const brandColor = isWhite ? '#FFFFFF' : isGold ? '#D4AF37' : '#5C1027';
  const goldStroke = isWhite ? '#F3D48B' : '#C89B3C';
  const darkGold = isWhite ? '#E5C06E' : '#8A5D15';
  const subtextColor = isWhite ? '#E5E0D8' : '#6A4A1C';

  // Compact version for sticky navbar
  if (variant === 'compact') {
    return (
      <div className={`flex items-center gap-3 ${className}`}>
        {/* Emblem circle */}
        <div className="relative w-11 h-11 flex-shrink-0 flex items-center justify-center rounded-2xl bg-gradient-to-br from-[#FAF5EB] via-[#F3E7D3] to-[#E5D2AF] border border-[#C89B3C]/60 shadow-sm p-1">
          <svg viewBox="0 0 160 140" className="w-full h-full">
            <defs>
              <linearGradient id="clocheGoldCompact" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FFF2D6" />
                <stop offset="35%" stopColor="#E0B64D" />
                <stop offset="70%" stopColor="#C4932D" />
                <stop offset="100%" stopColor="#8A5D15" />
              </linearGradient>
              <linearGradient id="bowRedCompact" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#8B1D38" />
                <stop offset="60%" stopColor="#5C1027" />
                <stop offset="100%" stopColor="#380816" />
              </linearGradient>
            </defs>

            {/* Cloche Heart Handle */}
            <path
              d="M 80 18 C 73 8, 62 16, 80 28 C 98 16, 87 8, 80 18 Z"
              fill="none"
              stroke="url(#clocheGoldCompact)"
              strokeWidth="4"
            />
            {/* Cloche Dome */}
            <path
              d="M 36 76 C 36 34, 124 34, 124 76 Z"
              fill="url(#clocheGoldCompact)"
              stroke="#7A5010"
              strokeWidth="2"
            />
            {/* Cloche Filigree Crest */}
            <path
              d="M 80 44 C 76 50, 70 50, 70 54 C 70 58, 80 60, 80 60 C 80 60, 90 58, 90 54 C 90 50, 84 50, 80 44 Z"
              fill="none"
              stroke="#FAF7F2"
              strokeWidth="2"
            />
            {/* Cloche Rim */}
            <rect x="28" y="74" width="104" height="9" rx="4.5" fill="url(#clocheGoldCompact)" stroke="#7A5010" strokeWidth="1.5" />
            {/* Cloche Legs */}
            <path d="M 44 83 C 40 92, 34 98, 38 102" fill="none" stroke="url(#clocheGoldCompact)" strokeWidth="4" strokeLinecap="round" />
            <path d="M 116 83 C 120 92, 126 98, 122 102" fill="none" stroke="url(#clocheGoldCompact)" strokeWidth="4" strokeLinecap="round" />

            {/* Burgundy Bow in the center */}
            <g transform="translate(0, 10)">
              <path
                d="M 80 72 C 65 60, 48 64, 52 74 C 56 82, 70 78, 80 75 C 90 78, 104 82, 108 74 C 112 64, 95 60, 80 72 Z"
                fill="url(#bowRedCompact)"
                stroke="#D4AF37"
                strokeWidth="2"
              />
              {/* Bow Tails */}
              <path d="M 72 76 L 60 94 L 74 88 L 78 77 Z" fill="url(#bowRedCompact)" stroke="#D4AF37" strokeWidth="1" />
              <path d="M 88 76 L 100 94 L 86 88 L 82 77 Z" fill="url(#bowRedCompact)" stroke="#D4AF37" strokeWidth="1" />
              {/* Bow Knot */}
              <circle cx="80" cy="74" r="6" fill="#8B1D38" stroke="#FFDF9E" strokeWidth="2" />
            </g>
          </svg>
        </div>

        <div className="flex flex-col text-right">
          <div className="flex items-center gap-1.5">
            <span
              className="font-['Playfair_Display',serif] text-2xl font-black tracking-tight leading-none"
              style={{ color: brandColor }}
            >
              Celebre
            </span>
            <span className="text-[10px] text-[#C89B3C]">✦</span>
          </div>
          <span className="text-[9px] font-bold tracking-wider uppercase text-[#C89B3C] leading-tight">
            Catering Packages
          </span>
        </div>
      </div>
    );
  }

  // Box-stamp variant: Luxury Gold & Maroon seal directly on package boxes
  if (variant === 'box-stamp' || variant === 'badge') {
    return (
      <div className={`inline-flex flex-col items-center justify-center p-3 rounded-2xl bg-gradient-to-b from-[#FAF7F2] via-[#F4EEDB] to-[#E9D7B3] border-2 border-[#C89B3C] shadow-lg text-center ${className}`}>
        <div className="w-16 h-14">
          <svg viewBox="0 0 160 140" className="w-full h-full drop-shadow-xs">
            <defs>
              <linearGradient id="stampGold" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FFF2D6" />
                <stop offset="40%" stopColor="#D4AF37" />
                <stop offset="100%" stopColor="#8A5D15" />
              </linearGradient>
              <linearGradient id="stampBow" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#8B1D38" />
                <stop offset="60%" stopColor="#5C1027" />
                <stop offset="100%" stopColor="#380816" />
              </linearGradient>
            </defs>

            {/* Arch */}
            <path
              d="M 24 100 C 24 30, 136 30, 136 100"
              fill="none"
              stroke="url(#stampGold)"
              strokeWidth="3"
            />
            {/* Cloche */}
            <path
              d="M 80 18 C 73 8, 62 16, 80 28 C 98 16, 87 8, 80 18 Z"
              fill="none"
              stroke="url(#stampGold)"
              strokeWidth="3.5"
            />
            <path
              d="M 38 74 C 38 36, 122 36, 122 74 Z"
              fill="url(#stampGold)"
              stroke="#7A5010"
              strokeWidth="2"
            />
            <rect x="32" y="72" width="96" height="8" rx="4" fill="url(#stampGold)" stroke="#7A5010" strokeWidth="1.5" />
            <path d="M 46 80 C 42 90, 36 96, 40 100" fill="none" stroke="url(#stampGold)" strokeWidth="3.5" strokeLinecap="round" />
            <path d="M 114 80 C 118 90, 124 96, 120 100" fill="none" stroke="url(#stampGold)" strokeWidth="3.5" strokeLinecap="round" />

            {/* Bow */}
            <g transform="translate(0, 10)">
              <path
                d="M 80 72 C 65 60, 48 64, 52 74 C 56 82, 70 78, 80 75 C 90 78, 104 82, 108 74 C 112 64, 95 60, 80 72 Z"
                fill="url(#stampBow)"
                stroke="#D4AF37"
                strokeWidth="1.5"
              />
              <path d="M 72 76 L 60 94 L 74 88 L 78 77 Z" fill="url(#stampBow)" stroke="#D4AF37" strokeWidth="1" />
              <path d="M 88 76 L 100 94 L 86 88 L 82 77 Z" fill="url(#stampBow)" stroke="#D4AF37" strokeWidth="1" />
              <circle cx="80" cy="74" r="5" fill="#8B1D38" stroke="#FFDF9E" strokeWidth="1.5" />
            </g>
          </svg>
        </div>

        <span className="font-['Playfair_Display',serif] text-base font-black text-[#5C1027] tracking-tight leading-none mt-1">
          Celebre
        </span>
        <span className="text-[8px] font-bold text-[#8C5E13] tracking-wider uppercase mt-0.5">
          Catering Packages
        </span>
      </div>
    );
  }

  // Full High-Fidelity Representation matching the official attached logo
  return (
    <div className={`flex flex-col items-center text-center select-none ${className}`}>
      
      {/* SVG Emblem Header */}
      <div className="relative w-44 sm:w-52 md:w-56 h-auto aspect-[160/130]">
        <svg viewBox="0 0 200 170" className="w-full h-full drop-shadow-md">
          <defs>
            {/* Metallic Gold Gradient */}
            <linearGradient id="goldMetallic" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FFF4D9" />
              <stop offset="25%" stopColor="#E6BE58" />
              <stop offset="50%" stopColor="#D4AF37" />
              <stop offset="75%" stopColor="#B38622" />
              <stop offset="100%" stopColor="#7E5510" />
            </linearGradient>

            {/* Deep Burgundy Velvet Ribbon Gradient */}
            <linearGradient id="burgundyVelvetFull" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#8A1835" />
              <stop offset="50%" stopColor="#5C1027" />
              <stop offset="100%" stopColor="#320713" />
            </linearGradient>

            {/* Fine Gold Stroke */}
            <linearGradient id="goldLine" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#B38622" />
              <stop offset="50%" stopColor="#FFE194" />
              <stop offset="100%" stopColor="#B38622" />
            </linearGradient>
          </defs>

          {/* 1. Golden Circular Arch Frame with floating hearts & sparkles */}
          <path
            d="M 28 128 C 28 42, 172 42, 172 128"
            fill="none"
            stroke="url(#goldMetallic)"
            strokeWidth="3.2"
            strokeLinecap="round"
          />
          <path
            d="M 35 125 C 35 48, 165 48, 165 125"
            fill="none"
            stroke="url(#goldMetallic)"
            strokeWidth="1.2"
            strokeDasharray="3 3"
            opacity="0.7"
          />

          {/* Floating Sparkles and Little Hearts */}
          {/* Top Left Sparkle */}
          <path d="M 68 36 L 70 30 L 72 36 L 78 38 L 72 40 L 70 46 L 68 40 L 62 38 Z" fill="url(#goldMetallic)" />
          {/* Top Right Dot & Heart */}
          <circle cx="138" cy="34" r="2.5" fill="url(#goldMetallic)" />
          
          {/* Right Floating Outline Heart */}
          <path
            d="M 152 48 C 148 42, 140 44, 140 50 C 140 56, 152 64, 152 64 C 152 64, 164 56, 164 50 C 164 44, 156 42, 152 48 Z"
            fill="none"
            stroke="#5C1027"
            strokeWidth="2"
          />

          {/* Left: Two Toasting Champagne Glasses in Gold */}
          <g transform="translate(18, 42)">
            {/* Left Flute */}
            <path
              d="M 12 12 L 18 28 C 18 34, 14 36, 14 42 L 20 42 C 20 36, 16 34, 16 28 L 22 12 Z"
              fill="none"
              stroke="url(#goldMetallic)"
              strokeWidth="2"
            />
            {/* Right Flute (Tilted to toast) */}
            <path
              d="M 28 14 L 28 30 C 27 35, 23 37, 22 42 L 28 42 C 29 37, 33 35, 34 30 L 38 16 Z"
              fill="none"
              stroke="url(#goldMetallic)"
              strokeWidth="2"
            />
            {/* Cheers Sparkle */}
            <polygon points="24,6 26,10 30,12 26,14 24,18 22,14 18,12 22,10" fill="url(#goldMetallic)" />
          </g>

          {/* Right: Sparkling Diamond Engagement Ring in Gold */}
          <g transform="translate(144, 68)">
            {/* Ring Circle */}
            <ellipse cx="14" cy="18" rx="10" ry="8" fill="none" stroke="url(#goldMetallic)" strokeWidth="2.5" />
            {/* Diamond Gem */}
            <polygon points="14,4 19,8 17,12 11,12 9,8" fill="none" stroke="url(#goldMetallic)" strokeWidth="2" />
            <line x1="11" y1="8" x2="17" y2="8" stroke="url(#goldMetallic)" strokeWidth="1.5" />
            {/* Sparkle on Diamond */}
            <circle cx="21" cy="4" r="1.5" fill="url(#goldMetallic)" />
          </g>

          {/* 2. Central Golden Catering Cloche (Dome & Legs) */}
          {/* Heart Cloche Handle at top */}
          <path
            d="M 100 24 C 92 10, 78 20, 100 36 C 122 20, 108 10, 100 24 Z"
            fill="none"
            stroke="url(#goldMetallic)"
            strokeWidth="4.5"
            strokeLinejoin="round"
          />

          {/* Golden Serving Cloche Dome */}
          <path
            d="M 44 94 C 44 44, 156 44, 156 94 Z"
            fill="url(#goldMetallic)"
            stroke="#6E440B"
            strokeWidth="2"
          />

          {/* Baroque Filigree Crest on Dome */}
          <g transform="translate(100, 62)">
            <path
              d="M 0 -10 C -6 -2, -14 -2, -14 4 C -14 10, 0 14, 0 14 C 0 14, 14 10, 14 4 C 14 -2, 6 -2, 0 -10 Z"
              fill="none"
              stroke="#FFF2D6"
              strokeWidth="2"
            />
            <circle cx="0" cy="0" r="2.5" fill="#FFF2D6" />
          </g>

          {/* Cloche Platter Rim */}
          <rect x="36" y="92" width="128" height="10" rx="5" fill="url(#goldMetallic)" stroke="#6E440B" strokeWidth="2" />

          {/* Cloche Base Tray Under-Rim */}
          <rect x="50" y="102" width="100" height="5" rx="2.5" fill="#A8791C" />

          {/* Cloche Ornate Pedestal Legs */}
          <path
            d="M 54 104 C 48 116, 40 124, 46 128 C 50 130, 56 122, 58 116"
            fill="url(#goldMetallic)"
            stroke="#6E440B"
            strokeWidth="1.5"
          />
          <path
            d="M 146 104 C 152 116, 160 124, 154 128 C 150 130, 144 122, 142 116"
            fill="url(#goldMetallic)"
            stroke="#6E440B"
            strokeWidth="1.5"
          />

          {/* 3. Luxurious Burgundy Velvet Bow Tie pinned at center */}
          <g transform="translate(0, 8)">
            {/* Left Bow Loop */}
            <path
              d="M 100 92 C 80 76, 58 80, 62 94 C 66 106, 88 100, 100 96 Z"
              fill="url(#burgundyVelvetFull)"
              stroke="url(#goldMetallic)"
              strokeWidth="2.5"
            />
            {/* Right Bow Loop */}
            <path
              d="M 100 92 C 120 76, 142 80, 138 94 C 134 106, 112 100, 100 96 Z"
              fill="url(#burgundyVelvetFull)"
              stroke="url(#goldMetallic)"
              strokeWidth="2.5"
            />
            {/* Bow Hanging Tails */}
            <path
              d="M 88 97 L 70 122 L 88 114 L 95 98 Z"
              fill="url(#burgundyVelvetFull)"
              stroke="url(#goldMetallic)"
              strokeWidth="1.5"
            />
            <path
              d="M 112 97 L 130 122 L 112 114 L 105 98 Z"
              fill="url(#burgundyVelvetFull)"
              stroke="url(#goldMetallic)"
              strokeWidth="1.5"
            />
            {/* Central Knot */}
            <ellipse
              cx="100"
              cy="95"
              rx="9"
              ry="8"
              fill="#8A1835"
              stroke="url(#goldMetallic)"
              strokeWidth="2.5"
            />
          </g>

          {/* Tiny gold heart below bow */}
          <path
            d="M 166 100 C 164 96, 158 98, 158 102 C 158 106, 166 112, 166 112 C 166 112, 174 106, 174 102 C 174 98, 168 96, 166 100 Z"
            fill="url(#goldMetallic)"
          />
        </svg>
      </div>

      {/* 4. Brand Name Typography "Celebre" with custom underline swash */}
      <div className="relative mt-[-4px]">
        <div className="flex items-center justify-center">
          <span
            className="font-['Playfair_Display',serif] text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight"
            style={{
              color: brandColor,
              fontFamily: "'Playfair Display', Georgia, serif",
              textShadow: isWhite ? '0 2px 10px rgba(0,0,0,0.5)' : 'none'
            }}
          >
            Celebre
          </span>
        </div>

        {/* Elegant Swash Underline */}
        <div className="w-48 sm:w-60 mx-auto mt-[-4px]">
          <svg viewBox="0 0 240 30" className="w-full h-auto">
            {/* Main Long Flourish Swash Curve */}
            <path
              d="M 20 6 C 60 22, 180 22, 225 6 C 210 14, 150 18, 120 18 C 80 18, 40 14, 20 6 Z"
              fill={brandColor}
            />
            {/* Gold Accents on the swash */}
            <path
              d="M 18 5 C 24 1, 28 8, 22 14 C 16 12, 14 7, 18 5 Z"
              fill={goldStroke}
            />
            <path
              d="M 226 5 C 232 9, 228 14, 222 12 C 220 7, 223 2, 226 5 Z"
              fill={goldStroke}
            />
          </svg>
        </div>
      </div>

      {/* 5. Golden Filigree Divider with Heart */}
      <div className="w-44 sm:w-56 mx-auto my-1.5 flex items-center justify-center gap-2">
        <div className="h-[1.5px] flex-1 bg-gradient-to-r from-transparent via-[#C89B3C] to-[#8A5D15]" />
        
        {/* Central Heart & Scrolls */}
        <div className="flex items-center gap-1 text-[#C89B3C]">
          <span className="text-[12px] leading-none">❧</span>
          <span className="text-[14px] leading-none text-[#5C1027] font-bold">♥</span>
          <span className="text-[12px] leading-none transform scale-x-[-1]">❧</span>
        </div>

        <div className="h-[1.5px] flex-1 bg-gradient-to-l from-transparent via-[#C89B3C] to-[#8A5D15]" />
      </div>

      {/* 6. Tagline Lines */}
      <div className="flex flex-col items-center space-y-0.5">
        {/* — CATERING PACKAGES — */}
        <div className="flex items-center justify-center gap-2">
          <span className="text-[#C89B3C] font-semibold text-xs">—</span>
          <span
            className="text-xs sm:text-sm font-extrabold tracking-[0.25em] uppercase font-['Playfair_Display',serif]"
            style={{ color: isWhite ? '#FFDF9E' : '#5C1027' }}
          >
            CATERING PACKAGES
          </span>
          <span className="text-[#C89B3C] font-semibold text-xs">—</span>
        </div>

        {/* ♥ FOR WEDDINGS & SPECIAL OCCASIONS ♥ */}
        <div className="flex items-center justify-center gap-1.5 text-[9px] sm:text-[10px] font-bold tracking-[0.15em] uppercase">
          <span className="text-[#C89B3C]">♥</span>
          <span style={{ color: subtextColor }}>
            FOR WEDDINGS & SPECIAL OCCASIONS
          </span>
          <span className="text-[#C89B3C]">♥</span>
        </div>
      </div>

      {/* 7. Phone Contact Bar matching logo (01284484868) */}
      <div className="mt-3 flex flex-col items-center">
        <div className="h-[1px] w-36 bg-[#C89B3C]/50 mb-2 flex items-center justify-center">
          <span className="bg-[#FAF7F2] px-1 text-[8px] text-[#C89B3C]">❖</span>
        </div>

        <a
          href="tel:01284484868"
          className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-gradient-to-r from-[#FAF3E5] to-[#F5EAD4] border border-[#C89B3C] shadow-xs text-[#5C1027] hover:scale-105 transition-transform group"
          title="اتصل برقم سيلبر المباشر"
        >
          {/* Circular Phone Icon with Gold Ring */}
          <div className="w-6 h-6 rounded-full border border-[#C89B3C] flex items-center justify-center bg-[#5C1027] text-[#FFDF9E]">
            <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
              <path d="M6.62 10.79a15.053 15.053 0 006.59 6.59l2.2-2.2a1 1 0 011.02-.24c1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20a1 1 0 01-1 1A17 17 0 013 4a1 1 0 011-1h3.5a1 1 0 011 1c0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" />
            </svg>
          </div>

          <div className="h-4 w-[1px] bg-[#C89B3C]" />

          <span className="font-bold text-sm sm:text-base tracking-widest font-mono text-[#5C1027] group-hover:underline" dir="ltr">
            01284484868
          </span>
        </a>

        {/* Bottom tiny heart */}
        <div className="mt-1 text-[10px] text-[#C89B3C]">
          ♥
        </div>
      </div>

    </div>
  );
};

