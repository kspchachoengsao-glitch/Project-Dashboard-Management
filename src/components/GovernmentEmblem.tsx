import React from 'react';
import logoImg from '../assets/images/province_logo_1784882847695.jpg';

export const GovernmentEmblem: React.FC<{ className?: string }> = ({ className = "h-12 w-12" }) => {
  return (
    <div className={`relative flex items-center justify-center shrink-0 ${className}`}>
      <img
        src={logoImg}
        alt="ตราสำนักงานศึกษาธิการจังหวัดฉะเชิงเทรา"
        referrerPolicy="no-referrer"
        className="w-full h-full object-contain rounded-full shadow-md border-2 border-amber-500/30"
      />
    </div>
  );
};

