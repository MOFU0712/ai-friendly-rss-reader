import { useEffect } from 'react';

type Props = {
  message: string;
  onClose: () => void;
};

export function Toast({ message, onClose }: Props) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed top-4 right-4 z-50 bg-gray-900 text-white px-4 py-2 rounded-lg shadow-lg text-sm">
      {message}
    </div>
  );
}
