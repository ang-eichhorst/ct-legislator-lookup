import { NextRequest, NextResponse } from 'next/server';
const Geocodio = require('geocodio-library-node');
const Papa = require('papaparse');

// Cache for custom data to avoid fetching CSV on every request
let customDataCache: any[] | null = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 1000 * 60 * 60; // 1 hour

async function getCustomData() {
  const now = Date.now();
  
  // Return cached data if it's fresh
  if (customDataCache && (now - cacheTimestamp) < CACHE_DURATION) {
    console.log('Returning cached custom data, count:', customDataCache.length);
    return customDataCache;
  }

  const csvUrl = process.env.CUSTOM_DATA_CSV_URL;
  
  console.log('CSV URL from env:', csvUrl);
  
  if (!csvUrl) {
    console.warn('CUSTOM_DATA_CSV_URL not configured, skipping custom data merge');
    return [];
  }

  try {
    console.log('Fetching custom data from:', csvUrl);
    const response = await fetch(csvUrl);
    const csvText = await response.text();
    
    console.log('CSV text length:', csvText.length);
    console.log('First 200 chars:', csvText.substring(0, 200));
    
    const parsed = Papa.parse(csvText, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: true,
    });

    console.log('Parsed custom data rows:', parsed.data.length);
    console.log('First row sample:', parsed.data[0]);

    customDataCache = parsed.data;
    cacheTimestamp = now;
    
    return customDataCache;
  } catch (error) {
    console.error('Error fetching custom data:', error);
    return [];
  }
}

function matchCustomData(legislator: any, customData: any[]) {
  // Extract district number and chamber from legislator
  const districtNum = legislator.district?.district_number;
  const chamber = legislator.chamber?.toLowerCase();
  
  console.log('Matching legislator - District:', districtNum, 'Chamber:', chamber);
  
  if (!districtNum || !chamber) {
    console.log('Missing district or chamber, skipping match');
    return null;
  }

  // Normalize chamber names for matching
  const normalizedChamber = chamber === 'house' ? 'house' : 'senate';

  // Find matching entry in custom data by district number AND chamber
  const match = customData.find((row: any) => {
    const rowChamber = row.Chamber?.toLowerCase().trim();
    const rowDistrict = parseInt(row.District);
    
    const isMatch = rowDistrict === parseInt(districtNum) && rowChamber === normalizedChamber;
    
    if (isMatch) {
      console.log('MATCH FOUND:', row);
    }
    
    return isMatch;
  });

  if (!match) {
    console.log('No match found for District', districtNum, 'Chamber', normalizedChamber);
  }

  return match || null;
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const address = searchParams.get('address');

  if (!address) {
    return NextResponse.json(
      { error: 'Address is required' },
      { status: 400 }
    );
  }

  const API_KEY = process.env.GEOCODIO_API_KEY;

  if (!API_KEY) {
    return NextResponse.json(
      { error: 'API key not configured' },
      { status: 500 }
    );
  }

  try {
    const geocoder = new Geocodio(API_KEY);
    
    // Geocode with state legislative district data
    const response = await geocoder.geocode(address, ['stateleg']);
    
    if (!response.results || response.results.length === 0) {
      return NextResponse.json(
        { error: 'Address not found. Please check your address and try again.' },
        { status: 404 }
      );
    }

    const result = response.results[0];
    const fields = result.fields;
    const matchedAddress = result.formatted_address;

    // Check if we have state legislative data
    if (!fields?.state_legislative_districts) {
      return NextResponse.json(
        { error: 'No legislative district information available for this address.' },
        { status: 404 }
      );
    }

    const legislators = fields.state_legislative_districts;

    // Get custom data
    const customData = await getCustomData();
    console.log('Custom data loaded, rows:', customData.length);

    // Extract legislators from the nested structure
    const extractedLegislators: any = {
      house: [],
      senate: []
    };

    // Process house districts
    if (legislators.house && Array.isArray(legislators.house)) {
      legislators.house.forEach((district: any) => {
        if (district.current_legislators && Array.isArray(district.current_legislators)) {
          district.current_legislators.forEach((leg: any) => {
            const legislatorData = {
              ...leg,
              district: {
                name: district.name,
                district_number: district.district_number
              },
              chamber: 'House'
            };

            // Merge custom data if available
            const customMatch = matchCustomData(legislatorData, customData);
            if (customMatch) {
              legislatorData.custom = {
                image_url: customMatch.Image,
                profile_link: customMatch.Link,
                name: customMatch.Name
              };
              console.log('Added custom data to House legislator:', legislatorData.custom);
            }

            extractedLegislators.house.push(legislatorData);
          });
        }
      });
    }

    // Process senate districts
    if (legislators.senate && Array.isArray(legislators.senate)) {
      legislators.senate.forEach((district: any) => {
        if (district.current_legislators && Array.isArray(district.current_legislators)) {
          district.current_legislators.forEach((leg: any) => {
            const legislatorData = {
              ...leg,
              district: {
                name: district.name,
                district_number: district.district_number
              },
              chamber: 'Senate'
            };

            // Merge custom data if available
            const customMatch = matchCustomData(legislatorData, customData);
            if (customMatch) {
              legislatorData.custom = {
                image_url: customMatch.Image,
                profile_link: customMatch.Link,
                name: customMatch.Name
              };
              console.log('Added custom data to Senate legislator:', legislatorData.custom);
            }

            extractedLegislators.senate.push(legislatorData);
          });
        }
      });
    }

    return NextResponse.json({
      legislators: extractedLegislators,
      matched_address: matchedAddress,
      coordinates: {
        lat: result.location.lat,
        lng: result.location.lng
      }
    });
  } catch (error: any) {
    console.error('Error fetching legislators:', error);
    
    // Handle specific Geocodio errors
    if (error.message?.includes('Could not geocode address')) {
      return NextResponse.json(
        { error: 'Could not find this address. Please check the spelling and try again.' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch legislators. Please try again.' },
      { status: 500 }
    );
  }
}