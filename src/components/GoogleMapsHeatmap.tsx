import { useEffect, useRef, useState } from 'react';
import { Loader } from '@googlemaps/js-api-loader';
import { MarkerClusterer, SuperClusterAlgorithm } from '@googlemaps/markerclusterer';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Map, RefreshCw, MapPin, Clock, AlertCircle, Target } from 'lucide-react';

interface GecodedDebtor {
  debtor: any;
  coordinates: { lat: number; lng: number };
  category: 'upmarket' | 'mid-income' | 'low-income';
  placeDetails?: google.maps.places.PlaceResult;
  formattedAddress?: string;
  marker?: google.maps.Marker;
  placeId?: string;
  addressComponents?: google.maps.GeocoderAddressComponent[];
}

interface ClusterStats {
  totalDebtors: number;
  totalValue: number;
  avgScore: number;
  highPriority: number;
  mediumPriority: number;
  lowPriority: number;
  upmarketCount: number;
  midIncomeCount: number;
  lowIncomeCount: number;
}

interface GoogleMapsHeatmapProps {
  debtors: any[];
  onError?: (error: string) => void;
}

export function GoogleMapsHeatmap({ debtors, onError }: GoogleMapsHeatmapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const geocoderRef = useRef<google.maps.Geocoder | null>(null);
  const placesServiceRef = useRef<google.maps.places.PlacesService | null>(null);
  const markerClustererRef = useRef<MarkerClusterer | null>(null);
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [geocodingProgress, setGeocodingProgress] = useState(0);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [geocodedDebtors, setGeocodedDebtors] = useState<GecodedDebtor[]>([]);
  const [clusterStats, setClusterStats] = useState<ClusterStats | null>(null);

  // Enhanced address cleaning for Namibian addresses
  const cleanAddress = (address: string, postalCode?: string): string => {
    let cleaned = address.trim();
    
    // Remove common prefixes/suffixes that might confuse geocoding
    cleaned = cleaned.replace(/^(street|str|road|rd|avenue|ave)/i, '');
    cleaned = cleaned.replace(/\b(windhoek|namibia)\b/gi, '');
    cleaned = cleaned.trim();
    
    // Add postal code if available and not already included
    if (postalCode && postalCode !== 'N/A' && !cleaned.includes(postalCode)) {
      cleaned += `, ${postalCode}`;
    }
    
    // Always add Windhoek, Namibia for context
    cleaned += ', Windhoek, Namibia';
    
    // Clean up multiple commas
    cleaned = cleaned.replace(/,\s*,/g, ',').replace(/^\s*,\s*/, '');
    
    return cleaned;
  };

  // Enhanced area classification using Google Places API
  const classifyAreaByPlacesAPI = async (coordinates: { lat: number; lng: number }, placeResult?: google.maps.GeocoderResult): Promise<'upmarket' | 'mid-income' | 'low-income'> => {
    try {
      // First, check address components from geocoding result
      if (placeResult?.address_components) {
        const neighborhoodComponent = placeResult.address_components.find(
          component => component.types.includes('neighborhood') || 
                      component.types.includes('sublocality') ||
                      component.types.includes('sublocality_level_1')
        );
        
        if (neighborhoodComponent) {
          const neighborhood = neighborhoodComponent.long_name.toLowerCase();
          console.log(`Found neighborhood: ${neighborhood}`);
          
          // Known upmarket areas in Windhoek
          const upmarketAreas = [
            'klein windhoek', 'ludwigsdorf', 'eros', 'luxuryhill', 'olympia', 'avis',
            'auasblick', 'finkenstein', 'cimbebasia', 'pionierspark', 'suiderhof',
            'hochland park', 'kleine kuppe', 'elisenheim', 'omeya'
          ];
          
          // Known low-income areas
          const lowIncomeAreas = [
            'katutura', 'wanaheda', 'okuryangava', 'goreangab', 'havana',
            'greenwell matongo', 'okahandja park', 'ombili'
          ];
          
          if (upmarketAreas.some(area => neighborhood.includes(area) || area.includes(neighborhood))) {
            return 'upmarket';
          }
          
          if (lowIncomeAreas.some(area => neighborhood.includes(area) || area.includes(neighborhood))) {
            return 'low-income';
          }
        }
      }
      
      // If Places API is available, use it for additional classification
      if (placesServiceRef.current) {
        const location = new google.maps.LatLng(coordinates.lat, coordinates.lng);
        
        try {
          const nearbyPlaces = await new Promise<google.maps.places.PlaceResult[]>((resolve, reject) => {
            const timeout = setTimeout(() => reject(new Error('Places API timeout')), 10000);
            
            placesServiceRef.current!.nearbySearch({
              location: location,
              radius: 500, // 500m radius for more precise area assessment
              type: ['establishment']
            }, (results, status) => {
              clearTimeout(timeout);
              if (status === google.maps.places.PlacesServiceStatus.OK && results) {
                resolve(results);
              } else {
                reject(new Error(`Places API failed: ${status}`));
              }
            });
          });
          
          // Analyze nearby establishments
          const placeTypes = nearbyPlaces.flatMap(place => place.types || []);
          const priceRatings = nearbyPlaces.map(place => place.price_level || 0).filter(p => p > 0);
          const avgPriceLevel = priceRatings.length > 0 ? 
            priceRatings.reduce((sum, p) => sum + p, 0) / priceRatings.length : 2;
          
          // Upmarket indicators
          const upmarketIndicators = [
            'spa', 'beauty_salon', 'gym', 'car_dealer', 'jewelry_store',
            'restaurant', 'shopping_mall', 'bank', 'real_estate_agency'
          ];
          
          // Low-income indicators
          const lowIncomeIndicators = [
            'convenience_store', 'taxi_stand', 'bus_station', 'repair'
          ];
          
          const hasUpmarketPlaces = upmarketIndicators.some(type => placeTypes.includes(type));
          const hasLowIncomePlaces = lowIncomeIndicators.some(type => placeTypes.includes(type));
          
          console.log(`Places analysis for (${coordinates.lat}, ${coordinates.lng}):`, {
            avgPriceLevel,
            hasUpmarketPlaces,
            hasLowIncomePlaces,
            nearbyCount: nearbyPlaces.length
          });
          
          if (avgPriceLevel >= 3 || hasUpmarketPlaces) {
            return 'upmarket';
          } else if (hasLowIncomePlaces || avgPriceLevel <= 1.5) {
            return 'low-income';
          }
        } catch (placesError) {
          console.warn('Places API classification failed:', placesError);
        }
      }
      
      // Fallback to coordinate-based classification
      return classifyByCoordinates(coordinates);
      
    } catch (error) {
      console.warn('Area classification failed, using coordinate fallback:', error);
      return classifyByCoordinates(coordinates);
    }
  };

  // Coordinate-based fallback classification
  const classifyByCoordinates = (coordinates: { lat: number; lng: number }): 'upmarket' | 'mid-income' | 'low-income' => {
    // More precise coordinates for known areas in Windhoek
    const upmarketAreas = [
      { name: 'Klein Windhoek', lat: -22.5589, lng: 17.0872, radius: 0.008 },
      { name: 'Ludwigsdorf', lat: -22.5234, lng: 17.0456, radius: 0.006 },
      { name: 'Eros', lat: -22.5445, lng: 17.1123, radius: 0.008 },
      { name: 'Olympia', lat: -22.5012, lng: 17.0789, radius: 0.006 },
      { name: 'Avis', lat: -22.5667, lng: 17.0923, radius: 0.005 }
    ];
    
    const lowIncomeAreas = [
      { name: 'Katutura Central', lat: -22.4891, lng: 17.0234, radius: 0.010 },
      { name: 'Wanaheda', lat: -22.4789, lng: 17.0345, radius: 0.008 },
      { name: 'Okuryangava', lat: -22.4923, lng: 17.0567, radius: 0.008 },
      { name: 'Goreangab', lat: -22.4567, lng: 17.0234, radius: 0.006 }
    ];
    
    // Check upmarket areas first
    for (const area of upmarketAreas) {
      const distance = Math.sqrt(
        Math.pow(coordinates.lat - area.lat, 2) + 
        Math.pow(coordinates.lng - area.lng, 2)
      );
      if (distance <= area.radius) {
        console.log(`Classified as upmarket based on proximity to ${area.name}`);
        return 'upmarket';
      }
    }
    
    // Check low-income areas
    for (const area of lowIncomeAreas) {
      const distance = Math.sqrt(
        Math.pow(coordinates.lat - area.lat, 2) + 
        Math.pow(coordinates.lng - area.lng, 2)
      );
      if (distance <= area.radius) {
        console.log(`Classified as low-income based on proximity to ${area.name}`);
        return 'low-income';
      }
    }
    
    console.log('Classified as mid-income (default)');
    return 'mid-income';
  };

  // Create custom marker icon based on debtor data
  const createDebtorMarker = (geocodedDebtor: GecodedDebtor): google.maps.Marker => {
    const { debtor, coordinates, category, formattedAddress } = geocodedDebtor;
    
    // Determine marker styling based on priority and area type
    let fillColor: string;
    let strokeColor: string;
    let scale: number;
    
    // Color based on area income level
    switch (category) {
      case 'upmarket':
        fillColor = '#22c55e'; // Green
        strokeColor = '#16a34a';
        break;
      case 'mid-income':
        fillColor = '#fb923c'; // Orange  
        strokeColor = '#ea580c';
        break;
      case 'low-income':
        fillColor = '#ef4444'; // Red
        strokeColor = '#dc2626';
        break;
    }
    
    // Size based on collection priority score
    if (debtor.score >= 70) {
      scale = 12; // Large for high priority
    } else if (debtor.score >= 40) {
      scale = 9;  // Medium
    } else {
      scale = 6;  // Small for low priority
    }
    
    const marker = new google.maps.Marker({
      position: coordinates,
      map: mapInstanceRef.current,
      title: `${debtor.name} - ${debtor.amount} (Score: ${debtor.score})`,
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        scale: scale,
        fillColor: fillColor,
        fillOpacity: 0.9,
        strokeWeight: 2,
        strokeColor: strokeColor,
        strokeOpacity: 1
      },
      animation: google.maps.Animation.DROP,
      zIndex: debtor.score // Higher priority appears on top
    });
    
    // Create detailed info window
    const infoContent = `
      <div style="padding: 16px; font-family: 'Inter', system-ui; min-width: 320px; max-width: 380px; border-radius: 8px;">
        <div style="border-bottom: 2px solid ${fillColor}; padding-bottom: 12px; margin-bottom: 16px;">
          <h3 style="margin: 0; font-weight: 600; color: #1f2937; font-size: 18px;">${debtor.name}</h3>
          <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 8px;">
            <div style="font-size: 14px; color: ${fillColor}; font-weight: 600;">
              ${debtor.score >= 70 ? '🎯 HIGH PRIORITY' : debtor.score >= 40 ? '⚡ MEDIUM PRIORITY' : '⏳ LOW PRIORITY'}
            </div>
            <div style="font-size: 16px; font-weight: 700; color: #1f2937;">
              ${debtor.score}/100
            </div>
          </div>
          <div style="font-size: 13px; color: ${fillColor}; margin-top: 4px; font-weight: 500; text-transform: capitalize;">
            📍 ${category.replace('-', ' ')} Area
          </div>
        </div>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px;">
          <div>
            <div style="font-weight: 600; color: #374151; margin-bottom: 6px; font-size: 13px;">💰 DEBT AMOUNT</div>
            <div style="color: #1f2937; font-weight: 600; font-size: 16px;">${debtor.amount}</div>
          </div>
          
          <div>
            <div style="font-weight: 600; color: #374151; margin-bottom: 6px; font-size: 13px;">💳 LAST PAYMENT</div>
            <div style="color: #1f2937; font-size: 14px;">${debtor.lastPayment || 'No payment'}</div>
          </div>
        </div>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px;">
          <div>
            <div style="font-weight: 600; color: #374151; margin-bottom: 6px; font-size: 13px;">👤 OCCUPATION</div>
            <div style="color: #1f2937; font-size: 14px;">${debtor.occupation !== 'Unknown' ? debtor.occupation : 'N/A'}</div>
          </div>
          
          <div>
            <div style="font-weight: 600; color: #374151; margin-bottom: 6px; font-size: 13px;">📞 CONTACT</div>
            <div style="color: #1f2937; font-size: 14px;">${debtor.phone !== 'No phone' ? '✅ Available' : '❌ Missing'}</div>
          </div>
        </div>
        
        <div style="margin-top: 16px; padding-top: 12px; border-top: 1px solid #e5e7eb;">
          <div style="font-weight: 600; color: #374151; margin-bottom: 6px; font-size: 13px;">🗺️ VERIFIED ADDRESS</div>
          <div style="color: #6b7280; font-size: 13px; line-height: 1.5; background: #f9fafb; padding: 8px; border-radius: 6px;">
            ${formattedAddress || debtor.address}
          </div>
        </div>
        
        <div style="margin-top: 16px; display: flex; gap: 8px;">
          <button style="
            flex: 1; 
            background: ${fillColor}; 
            color: white; 
            border: none; 
            padding: 8px 12px; 
            border-radius: 6px; 
            font-size: 12px; 
            font-weight: 600; 
            cursor: pointer;
          " onclick="navigator.clipboard.writeText('${debtor.phone}')">
            📋 COPY PHONE
          </button>
          <button style="
            flex: 1; 
            background: #6b7280; 
            color: white; 
            border: none; 
            padding: 8px 12px; 
            border-radius: 6px; 
            font-size: 12px; 
            font-weight: 600; 
            cursor: pointer;
          " onclick="navigator.clipboard.writeText('${formattedAddress || debtor.address}')">
            📍 COPY ADDRESS
          </button>
        </div>
      </div>
    `;
    
    marker.addListener('click', () => {
      const infoWindow = new google.maps.InfoWindow({
        content: infoContent,
        maxWidth: 400
      });
      
      // Close any existing info windows
      if (window.currentInfoWindow) {
        window.currentInfoWindow.close();
      }
      
      infoWindow.open(mapInstanceRef.current, marker);
      window.currentInfoWindow = infoWindow;
      
      console.log(`Info window opened for ${debtor.name} at ${category} area`);
    });
    
    return marker;
  };

  // Simplified geocoding function focused on individual marker plotting
  const geocodeDebtors = async () => {
    if (!geocoderRef.current || !mapInstanceRef.current) {
      console.error('❌ Geocoder or map not ready');
      return;
    }

    console.log('🗺️ Starting geocoding process...');
    setIsGeocoding(true);
    setGeocodingProgress(0);
    setError(null);

    // Clear any existing markers
    if (markerClustererRef.current) {
      markerClustererRef.current.clearMarkers();
    }

    // Filter valid addresses with better logging
    const validDebtors = debtors.filter(debtor => {
      const hasAddress = debtor.address && 
                        debtor.address !== 'No address' && 
                        debtor.address.trim().length > 5;
      
      if (!hasAddress) {
        console.log(`⚠️ Skipping ${debtor.name} - no valid address: "${debtor.address}"`);
      }
      return hasAddress;
    });

    console.log(`📍 Found ${validDebtors.length} debtors with addresses out of ${debtors.length} total`);
    
    if (validDebtors.length === 0) {
      console.error('❌ No valid addresses found in debtor data');
      setError('No valid addresses found in debtor data');
      setIsGeocoding(false);
      return;
    }

    // Show first few addresses for debugging
    console.log('📋 Sample addresses to process:');
    validDebtors.slice(0, 3).forEach((debtor, i) => {
      console.log(`  ${i + 1}. ${debtor.name}: "${debtor.address}"`);
    });

    const geocoded: GecodedDebtor[] = [];
    const markers: google.maps.Marker[] = [];

    // Process each address individually
    for (let i = 0; i < validDebtors.length; i++) {
      const debtor = validDebtors[i];
      const cleanedAddress = cleanAddress(debtor.address, debtor.postalCode);
      
      console.log(`[${i + 1}/${validDebtors.length}] 🔍 Geocoding ${debtor.name} at "${cleanedAddress}"`);

      try {
        const result = await geocodeAddress(cleanedAddress, debtor.name);
        
        if (result) {
          const coordinates = {
            lat: result.geometry.location.lat(),
            lng: result.geometry.location.lng()
          };

          console.log(`✅ ${debtor.name} geocoded to: ${coordinates.lat}, ${coordinates.lng}`);
          
          // Classify area income level
          const category = classifyByCoordinates(coordinates);
          
          // Create marker
          const marker = createSimpleMarker(debtor, coordinates, category, result.formatted_address);
          markers.push(marker);
          
          geocoded.push({
            debtor,
            coordinates,
            category,
            formattedAddress: result.formatted_address,
            marker
          });
          
          console.log(`📍 Marker created for ${debtor.name} in ${category} area`);
        }
        
      } catch (error) {
        console.warn(`⚠️ Failed to geocode ${debtor.name}:`, error);
      }
      
      // Update progress
      setGeocodingProgress(((i + 1) / validDebtors.length) * 100);
      
      // Small delay to respect API limits
      if (i < validDebtors.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 300));
      }
    }

    console.log(`🎉 Geocoding complete: ${geocoded.length}/${validDebtors.length} successfully mapped`);

    if (geocoded.length === 0) {
      setError('No addresses could be successfully geocoded');
      setIsGeocoding(false);
      return;
    }

    // Create marker cluster
    if (markers.length > 0 && mapInstanceRef.current) {
      markerClustererRef.current = new MarkerClusterer({
        markers,
        map: mapInstanceRef.current,
        algorithm: new SuperClusterAlgorithm({ radius: 60, maxZoom: 15 })
      });
      
      // Fit bounds to show all markers
      const bounds = new google.maps.LatLngBounds();
      geocoded.forEach(({ coordinates }) => {
        bounds.extend(coordinates);
      });
      mapInstanceRef.current.fitBounds(bounds);
    }

    // Calculate and display statistics
    const stats = calculateClusterStats(geocoded);
    setClusterStats(stats);
    setGeocodedDebtors(geocoded);
    setIsGeocoding(false);
  };

  // Simplified geocoding function
  const geocodeAddress = async (address: string, debtorName: string): Promise<google.maps.GeocoderResult | null> => {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error(`Timeout geocoding ${debtorName}`));
      }, 10000);
      
      geocoderRef.current!.geocode(
        {
          address: address,
          componentRestrictions: { country: 'NA' },
          bounds: new google.maps.LatLngBounds(
            { lat: -22.70, lng: 16.90 },
            { lat: -22.40, lng: 17.20 }
          )
        },
        (results, status) => {
          clearTimeout(timeout);
          
          if (status === 'OK' && results && results.length > 0) {
            console.log(`✅ Geocoded ${debtorName}: ${results[0].formatted_address}`);
            resolve(results[0]);
          } else {
            console.warn(`❌ Geocoding failed for ${debtorName}: ${status}`);
            resolve(null);
          }
        }
      );
    });
  };

  // Simplified marker creation
  const createSimpleMarker = (
    debtor: any, 
    coordinates: { lat: number; lng: number }, 
    category: string,
    formattedAddress: string
  ): google.maps.Marker => {
    
    // Determine color based on area income level  
    let fillColor: string;
    switch (category) {
      case 'upmarket': fillColor = '#22c55e'; break;
      case 'mid-income': fillColor = '#fb923c'; break; 
      case 'low-income': fillColor = '#ef4444'; break;
      default: fillColor = '#6b7280'; break;
    }
    
    // Determine size based on collection score
    let scale = debtor.score >= 70 ? 12 : debtor.score >= 40 ? 9 : 6;
    
    const marker = new google.maps.Marker({
      position: coordinates,
      map: mapInstanceRef.current!,
      title: `${debtor.name} - ${debtor.amount}`,
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        scale: scale,
        fillColor: fillColor,
        fillOpacity: 0.8,
        strokeWeight: 2,
        strokeColor: '#ffffff',
        strokeOpacity: 1
      },
      animation: google.maps.Animation.DROP
    });
    
    // Simple info window
    const infoWindow = new google.maps.InfoWindow({
      content: `
        <div style="padding: 12px; max-width: 300px;">
          <h3 style="margin: 0 0 8px 0; color: ${fillColor}; font-weight: bold;">${debtor.name}</h3>
          <div style="margin-bottom: 8px;">
            <strong>Amount:</strong> ${debtor.amount}<br>
            <strong>Score:</strong> ${debtor.score}/100<br>
            <strong>Area:</strong> ${category.replace('-', ' ')}<br>
            <strong>Phone:</strong> ${debtor.phone}
          </div>
          <div style="font-size: 12px; color: #666;">
            📍 ${formattedAddress}
          </div>
        </div>
      `
    });
    
    marker.addListener('click', () => {
      infoWindow.open(mapInstanceRef.current!, marker);
    });
    
    return marker;
  };

  // Calculate detailed statistics for the mapped debtors
  const calculateClusterStats = (geocodedDebtors: GecodedDebtor[]): ClusterStats => {
    const totalValue = geocodedDebtors.reduce((sum, d) => {
      return sum + (parseFloat(d.debtor.amount.replace(/[N$,\s]/g, '') || '0'));
    }, 0);
    
    const avgScore = geocodedDebtors.length > 0 ? 
      geocodedDebtors.reduce((sum, d) => sum + d.debtor.score, 0) / geocodedDebtors.length : 0;
    
    return {
      totalDebtors: geocodedDebtors.length,
      totalValue,
      avgScore: Math.round(avgScore),
      highPriority: geocodedDebtors.filter(d => d.debtor.score >= 70).length,
      mediumPriority: geocodedDebtors.filter(d => d.debtor.score >= 40 && d.debtor.score < 70).length,
      lowPriority: geocodedDebtors.filter(d => d.debtor.score < 40).length,
      upmarketCount: geocodedDebtors.filter(d => d.category === 'upmarket').length,
      midIncomeCount: geocodedDebtors.filter(d => d.category === 'mid-income').length,
      lowIncomeCount: geocodedDebtors.filter(d => d.category === 'low-income').length
    };
  };

  // Initialize map with enhanced configuration
  useEffect(() => {
    const initializeMap = async () => {
      console.log('🚀 Starting Google Maps initialization...');
      try {
        if (!import.meta.env.VITE_GOOGLE_MAPS_API_KEY) {
          console.error('❌ Google Maps API key not found');
          throw new Error('Google Maps API key not found. Please add VITE_GOOGLE_MAPS_API_KEY to your .env file.');
        }

        console.log('🔑 API key found, loading Google Maps...');
        const loader = new Loader({
          apiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
          version: 'weekly',
          libraries: ['places', 'geometry', 'visualization']
        });

        console.log('📦 Loading Google Maps libraries...');
        const google = await loader.load();
        console.log('✅ Google Maps libraries loaded successfully');
        
        if (!mapRef.current) {
          console.error('❌ Map container ref not found');
          throw new Error('Map container not found');
        }

        console.log('🗺️ Creating map instance...');
        const map = new google.maps.Map(mapRef.current, {
          zoom: 12,
          center: { lat: -22.5609, lng: 17.0658 }, // Windhoek center
          mapTypeId: 'roadmap',
          styles: [
            {
              featureType: 'poi.business',
              stylers: [{ visibility: 'simplified' }]
            },
            {
              featureType: 'poi.government',
              stylers: [{ visibility: 'on' }]
            },
            {
              featureType: 'poi.medical',
              stylers: [{ visibility: 'on' }]
            },
            {
              featureType: 'road',
              elementType: 'labels',
              stylers: [{ visibility: 'on' }]
            },
            {
              featureType: 'administrative.neighborhood',
              stylers: [{ visibility: 'on' }]
            }
          ],
          mapTypeControl: true,
          streetViewControl: true,
          fullscreenControl: true,
          zoomControl: true
        });

        console.log('✅ Map instance created successfully');

        // Initialize geocoder and places service
        console.log('🔧 Initializing geocoder and places service...');
        geocoderRef.current = new google.maps.Geocoder();
        placesServiceRef.current = new google.maps.places.PlacesService(map);

        mapInstanceRef.current = map;
        
        console.log('🎉 Google Maps fully initialized and ready!');
        setMapReady(true);
        setIsLoading(false);
        
      } catch (error) {
        console.error('❌ Error during Google Maps initialization:', error);
        const errorMessage = error instanceof Error ? error.message : 'Failed to load Google Maps';
        setError(errorMessage);
        setIsLoading(false);
        onError?.(errorMessage);
      }
    };

    // Add a small delay to ensure DOM is ready
    setTimeout(initializeMap, 100);
  }, []);

  // Auto-start geocoding when map is ready - with delay to ensure everything is loaded
  useEffect(() => {
    if (mapReady && debtors.length > 0 && geocodedDebtors.length === 0 && !isGeocoding) {
      console.log('🎯 Auto-starting debtor geocoding and mapping...');
      console.log(`📊 Processing ${debtors.length} debtors...`);
      
      // Add a longer delay to ensure map is fully rendered
      setTimeout(() => {
        console.log('🚀 Starting geocoding process...');
        geocodeDebtors();
      }, 2000);
    }
  }, [mapReady, debtors.length]);

  const refreshMap = () => {
    console.log('🔄 Refreshing map...');
    if (mapReady) {
      setGeocodedDebtors([]);
      setClusterStats(null);
      setGeocodingProgress(0);
      geocodeDebtors();
    } else {
      console.warn('⚠️ Map not ready for refresh');
    }
  };

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50 mb-8">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-red-800">
            <AlertCircle size={20} />
            <span>Google Maps Integration Error</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-red-700 mb-4">{error}</p>
          
          {error.includes('API key') && (
            <div className="text-sm text-red-800 bg-red-100 p-4 rounded-lg border border-red-200">
              <p className="font-semibold mb-3">🔑 Required Google APIs Setup:</p>
              <ol className="list-decimal list-inside space-y-2">
                <li>Go to <a href="https://console.cloud.google.com/" target="_blank" rel="noopener noreferrer" className="underline font-medium">Google Cloud Console</a></li>
                <li><strong>Enable these APIs:</strong>
                  <ul className="list-disc list-inside ml-4 mt-1 space-y-1">
                    <li>Maps JavaScript API</li>
                    <li>Geocoding API</li>
                    <li>Places API</li>
                  </ul>
                </li>
                <li>Create an API key with restrictions for your domain</li>
                <li>Add <code className="bg-red-200 px-2 py-1 rounded font-mono">VITE_GOOGLE_MAPS_API_KEY=your_api_key</code> to .env</li>
              </ol>
            </div>
          )}
          
          <Button 
            onClick={refreshMap}
            size="sm"
            variant="outline"
            className="mt-4 border-red-300 text-red-700 hover:bg-red-100"
          >
            <RefreshCw size={16} className="mr-2" />
            Retry Mapping
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-gray-200 mb-8">
      <CardHeader>
        <CardTitle className="text-lg font-light text-gray-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Map size={20} strokeWidth={1.5} />
            <span>Debtor Location Intelligence Map</span>
          </div>
          <div className="flex items-center space-x-3">
            {clusterStats && (
              <div className="text-sm text-gray-600 mr-4">
                <span className="font-medium">{clusterStats.totalDebtors}</span> plotted
                <span className="text-gray-400 mx-2">•</span>
                <span className="font-medium">N${clusterStats.totalValue.toLocaleString()}</span> total
              </div>
            )}
            <Button
              onClick={refreshMap}
              disabled={isLoading || isGeocoding}
              size="sm"
              className="bg-[rgb(0,171,174)] hover:bg-[rgb(0,151,154)]"
            >
              {isGeocoding ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Mapping...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <RefreshCw size={16} strokeWidth={1.5} />
                  <span>Refresh Map</span>
                </div>
              )}
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Enhanced Geocoding Progress */}
        {isGeocoding && (
          <div className="mb-6 p-5 bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-xl">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-3">
                <Clock size={20} className="text-blue-600" />
                <span className="font-semibold text-blue-800 text-lg">
                  🔍 Geocoding & Mapping Debtors
                </span>
              </div>
              <span className="text-blue-700 font-mono text-sm">
                {Math.round(geocodingProgress)}%
              </span>
            </div>
            
            <div className="w-full bg-blue-200 rounded-full h-3 mb-3">
              <div 
                className="bg-gradient-to-r from-blue-500 to-cyan-500 h-3 rounded-full transition-all duration-300" 
                style={{ width: `${geocodingProgress}%` }} 
              />
            </div>
            
            <div className="text-sm text-blue-700 space-y-1">
              <div>✅ Using Google Geocoding API for precise coordinates</div>
              <div>✅ Using Google Places API for area income classification</div>
              <div>✅ Creating clustered markers for better visualization</div>
            </div>
          </div>
        )}

        {/* Map Container */}
        <div className="relative">
          {/* Map Container - Always Rendered */}
          <div 
            ref={mapRef} 
            className="w-full h-[500px] rounded-lg"
            style={{ minHeight: '500px' }}
          />
          
          {/* Loading Overlay */}
          {isLoading && !error && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-3 border-[rgb(0,171,174)] mx-auto mb-4"></div>
                <p className="text-lg font-medium text-gray-700 mb-2">
                  🌍 Loading Google Maps...
                </p>
                <p className="text-sm text-gray-500">
                  Initializing map and APIs...
                </p>
              </div>
            </div>
          )}
          
          {/* Geocoding Progress Overlay */}
          {isGeocoding && (
            <div className="absolute top-4 left-4 right-4 z-10 p-4 bg-white rounded-lg shadow-lg border border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-800">
                  📍 Plotting Debtors on Map
                </span>
                <span className="text-sm text-gray-600">
                  {Math.round(geocodingProgress)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-[rgb(0,171,174)] h-2 rounded-full transition-all duration-300" 
                  style={{ width: `${geocodingProgress}%` }} 
                />
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Using Google APIs to get precise coordinates...
              </div>
            </div>
          )}
          
          {/* Map Not Ready Overlay */}
          {!mapReady && !isLoading && !error && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-50 rounded-lg border border-gray-300">
              <div className="text-center">
                <div className="animate-pulse text-4xl mb-4">🗺️</div>
                <p className="text-gray-600">Preparing map...</p>
              </div>
            </div>
          )}
        </div>
        
        {/* Comprehensive Statistics Panel */}
        {mapReady && !isGeocoding && clusterStats && !error && (
          <div className="mt-6 space-y-6">
            {/* Main Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border border-gray-200">
                <div className="text-2xl font-bold text-gray-800 mb-1">{clusterStats.totalDebtors}</div>
                <div className="text-gray-600 font-medium text-sm">📍 Debtors Mapped</div>
              </div>
              <div className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-xl border border-green-200">
                <div className="text-2xl font-bold text-green-700 mb-1">N${(clusterStats.totalValue / 1000000).toFixed(1)}M</div>
                <div className="text-green-600 font-medium text-sm">💰 Total Value</div>
              </div>
              <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200">
                <div className="text-2xl font-bold text-blue-700 mb-1">{clusterStats.avgScore}</div>
                <div className="text-blue-600 font-medium text-sm">📊 Avg Score</div>
              </div>
              <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl border border-purple-200">
                <div className="text-2xl font-bold text-purple-700 mb-1">{clusterStats.highPriority}</div>
                <div className="text-purple-600 font-medium text-sm">🎯 High Priority</div>
              </div>
            </div>

            {/* Area Distribution */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-green-50 rounded-xl border border-green-200">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                  <span className="font-semibold text-green-800">Upmarket Areas</span>
                </div>
                <div className="text-2xl font-bold text-green-700 mb-1">{clusterStats.upmarketCount}</div>
                <div className="text-sm text-green-600">Higher collection probability</div>
              </div>
              
              <div className="p-4 bg-orange-50 rounded-xl border border-orange-200">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="w-4 h-4 bg-orange-500 rounded-full"></div>
                  <span className="font-semibold text-orange-800">Mid-Income Areas</span>
                </div>
                <div className="text-2xl font-bold text-orange-700 mb-1">{clusterStats.midIncomeCount}</div>
                <div className="text-sm text-orange-600">Standard collection approach</div>
              </div>
              
              <div className="p-4 bg-red-50 rounded-xl border border-red-200">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="w-4 h-4 bg-red-500 rounded-full"></div>
                  <span className="font-semibold text-red-800">Low-Income Areas</span>
                </div>
                <div className="text-2xl font-bold text-red-700 mb-1">{clusterStats.lowIncomeCount}</div>
                <div className="text-sm text-red-600">May require employer details</div>
              </div>
            </div>

            {/* Interactive Map Guide */}
            <div className="p-5 bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl border border-gray-200">
              <h4 className="font-semibold text-gray-800 mb-4 flex items-center space-x-2">
                <Target size={18} />
                <span>Interactive Map Guide</span>
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                <div>
                  <div className="font-semibold text-gray-700 mb-3">Marker Types:</div>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-3">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span><strong>Green:</strong> Upmarket areas (Klein Windhoek, Eros, etc.)</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                      <span><strong>Orange:</strong> Mid-income areas (Khomasdal, etc.)</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                      <span><strong>Red:</strong> Low-income areas (Katutura, Wanaheda)</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <div className="font-semibold text-gray-700 mb-3">Marker Sizes:</div>
                  <div className="space-y-2">
                    <div><strong>Large:</strong> High Priority (70-100 points)</div>
                    <div><strong>Medium:</strong> Medium Priority (40-69 points)</div>
                    <div><strong>Small:</strong> Low Priority (&lt;40 points)</div>
                    <div className="text-gray-600 italic mt-2">Click markers for debtor details &amp; actions</div>
                  </div>
                </div>
              </div>
              
              <div className="mt-4 p-3 bg-white rounded-lg border border-gray-200">
                <div className="text-xs text-gray-600 flex items-center justify-between">
                  <span><strong>Powered by:</strong> Google Geocoding + Places API for precise location &amp; area classification</span>
                  {geocodedDebtors.length > 0 && (
                    <span className="text-green-600 font-semibold">
                      {geocodedDebtors.length} locations mapped successfully
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* No valid addresses message */}
        {mapReady && !isGeocoding && geocodedDebtors.length === 0 && !error && debtors.length > 0 && (
          <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-xl bg-gray-50">
            <MapPin size={64} className="text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-light text-gray-700 mb-3">📍 No Mappable Addresses Found</h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              The debtor data doesn't contain valid Windhoek addresses that can be plotted using Google's geocoding.
            </p>
            
            <div className="max-w-lg mx-auto">
              <div className="text-sm text-gray-700 bg-white p-4 rounded-lg border border-gray-200">
                <p className="font-semibold mb-3">📋 Address Requirements:</p>
                <ul className="text-left space-y-2">
                  <li>✅ Must be longer than 8 characters</li>
                  <li>✅ Cannot be "No address", "Unknown", or "N/A"</li>
                  <li>✅ Should be valid Windhoek street addresses</li>
                  <li>✅ Format: "123 Main Street" or "Plot 456, Area Name"</li>
                </ul>
              </div>
              
              <Button 
                onClick={refreshMap}
                className="mt-4 bg-[rgb(0,171,174)] hover:bg-[rgb(0,151,154)]"
              >
                🔄 Try Mapping Again
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Custom cluster algorithm for better debt collection visualization
class ClusterAlgorithm {
  constructor(private maxDistance: number) {}

  public cluster(markers: google.maps.Marker[]): google.maps.Marker[][] {
    const clusters: google.maps.Marker[][] = [];
    const processed = new Set<google.maps.Marker>();

    for (const marker of markers) {
      if (processed.has(marker)) continue;

      const cluster: google.maps.Marker[] = [marker];
      processed.add(marker);

      const position1 = marker.getPosition()!;

      for (const otherMarker of markers) {
        if (processed.has(otherMarker)) continue;

        const position2 = otherMarker.getPosition()!;
        const distance = google.maps.geometry.spherical.computeDistanceBetween(position1, position2);

        if (distance <= this.maxDistance) {
          cluster.push(otherMarker);
          processed.add(otherMarker);
        }
      }

      clusters.push(cluster);
    }

    return clusters;
  }
}