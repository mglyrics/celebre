import React, { useState } from "react";
import { MapPin, Navigation, ChevronDown, Check, Loader2, Sparkles, X } from "lucide-react";
import { useUserLocation } from "../hooks/useUserLocation";
import { EGYPT_GOVERNORATES } from "../utils/locationService";

interface LocationGreetingBarProps {
  variant?: "topbar" | "banner" | "hero-badge";
  className?: string;
  onSelectGovernorate?: (govName: string) => void;
}

export const LocationGreetingBar: React.FC<LocationGreetingBarProps> = ({
  variant = "topbar",
  className = "",
  onSelectGovernorate
}) => {
  const {
    location,
    greeting,
    locationName,
    isLoading,
    isGpsLoading,
    gpsError,
    requestGpsLocation,
    setManualLocation
  } = useUserLocation();

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [feedbackNotice, setFeedbackNotice] = useState<string | null>(null);

  const handleGpsClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const loc = await requestGpsLocation();
      setFeedbackNotice(`تم تحديد موقعك بدقة: ${loc.locationName}`);
      if (onSelectGovernorate) onSelectGovernorate(loc.governorate);
      setTimeout(() => setFeedbackNotice(null), 3500);
    } catch (err: any) {
      setFeedbackNotice(err?.message || "تعذر تحديد الموقع");
      setTimeout(() => setFeedbackNotice(null), 3500);
    }
  };

  const handleSelectGov = (name: string) => {
    setManualLocation(name);
    setIsDropdownOpen(false);
    setFeedbackNotice(`تم تحديث الترحيب لأهل: ${name}`);
    if (onSelectGovernorate) onSelectGovernorate(name);
    setTimeout(() => setFeedbackNotice(null), 3000);
  };

  // 1. Variant: Hero Badge (Placed directly above Hero title)
  if (variant === "hero-badge") {
    return (
      <div className={`relative inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-gradient-to-r from-[#5C1027]/10 via-[#C89B3C]/15 to-[#5C1027]/10 border border-[#C89B3C]/40 shadow-xs backdrop-blur-xs text-[#5C1027] ${className}`}>
        <div className="flex items-center gap-1.5">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#C89B3C] opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#5C1027]" />
          </span>
          <MapPin className="w-4 h-4 text-[#C89B3C]" />
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs sm:text-sm font-black text-[#5C1027] tracking-tight">
            {isLoading ? "جاري التعرف على منطقتكم..." : greeting}
          </span>
        </div>

        {/* GPS quick trigger */}
        <button
          type="button"
          onClick={handleGpsClick}
          disabled={isGpsLoading}
          title="تحديد الموقع الجغرافي للمتصفح بدقة عبر GPS"
          className="mr-1 p-1 hover:bg-[#5C1027]/10 rounded-lg text-[#C89B3C] hover:text-[#5C1027] transition-colors flex items-center gap-1 text-[11px] font-bold"
        >
          {isGpsLoading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin text-[#5C1027]" />
          ) : (
            <Navigation className="w-3.5 h-3.5" />
          )}
          <span className="hidden sm:inline text-[10px]">تحديد بدقة</span>
        </button>

        {/* Switch Dropdown trigger */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="text-[11px] font-bold text-[#7A6E65] hover:text-[#5C1027] flex items-center gap-0.5 border-r border-[#E8DFD1] pr-2 mr-1"
          >
            <span>تغيير</span>
            <ChevronDown className="w-3 h-3" />
          </button>

          {isDropdownOpen && (
            <div className="absolute left-0 top-full mt-2 w-64 max-h-72 overflow-y-auto bg-white rounded-2xl shadow-xl border border-[#E8DFD1] p-2 z-50 text-right animate-fadeIn">
              <div className="p-2 border-b border-[#F0EAE1] flex items-center justify-between text-xs font-black text-[#5C1027]">
                <span>اختر محافظتك للترحيب:</span>
                <button
                  type="button"
                  onClick={() => setIsDropdownOpen(false)}
                  className="p-1 rounded-md hover:bg-stone-100 text-stone-500"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="space-y-1 mt-1">
                {EGYPT_GOVERNORATES.map((gov) => (
                  <button
                    key={gov.id}
                    type="button"
                    onClick={() => handleSelectGov(gov.name)}
                    className={`w-full text-right px-3 py-1.5 rounded-xl text-xs font-bold transition-colors flex items-center justify-between ${
                      locationName.includes(gov.name)
                        ? "bg-[#5C1027] text-white"
                        : "hover:bg-[#FAF7F2] text-[#221B17]"
                    }`}
                  >
                    <span>{gov.name}</span>
                    {locationName.includes(gov.name) && (
                      <Check className="w-3.5 h-3.5 text-[#C89B3C]" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {feedbackNotice && (
          <div className="absolute -bottom-8 right-0 bg-[#221B17] text-white text-[11px] font-bold px-3 py-1 rounded-xl shadow-lg animate-fadeIn z-50">
            {feedbackNotice}
          </div>
        )}
      </div>
    );
  }

  // 2. Variant: Topbar Bar (Dedicated welcoming bar across top of screen)
  return (
    <div className={`relative bg-gradient-to-r from-[#F4EEDB] via-[#FAF7F2] to-[#F4EEDB] border-b border-[#C89B3C]/30 py-1.5 px-4 sm:px-6 lg:px-8 text-xs shadow-2xs z-35 ${className}`}>
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 flex-wrap sm:flex-nowrap">
        {/* Welcome Greeting with Location */}
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="w-6 h-6 rounded-full bg-[#5C1027]/10 flex items-center justify-center shrink-0 border border-[#C89B3C]/40">
            <MapPin className="w-3.5 h-3.5 text-[#5C1027]" />
          </div>

          <div className="flex items-center gap-1.5 overflow-hidden text-ellipsis whitespace-nowrap">
            <span className="font-black text-sm text-[#5C1027] tracking-tight">
              {isLoading ? "جاري التعرف على موقع متصفحكم..." : greeting}
            </span>
            <span className="hidden md:inline text-xs text-[#7A6E65]">
              • يسعد كاترنج سيلبر خدمتكم وتوريد أرقى العلب لمناسباتكم
            </span>
          </div>
        </div>

        {/* Location Controls (GPS & Selector) */}
        <div className="flex items-center gap-2 shrink-0">
          {/* High accuracy GPS detection button */}
          <button
            type="button"
            onClick={handleGpsClick}
            disabled={isGpsLoading}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white hover:bg-[#5C1027] hover:text-white text-[#5C1027] border border-[#E8DFD1] text-[11px] font-bold transition-all shadow-2xs"
            title="تحديد منطقتك بدقة عبر متصفحك (GPS)"
          >
            {isGpsLoading ? (
              <Loader2 className="w-3 h-3 animate-spin text-[#C89B3C]" />
            ) : (
              <Navigation className="w-3 h-3 text-[#C89B3C]" />
            )}
            <span>تحديد موقعي بدقة</span>
          </button>

          {/* Manual Governorate Selector */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white hover:bg-[#F3E7D3] text-[#221B17] border border-[#E8DFD1] text-[11px] font-bold transition-colors shadow-2xs"
            >
              <span>المنطقة: <strong>{locationName}</strong></span>
              <ChevronDown className="w-3 h-3 text-[#7A6E65]" />
            </button>

            {isDropdownOpen && (
              <div className="absolute left-0 top-full mt-2 w-64 max-h-80 overflow-y-auto bg-white rounded-2xl shadow-xl border border-[#E8DFD1] p-2 z-50 text-right animate-fadeIn">
                <div className="p-2 border-b border-[#F0EAE1] flex items-center justify-between text-xs font-black text-[#5C1027]">
                  <span>اختر منطقتك للترحيب:</span>
                  <button
                    type="button"
                    onClick={() => setIsDropdownOpen(false)}
                    className="p-1 rounded-md hover:bg-stone-100 text-stone-500"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="space-y-1 mt-1">
                  {EGYPT_GOVERNORATES.map((gov) => (
                    <button
                      key={gov.id}
                      type="button"
                      onClick={() => handleSelectGov(gov.name)}
                      className={`w-full text-right px-3 py-1.5 rounded-xl text-xs font-bold transition-colors flex items-center justify-between ${
                        locationName.includes(gov.name)
                          ? "bg-[#5C1027] text-white"
                          : "hover:bg-[#FAF7F2] text-[#221B17]"
                      }`}
                    >
                      <div>
                        <div>{gov.name}</div>
                        <div className={`text-[10px] ${locationName.includes(gov.name) ? "text-[#F4EEDB]" : "text-[#7A6E65]"}`}>
                          {gov.greetingTitle}
                        </div>
                      </div>
                      {locationName.includes(gov.name) && (
                        <Check className="w-4 h-4 text-[#C89B3C]" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {feedbackNotice && (
        <div className="max-w-7xl mx-auto mt-1">
          <div className="inline-block bg-[#5C1027] text-white text-[11px] font-bold px-3 py-0.5 rounded-md shadow-xs animate-fadeIn">
            {feedbackNotice}
          </div>
        </div>
      )}
    </div>
  );
};
