'use client';

import React, { useState, useEffect } from 'react';
import { Search, AlertCircle } from 'lucide-react';

export default function FindMyDistrict() {
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [matchedAddress, setMatchedAddress] = useState('');
  const [senateDistrict, setSenateDistrict] = useState('');
  const [houseDistrict, setHouseDistrict] = useState('');

  // Initialize Pym.js for iframe embedding
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://pym.nprapps.org/pym.v1.min.js';
    script.async = true;
    script.onload = () => {
      // @ts-ignore
      if (window.pym) {
        // @ts-ignore
        new window.pym.Child({ polling: 500 });
      }
    };
    document.head.appendChild(script);
  }, []);

  const lookupDistricts = async () => {
    if (!address.trim()) {
      setError('Please enter an address');
      return;
    }

    setLoading(true);
    setError('');
    setMatchedAddress('');
    setSenateDistrict('');
    setHouseDistrict('');

    try {
      const response = await fetch(`/api/legislators?address=${encodeURIComponent(address)}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to look up districts');
      }

      const data = await response.json();
      const senate = data.legislators.senate?.[0]?.district?.district_number || '';
      const house = data.legislators.house?.[0]?.district?.district_number || '';

      setMatchedAddress(data.matched_address);
      setSenateDistrict(senate);
      setHouseDistrict(house);

      if (!senate && !house) {
        setError('No Connecticut districts found for this address. Please ensure you entered a Connecticut address.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while looking up districts');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-3 mb-6 pb-6 border-b-2 border-gray-900">
          <h2 className="text-4xl text-gray-900" style={{ fontFamily: 'var(--font-eb-garamond), garamond, georgia, "Times New Roman", serif' }}>
            Find my district
          </h2>
        </div>

        <p className="mt-2">Type in your full address, including the zip code, to find your state House and Senate district numbers.</p>

        <div className="mb-8 mt-4">
          <div className="flex gap-3">
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Enter your Connecticut address..."
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              onKeyDown={(e) => e.key === 'Enter' && lookupDistricts()}
            />
            <button
              onClick={() => lookupDistricts()}
              disabled={loading}
              className="px-6 py-3 bg-gray-900 text-white font-semibold hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
            >
              <Search className="w-5 h-5" />
              {loading ? 'Searching...' : 'Search'}
            </button>
          </div>
          <p className="mt-2 text-sm text-gray-600">
            Example: 210 Capitol Avenue, Hartford, CT 06106
          </p>
        </div>

        {matchedAddress && (
          <div className="bg-gray-50 border-l-4 border-gray-900 px-4 py-3 mb-6">
            <p className="text-sm text-gray-700">
              <span className="font-semibold">Matched Address:</span> {matchedAddress}
            </p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border-l-4 border-red-600 px-4 py-3 mb-6 flex items-start gap-2">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-red-600" />
            <span className="text-red-700">{error}</span>
          </div>
        )}

        {(senateDistrict || houseDistrict) && (
          <div className="border-2 border-gray-200 p-6 space-y-2 text-2xl">
            {senateDistrict && (
              <p><span className="font-bold">Senate district:</span> {senateDistrict}</p>
            )}
            {houseDistrict && (
              <p><span className="font-bold">House district:</span> {houseDistrict}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
