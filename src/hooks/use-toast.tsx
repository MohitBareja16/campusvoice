"use client"

import { toast as hotToast } from 'react-hot-toast';
import type React from 'react';

// A simple component to render the title and description
const ToastMessage = ({ title, description }: { title: string, description?: string }) => (
  <div className="flex flex-col">
    <span className="font-semibold text-gray-800">{title}</span>
    {description && <span className="text-sm text-gray-600">{description}</span>}
  </div>
);

// This custom hook acts as an adapter, so you don't need to refactor
// your existing toast calls throughout the app.
const useToast = () => {
  const toast = {
    success: (title: string, options?: { description?: string }) => {
      hotToast.success(<ToastMessage title={title} description={options?.description} />);
    },
    error: (title: string, options?: { description?: string }) => {
      hotToast.error(<ToastMessage title={title} description={options?.description} />);
    },
    info: (title: string, options?: { description?: string }) => {
      hotToast(<ToastMessage title={title} description={options?.description} />);
    },
  };

  return toast;
};

export { useToast };
