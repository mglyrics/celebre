import React from "react";
import logoImg from "../assets/images/celebre_official_logo_transparent.png";
import logoWhiteImg from "../assets/images/celebre_official_logo.png";

interface CelebreLogoProps {
  className?: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl" | "hero";
  showSlogan?: boolean;
  showEnglishSubtitles?: boolean;
  sloganText?: string;
  variant?: "transparent" | "white_card" | "dark_mode";
  onClick?: () => void;
}

export const CelebreLogo: React.FC<CelebreLogoProps> = ({
  className = "",
  size = "md",
  showSlogan = false,
  showEnglishSubtitles = false,
  sloganText = "سيلبر شريك مؤسس لمناساباتك السعيدة",
  variant = "transparent",
  onClick
}) => {
  // Dimension presets respecting the original logo aspect ratio (~708x598)
  const sizeMap = {
    xs: "h-9 sm:h-10 w-auto max-w-[110px]",
    sm: "h-11 sm:h-13 w-auto max-w-[140px]",
    md: "h-15 sm:h-17 w-auto max-w-[180px]",
    lg: "h-20 sm:h-24 w-auto max-w-[240px]",
    xl: "h-28 sm:h-34 w-auto max-w-[320px]",
    hero: "h-36 sm:h-44 md:h-50 w-auto max-w-[400px]"
  };

  const imageSrc = variant === "white_card" ? logoWhiteImg : logoImg;

  return (
    <div
      onClick={onClick}
      className={`flex flex-col items-center select-none ${onClick ? "cursor-pointer group" : ""} ${className}`}
    >
      {/* Official Emblem Image Container with golden ambient glow */}
      <div className="relative flex items-center justify-center">
        {/* Subtle ambient golden backglow for hero & large variants */}
        {(size === "hero" || size === "xl" || size === "lg") && (
          <div className="absolute inset-0 bg-gradient-to-r from-[#D4AF37]/20 via-[#F3CD67]/30 to-[#D4AF37]/20 rounded-full blur-2xl pointer-events-none scale-95 animate-pulse-subtle" />
        )}

        <img
          src={imageSrc}
          alt="سيلبر شريك مؤسس لمناساباتك السعيدة - Celebre Catering Packages for Weddings & Special Occasions"
          className={`${sizeMap[size]} object-contain filter drop-shadow-md transition-transform duration-300 ${
            onClick ? "group-hover:scale-105" : ""
          }`}
          loading="eager"
          referrerPolicy="no-referrer"
        />
      </div>

      {/* English subtitles from the logo typography (if explicitly requested to accompany the emblem) */}
      {showEnglishSubtitles && (
        <div className="mt-1 flex flex-col items-center text-center">
          <span className="font-['Cinzel',serif] tracking-[0.25em] text-[#C89B3C] font-bold text-[10px] sm:text-xs uppercase drop-shadow-2xs">
            CATERING PACKAGES
          </span>
          <span className="font-['Cinzel',serif] tracking-[0.2em] text-[#8C6D28] font-semibold text-[8px] sm:text-[9px] uppercase mt-0.5">
            FOR WEDDINGS & SPECIAL OCCASIONS
          </span>
        </div>
      )}

      {/* Official Arabic Partnership Slogan */}
      {showSlogan && (
        <div className="mt-1.5 flex flex-col items-center text-center">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-[#5C1027]/10 via-[#F4EEDB] to-[#5C1027]/10 border border-[#C89B3C]/40 shadow-2xs">
            <span className="text-[#C89B3C] text-xs">✨</span>
            <span className="text-[#5C1027] font-black text-xs sm:text-sm tracking-wide font-['Alexandria',sans-serif]">
              {sloganText}
            </span>
            <span className="text-[#C89B3C] text-xs">✨</span>
          </div>
          <span className="text-[10px] text-[#7A6E65] font-semibold mt-1">
            كتب الكتاب • حفلات الزفاف • الخطوبات • بني سويف ومصر
          </span>
        </div>
      )}
    </div>
  );
};

// Reusable SVG Cloche Emblem matching the exact cloche drawing on the top of the logo
export const CelebreClocheIcon: React.FC<{ className?: string; size?: number }> = ({
  className = "w-5 h-5 text-[#C89B3C]",
  size = 20
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 48 48"
    fill="currentColor"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Cloche ring finial */}
    <circle cx="24" cy="7" r="3.5" fill="none" stroke="currentColor" strokeWidth="2.5" />
    <circle cx="24" cy="11.5" r="1.5" fill="currentColor" />
    {/* Cloche dome */}
    <path
      d="M7 32C7 21 14.5 13.5 24 13.5C33.5 13.5 41 21 41 32H7Z"
      fill="currentColor"
      fillOpacity="0.25"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinejoin="round"
    />
    {/* Arched dome rib lines */}
    <path
      d="M14 32C15 23 18.5 17 24 14"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
    />
    <path
      d="M34 32C33 23 29.5 17 24 14"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
    />
    {/* Cloche base rim with double lip */}
    <rect x="4" y="32" width="40" height="3" rx="1.5" fill="currentColor" />
    <path d="M9 36H39" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

// Reusable 4-pointed golden sparkle star matching the stars in the logo
export const CelebreStarIcon: React.FC<{ className?: string; size?: number }> = ({
  className = "w-4 h-4 text-[#C89B3C]",
  size = 16
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M12 0C12 7.5 13 11 20 12C13 13 12 16.5 12 24C12 16.5 11 13 4 12C11 11 12 7.5 12 0Z" />
  </svg>
);

// Reusable golden flourish line with center bead matching the underline in the logo
export const CelebreFlourishDivider: React.FC<{ className?: string }> = ({
  className = "my-4"
}) => (
  <div className={`flex items-center justify-center gap-2 ${className}`}>
    <div className="h-[1.5px] w-16 sm:w-24 bg-gradient-to-r from-transparent via-[#C89B3C] to-[#C89B3C]" />
    <span className="w-2.5 h-2.5 rounded-full bg-gradient-to-tr from-[#9A7228] via-[#F3CD67] to-[#C89B3C] shadow-xs" />
    <CelebreClocheIcon className="w-4 h-4 text-[#C89B3C]" size={16} />
    <span className="w-2.5 h-2.5 rounded-full bg-gradient-to-tr from-[#9A7228] via-[#F3CD67] to-[#C89B3C] shadow-xs" />
    <div className="h-[1.5px] w-16 sm:w-24 bg-gradient-to-l from-transparent via-[#C89B3C] to-[#C89B3C]" />
  </div>
);
