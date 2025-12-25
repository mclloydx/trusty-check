import { useState, useEffect } from 'react';

interface TrackingDisplayProps {
  trackingId?: string;
}

export function TrackingDisplay({ trackingId }: TrackingDisplayProps) {
  const [isReady, setIsReady] = useState(false);
  
  useEffect(() => {
    // Simulate initialization
    setIsReady(true);
  }, []);
  
  if (!isReady || !trackingId) {
    return <div className="text-sm text-gray-500">No tracking information available</div>;
  }
  
  return (
    <div className="bg-gray-50 border rounded-lg p-4 mb-6">
      <h3 className="font-semibold text-lg mb-2">Tracking Information</h3>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600">Your Tracking ID:</p>
          <p className="font-mono text-lg font-bold text-blue-600 break-all">
            {trackingId}
          </p>
        </div>
        <button
          onClick={() => {
            if (trackingId) {
              navigator.clipboard.writeText(trackingId);
            }
          }}
          className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z"></path>
            <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z"></path>
          </svg>
          Copy
        </button>
      </div>
      <p className="text-xs text-gray-500 mt-2">
        Use this ID to track your inspection request.
      </p>
    </div>
  );
}