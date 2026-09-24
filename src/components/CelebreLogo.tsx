import React from "react";
import logoImg from "../assets/images/celebre_official_logo_transparent.png";

interface CelebreLogoProps {
  className?: string;
  showSlogan?: boolean;
  size?: "sm" | "md" | "lg" | "xl";
  sloganText?: string;
}

export const CelebreLogo: React.FC<CelebreLogoProps> = ({
  className = "",
  showSlogan = true,
  size = "md",
  sloganText = "سيلبر شريك مؤسس لمناساباتك السعيدة"
}) => {
  const sizeClasses = {
    sm: "h-9 w-auto",
    md: "h-14 sm:h-16 w-auto",
    lg: "h-20 sm:h-24 w-auto",
    xl: "h-28 sm:h-32 w-auto"
  };

  return (
    <div className={`flex flex-col items-center select-none ${className}`}>
      <div className="flex items-center justify-center">
        <img
          src={logoImg}
          alt="سيلبر شريك مؤسس لمناساباتك السعيدة - Celebre Official Logo"
          className={`${sizeClasses[size]} object-contain filter drop-shadow-sm transition-transform duration-300 hover:scale-105`}
          referrerPolicy="no-referrer"
        />
      </div>
      {showSlogan && (
        <div className="mt-1 flex flex-col items-center text-center">
          <span className="text-[#C89B3C] font-bold text-xs sm:text-sm tracking-wide flex items-center gap-1.5 font-['Playfair_Display','Alexandria',serif]">
            <span>✨</span>
            <span>{sloganText}</span>
            <span>✨</span>
          </span>
          <span className="text-[11px] text-[#7A6E65] font-medium hidden sm:inline">
            خدمة كاترنج المناسبات الملكية • بني سويف
          </span>
        </div>
      )}
    </div>
  );
};
