"use client"

import { toast as hotToast } from 'react-hot-toast';
import React, { useCallback, useMemo } from 'react';

// A simple component to render the title and description
const ToastMessage = ({ title, description }: { title: string; description?: string }) => (
  <div className="flex flex-col">
    <span className="font-semibold text-gray-800">{title}</span>
    {description && <span className="text-sm text-gray-600">{description}</span>}
  </div>
);

// Return a stable API so consuming components can safely include `toast` in hook deps
const useToast = () => {
  const success = useCallback((title: string, options?: { description?: string }) => {
    hotToast.success(<ToastMessage title={title} description={options?.description} />);
  }, []);

  const error = useCallback((title: string, options?: { description?: string }) => {
    hotToast.error(<ToastMessage title={title} description={options?.description} />);
  }, []);

  const info = useCallback((title: string, options?: { description?: string }) => {
    hotToast(<ToastMessage title={title} description={options?.description} />);
  }, []);

  return useMemo(() => ({ success, error, info }), [success, error, info]);
};

export { useToast };
