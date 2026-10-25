import React from 'react';

export function LoadingState({ message = 'Loading records...' }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center my-6">
      <div className="w-8 h-8 rounded-full border-2 border-gray-600 border-t-white animate-spin mb-3" />
      <span className="text-xs text-gray-400 font-medium">{message}</span>
    </div>
  );
}
