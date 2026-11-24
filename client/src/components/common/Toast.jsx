import React from 'react';
import { useCart } from '../../context/CartContext';
import { CheckCircle2, AlertCircle } from 'lucide-react';

const Toast = () => {
  const { toastMessage } = useCart();

  if (!toastMessage) return null;

  const isSuccess = toastMessage.type === 'success';

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-bounce-short">
      <div
        className={`flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-2xl text-sm font-semibold border ${
          isSuccess
            ? 'bg-[#172536] text-white border-brand-500 shadow-brand-950/20'
            : 'bg-red-900 text-white border-red-500 shadow-red-950/20'
        }`}
      >
        {isSuccess ? (
          <CheckCircle2 className="w-5 h-5 text-brand-300 shrink-0" />
        ) : (
          <AlertCircle className="w-5 h-5 text-red-300 shrink-0" />
        )}
        <span>{toastMessage.message}</span>
      </div>
    </div>
  );
};

export default Toast;
