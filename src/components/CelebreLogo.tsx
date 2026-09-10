import React from 'react';
import officialLogoTransparent from '../assets/images/celebre_official_logo_transparent.png';
import officialLogoImg from '../assets/images/celebre_official_logo.png';

export { officialLogoTransparent, officialLogoImg };

interface CelebreLogoProps {
  variant?: 'full' | 'compact' | 'white' | 'gold' | 'badge' | 'box-stamp' | 'banner';
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

  // Compact version for sticky navbar and mobile menu
  if (variant === 'compact') {
    return (
      <div className={`flex items-center gap-3 select-none ${className}`}>
        {/* Official Logo emblem container */}
        <div className="relative h-11 w-11 sm:h-12 sm:w-12 rounded-2xl bg-gradient-to-br from-[#FAF5EB] via-[#F3E7D3] to-[#E5D2AF] border border-[#C89B3C]/70 shadow-sm p-1 flex items-center justify-center overflow-hidden flex-shrink-0 hover:scale-105 transition-transform">
          <img
            src={officialLogoTransparent}
            alt="Celebre Official Logo"
            className="w-full h-full object-contain filter drop-shadow-xs"
            referrerPolicy="no-referrer"
          />
        </div>

        <div className="flex flex-col text-right leading-none">
          <div className="flex items-center gap-1.5">
            <span
              className="font-['Playfair_Display',serif] text-2xl font-black tracking-tight"
              style={{ color: brandColor }}
            >
              Celebre
            </span>
            <span className="text-[10px] text-[#C89B3C]">✦</span>
          </div>
          <span className="text-[9px] font-bold tracking-wider uppercase text-[#C89B3C] mt-1">
            Catering Packages
          </span>
        </div>
      </div>
    );
  }

  // Box-stamp / badge variant: Luxury seal on packages and floating hero stamps
  if (variant === 'box-stamp' || variant === 'badge') {
    return (
      <div className={`inline-flex flex-col items-center justify-center p-2.5 sm:p-3 rounded-2xl bg-gradient-to-b from-[#FAF7F2] via-[#F4EEDB] to-[#E9D7B3] border-2 border-[#C89B3C] shadow-xl text-center select-none hover:shadow-2xl transition-shadow ${className}`}>
        <div className="w-20 sm:w-24 h-auto">
          <img
            src={officialLogoTransparent}
            alt="شعار سيلبر الرسمي المعتمد"
            className="w-full h-auto object-contain drop-shadow-xs"
            referrerPolicy="no-referrer"
          />
        </div>
        <div className="w-full h-[1px] bg-[#C89B3C]/40 my-1" />
        <span className="text-[8px] sm:text-[9px] font-black text-[#5C1027] tracking-wider uppercase">
          الشعار الرسمي المعتمد
        </span>
      </div>
    );
  }

  // Banner variant: Horizontal / standalone presentation
  if (variant === 'banner') {
    return (
      <div className={`flex flex-col items-center justify-center p-3 select-none ${className}`}>
        <div className="w-48 sm:w-60 max-w-full">
          <img
            src={officialLogoTransparent}
            alt="شعار سيلبر الرسمي"
            className="w-full h-auto object-contain filter drop-shadow-sm"
            referrerPolicy="no-referrer"
          />
        </div>
      </div>
    );
  }

  // Dark background / footer variant (white / dark gold)
  if (variant === 'white') {
    return (
      <div className={`flex flex-col items-center sm:items-start text-center sm:text-right select-none ${className}`}>
        <div className="w-52 sm:w-64 p-3 rounded-2xl bg-gradient-to-b from-[#4A0A1D]/80 to-[#2A0611]/60 border border-[#C89B3C]/40 shadow-inner">
          <img
            src={officialLogoTransparent}
            alt="Celebre Official Catering Logo"
            className="w-full h-auto object-contain filter drop-shadow-[0_4px_16px_rgba(212,175,55,0.45)]"
            referrerPolicy="no-referrer"
          />
        </div>
        <p className="text-xs text-[#D1BFA8] max-w-xs mt-3 leading-relaxed">
          البراند الرائد في تجهيز عبوات كاترنج المناسبات الملكية، كتب الكتاب، والأفراح بأعلى درجات الفخامة والأناقة في بني سويف.
        </p>
      </div>
    );
  }

  // Full High-Fidelity Official Logo Representation
  return (
    <div className={`flex flex-col items-center text-center select-none ${className}`}>
      {/* Official Master Logo Image */}
      <div className="w-56 sm:w-64 max-w-full">
        <img
          src={officialLogoTransparent}
          alt="Celebre Official Logo"
          className="w-full h-auto object-contain filter drop-shadow-md"
          referrerPolicy="no-referrer"
        />
      </div>

      {/* Phone Contact Bar matching logo (01284484868) */}
      {showPhone && (
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

          <div className="mt-1 text-[10px] text-[#C89B3C]">
            ♥
          </div>
        </div>
      )}
    </div>
  );
};
