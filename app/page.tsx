'use client';

import React, { useState, useEffect } from 'react';
import { Search, MapPin, Mail, Phone, ExternalLink, AlertCircle, Building } from 'lucide-react';

interface StateLegislator {
  name?: string;
  party?: string;
  type?: string;
  bio?: {
    first_name?: string;
    last_name?: string;
    party?: string;
    gender?: string;
    photo_url?: string;
  };
  contact?: {
    url?: string;
    address?: string;
    phone?: string;
    email?: string;
    contact_form?: string;
  };
  district?: {
    name?: string;
    district_number?: string;
  };
  chamber?: string;
  references?: {
    votesmart_id?: string;
  };
  custom?: {
    image_url?: string;
    profile_link?: string;
    name?: string;
  };
}

interface LegislatorData {
  house?: StateLegislator[];
  senate?: StateLegislator[];
}

export default function Home() {
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [legislators, setLegislators] = useState<LegislatorData | null>(null);
  const [error, setError] = useState('');
  const [matchedAddress, setMatchedAddress] = useState('');

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

  const lookupLegislators = async (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    
    if (!address.trim()) {
      setError('Please enter an address');
      return;
    }

    setLoading(true);
    setError('');
    setLegislators(null);
    setMatchedAddress('');

    try {
      const response = await fetch(`/api/legislators?address=${encodeURIComponent(address)}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch legislators');
      }

      const data = await response.json();
      console.log('Received legislator data:', data);
      setLegislators(data.legislators);
      setMatchedAddress(data.matched_address);

      if (!data.legislators.house && !data.legislators.senate) {
        setError('No Connecticut legislators found for this address. Please ensure you entered a Connecticut address.');
      }
    } catch (err) {
      console.error('Error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred while looking up legislators');
    } finally {
      setLoading(false);
    }
  };

  const allLegislators = [
    ...(legislators?.senate || []).map(leg => ({ ...leg, chamber: 'Senate' })),
    ...(legislators?.house || []).map(leg => ({ ...leg, chamber: 'House' })),
  ];

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white">
          <div className="flex items-center gap-3 mb-6 pb-6 border-b-2 border-gray-900">
            
            <h2 className="text-4xl text-gray-900" style={{ fontFamily: '"EB Garamond", garamond, georgia, "Times New Roman", serif' }}>
              Lawmaker Look-up
            </h2>

          </div>
                      <p className="mt-2">Don't know your House or Senate district number or who your lawmakers are? Use our tool to look up your state senator and representative by typing in your full address, including the zip code.
</p>

          <div className="mb-8">
            <div className="flex gap-3">
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Enter your Connecticut address..."
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                onKeyPress={(e) => e.key === 'Enter' && lookupLegislators()}
              />
              <button
                onClick={lookupLegislators}
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

          {allLegislators.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-3xl font-bold text-gray-900 mb-6" style={{ fontFamily: 'Georgia, serif' }}>
                Your Legislators
              </h2>
              
              <div className="grid md:grid-cols-2 gap-6">
                {allLegislators.map((leg, index) => {
                  const firstName = leg.bio?.first_name || '';
                  const lastName = leg.bio?.last_name || '';
                  const fullName = firstName && lastName ? `${firstName} ${lastName}` : leg.name || 'Name Not Available';
                  const party = leg.bio?.party || leg.party || 'Unknown Party';
                  const chamber = leg.chamber || 'Legislature';
                  const imageUrl = leg.custom?.image_url || leg.bio?.photo_url;
                  
                  return (
                    <div
                      key={index}
                      className="border-2 border-gray-200 p-6 hover:border-gray-900 transition-colors"
                    >
                      <div className="mb-4">
                        <div className="flex gap-4">
                          {imageUrl && (
                            <a 
                              href={leg.custom?.profile_link || '#'}
                              target="_parent"
                              rel="noopener noreferrer"
                              className={leg.custom?.profile_link ? 'cursor-pointer' : 'pointer-events-none'}
                            >
                              <img
                                src={imageUrl}
                                alt={fullName}
                                className="w-[150px] h-[150px] object-cover flex-shrink-0"
                              />
                            </a>
                          )}
                          <div className="flex-1">
                            <div className="mb-3">
                              {leg.custom?.profile_link ? (
                                <a 
                                  href={leg.custom.profile_link}
                                  target="_parent"
                                  rel="noopener noreferrer"
                                  className="hover:underline"
                                >
                                  <h3 className="text-2xl font-bold" style={{ fontFamily: 'Georgia, serif', color: '#B32025' }}>
                                    {fullName}
                                  </h3>
                                </a>
                              ) : (
                                <h3 className="text-2xl font-bold" style={{ fontFamily: 'Georgia, serif', color: '#B32025' }}>
                                  {fullName}
                                </h3>
                              )}
                              <p className="text-gray-700 font-medium">
                                {party}
                              </p>
                              {leg.district?.district_number && chamber && (
                                <p className="text-sm text-gray-600 mt-1">
                                  Connecticut State {chamber} District {leg.district.district_number}
                                </p>
                              )}
                            </div>

                            <div className="space-y-2">
                              {leg.contact?.email && (
                                <div className="flex items-center gap-2 text-gray-700">
                                  <Mail className="w-4 h-4 text-gray-700 flex-shrink-0" />
                                  <a
                                    href={`mailto:${leg.contact.email}`}
                                    className="hover:underline break-all text-sm"
                                  >
                                    {leg.contact.email}
                                  </a>
                                </div>
                              )}

                              {leg.contact?.phone && (
                                <div className="flex items-center gap-2 text-gray-700">
                                  <Phone className="w-4 h-4 text-gray-700 flex-shrink-0" />
                                  <a
                                    href={`tel:${leg.contact.phone}`}
                                    className="hover:underline text-sm"
                                  >
                                    {leg.contact.phone}
                                  </a>
                                </div>
                              )}

                              {leg.contact?.contact_form && (
                                <div className="flex items-center gap-2 text-gray-700">
                                  <Mail className="w-4 h-4 text-gray-700 flex-shrink-0" />
                                  <a
                                    href={leg.contact.contact_form}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="hover:underline text-sm"
                                  >
                                    Contact Form
                                  </a>
                                </div>
                              )}

                              {!leg.custom?.profile_link && leg.contact?.url && (
                                <div className="flex items-center gap-2 text-gray-700">
                                  <ExternalLink className="w-4 h-4 text-gray-700 flex-shrink-0" />
                                  <a
                                    href={leg.contact.url}
                                    target="_parent"
                                    rel="noopener noreferrer"
                                    className="hover:underline text-sm"
                                  >
                                    Official Website
                                  </a>
                                </div>
                              )}

                              {leg.custom?.profile_link && (
                                <div className="flex items-center gap-2" style={{ color: '#B32025' }}>
                                  <ExternalLink className="w-4 h-4 flex-shrink-0" style={{ color: '#B32025' }} />
                                  <a
                                    href={leg.custom.profile_link}
                                    target="_parent"
                                    rel="noopener noreferrer"
                                    className="hover:underline font-bold text-sm"
                                    style={{ color: '#B32025' }}
                                  >
                                    View CT Mirror Profile
                                  </a>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {leg.contact?.address && (
                        <div className="mt-4 pt-4 border-t border-gray-200">
                          <p className="text-xs text-gray-600 flex items-start gap-2">
                            <Building className="w-4 h-4 text-gray-500 flex-shrink-0 mt-0.5" />
                            <span>
                              <span className="font-semibold">Office:</span> {leg.contact.address}
                            </span>
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {!loading && !legislators && !error && (
            <div className="text-center py-12 text-gray-500">
              <MapPin className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p>Enter a Connecticut address to find your state legislators</p>
            </div>
          )}
        </div>

       
      </div>
    </div>
  );
}