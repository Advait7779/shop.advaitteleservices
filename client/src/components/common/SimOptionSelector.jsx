import React from 'react';
import { Ban, Check } from 'lucide-react';
import { SIM_OPTIONS } from '../../utils/productOptions';

const CarrierMark = ({ carrier, active }) => {
  if (carrier === 'vi') {
    return (
      <span className="inline-flex h-8 w-11 items-center justify-center rounded-lg bg-white border border-gray-200/80 shadow-2xs p-1" aria-hidden="true">
        <img src="/carriers/vi-logo.png" alt="" className="h-5 w-auto object-contain" />
      </span>
    );
  }
  if (carrier === 'airtel') {
    return (
      <span className="inline-flex h-8 w-11 items-center justify-center rounded-lg bg-white border border-gray-200/80 shadow-2xs p-1" aria-hidden="true">
        <img src="/carriers/airtel-logo.png" alt="" className="h-5 w-auto object-contain" />
      </span>
    );
  }
  return (
    <span
      className={`inline-flex h-8 w-11 items-center justify-center rounded-lg border ${
        active ? 'border-[#385775]/30 bg-white text-[#385775]' : 'border-gray-200 bg-gray-50 text-gray-500'
      }`}
      aria-hidden="true"
    >
      <Ban className="h-4 w-4" />
    </span>
  );
};

/**
 * GPS SIM carrier selector mirroring clean selectable hardware/SIM option cards.
 */
const SimOptionSelector = ({ selectedSim, onChange, options = SIM_OPTIONS }) => {
  const normalizedOptions = (options?.length ? options : SIM_OPTIONS).map((item) => {
    if (typeof item === 'string') {
      return SIM_OPTIONS.find((opt) => opt.id === item) || { id: item, label: item, caption: '', carrier: 'none' };
    }
    return item;
  });

  return (
    <div>
      <div className="flex items-center justify-between gap-2 mb-2.5">
        <span className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
          Choose SIM:
        </span>
        <span className="text-[11px] font-medium text-gray-500">For live 4G GPS tracking</span>
      </div>

      <div
        role="radiogroup"
        aria-label="Choose SIM card option"
        className="grid grid-cols-1 sm:grid-cols-3 gap-2.5"
      >
        {normalizedOptions.map((opt) => {
          const active = selectedSim === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => onChange(opt.id)}
              className={`relative flex sm:flex-col items-center sm:items-center gap-3 sm:gap-1.5 rounded-xl px-3.5 py-3 text-left sm:text-center transition-all duration-200 border ${
                active
                  ? 'border-[#385775] ring-2 ring-[#385775]/20 bg-[#f1f6fb] shadow-sm'
                  : 'border-gray-200 bg-white hover:border-[#9fb6cc] hover:bg-gray-50/70'
              }`}
            >
              {active && (
                <span className="absolute top-2 right-2 flex h-4 w-4 items-center justify-center rounded-full bg-[#385775] text-white">
                  <Check className="h-2.5 w-2.5 stroke-[3]" />
                </span>
              )}
              <CarrierMark carrier={opt.carrier} active={active} />
              <div className="min-w-0">
                <div className={`text-xs font-bold ${active ? 'text-[#172536]' : 'text-gray-800'}`}>
                  {opt.label}
                </div>
                <div className="text-[10px] leading-tight text-gray-500 mt-0.5">
                  {opt.caption}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default SimOptionSelector;
