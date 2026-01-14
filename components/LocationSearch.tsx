import React, { useState, useEffect, useRef } from 'react';
import { useJsApiLoader } from '@react-google-maps/api';
import { useThemeStyles, NeuInput } from './NeuComponents';
import { Search, Loader2, MapPin } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const libraries: ("places")[] = ["places"];

interface LocationSearchProps {
  value: string;
  onChange: (address: string, smartLabel?: string, details?: google.maps.places.PlaceResult) => void;
  placeholder?: string;
}

export const LocationSearch: React.FC<LocationSearchProps> = ({ value, onChange, placeholder }) => {
  const { styles } = useThemeStyles();
  const [inputValue, setInputValue] = useState(value);
  const [predictions, setPredictions] = useState<google.maps.places.AutocompletePrediction[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [isResolving, setIsResolving] = useState(false);

  // Google Services Refs
  const autocompleteService = useRef<google.maps.places.AutocompleteService | null>(null);
  const placesService = useRef<google.maps.places.PlacesService | null>(null);
  const sessionToken = useRef<google.maps.places.AutocompleteSessionToken | null>(null);
  const dummyDiv = useRef<HTMLDivElement | null>(null); // Required for PlacesService

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_KEY || "",
    libraries,
    id: 'google-map-script',
    nonce: 'google-map-script',
  });

  useEffect(() => {
    if (!import.meta.env.VITE_GOOGLE_MAPS_KEY) {
      console.error("🚨 CRITICAL: VITE_GOOGLE_MAPS_KEY is missing from environment variables. Please check .env.local and restart your dev server.");
    }
    if (loadError) {
      console.error("🚨 Google Maps Load Error:", loadError);
    }
  }, [loadError]);

  // Initialize Services
  useEffect(() => {
    if (isLoaded && window.google && !autocompleteService.current) {
      autocompleteService.current = new google.maps.places.AutocompleteService();
      sessionToken.current = new google.maps.places.AutocompleteSessionToken();
      // PlacesService is no longer needed for the new Place API
    }
  }, [isLoaded]);

  // Sync Input with Value Prop (Fixes "Business Name vs Address" issue)
  useEffect(() => {
    setInputValue(value);
  }, [value]);

  // Fetch Predictions (Debounced)
  useEffect(() => {
    if (!inputValue || inputValue === value) {
      setPredictions([]);
      return;
    }

    const timer = setTimeout(() => {
      if (autocompleteService.current && inputValue.length > 2) {
        autocompleteService.current.getPlacePredictions(
          {
            input: inputValue,
            sessionToken: sessionToken.current || undefined,
            // types: [], // REMOVED: No restrictions. Search everything.
          },
          (results, status) => {
            console.log('📍 Maps API Status:', status);
            // console.log('📍 Maps API Results:', results);

            if (status === google.maps.places.PlacesServiceStatus.OK && results) {
              setPredictions(results);
              setShowDropdown(true);
            } else {
              if (status === google.maps.places.PlacesServiceStatus.ZERO_RESULTS) {
                console.warn('📍 Zero results found for:', inputValue);
              } else if (status === google.maps.places.PlacesServiceStatus.REQUEST_DENIED) {
                console.error('🚨 API Request Denied. Check your API Key and billing.');
              }
              setPredictions([]);
            }
          }
        );
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [inputValue, value]);

  const handleSelect = async (prediction: google.maps.places.AutocompletePrediction) => {
    // 1. Show the user what they clicked, but indicate we are processing
    setInputValue(prediction.description);
    setShowDropdown(false);
    setIsResolving(true); // Start loading state

    try {
      if (!window.google?.maps?.places?.Place) {
        throw new Error("Google Maps Places API (New) is not available. Please enable it in Google Cloud Console.");
      }

      // Use the new Place class
      const place = new google.maps.places.Place({
        id: prediction.place_id,
        requestedLanguage: 'en', // Optional: enforce language
      });

      // Fetch details using the new API
      // Note: 'geometry' is needed for location, 'addressComponents' for parsing
      await place.fetchFields({
        fields: ['displayName', 'formattedAddress', 'addressComponents', 'location'],
      });

      setIsResolving(false); // Stop loading state

      // 2. ROBUST ADDRESS EXTRACTION
      // The new API uses camelCase property names
      let streetNumber = '';
      let route = '';
      let city = '';
      let state = '';
      let country = '';
      let postalCode = '';

      place.addressComponents?.forEach(component => {
        const types = component.types;
        if (types.includes('street_number')) streetNumber = component.longText;
        if (types.includes('route')) route = component.longText;
        if (types.includes('locality')) city = component.longText;
        if (types.includes('administrative_area_level_1')) state = component.shortText;
        if (types.includes('country')) country = component.longText;
        if (types.includes('postal_code')) postalCode = component.longText;
      });

      // Fallback for city
      if (!city) {
        place.addressComponents?.forEach(component => {
          if (component.types.includes('postal_town') || component.types.includes('sublocality')) {
            city = component.longText;
          }
        });
      }

      // Construct the clean address
      let cleanAddress = place.formattedAddress || '';
      if (streetNumber && route) {
        cleanAddress = `${streetNumber} ${route}, ${city}, ${state}`;
      } else if (route) {
        cleanAddress = `${route}, ${city}, ${state}`;
      }

      // 3. Smart Label Logic
      let smartLabel = '';
      if (city && state) smartLabel = `${city}, ${state}`;
      else if (city && country) smartLabel = `${city}, ${country}`;
      else smartLabel = cleanAddress;

      // 4. FORCE UPDATE
      setInputValue(cleanAddress);

      // Map the new Place result to the expected interface if needed, or pass the Place object directly
      // The parent component expects 'google.maps.places.PlaceResult', but 'Place' is different.
      // We might need to cast or adapt if the parent relies on specific old fields.
      // For now, we'll pass the place object and let the parent handle it or adapt types.
      // Since the interface says `details?: google.maps.places.PlaceResult`, we might need to mock it or update the interface.
      // However, for this refactor, we will try to pass the new Place object as any to avoid breaking types immediately,
      // or better, construct a compatible object.

      // Constructing a compatible result to avoid breaking parent components that expect PlaceResult
      const compatibleResult: any = {
        name: place.displayName,
        formatted_address: place.formattedAddress,
        address_components: place.addressComponents?.map(c => ({
          long_name: c.longText,
          short_name: c.shortText,
          types: c.types
        })),
        geometry: {
          location: place.location,
          viewport: place.viewport
        }
      };

      onChange(cleanAddress, smartLabel, compatibleResult);

    } catch (error) {
      console.error('🚨 Failed to get place details:', error);
      setIsResolving(false);
      // Keep the description they clicked
    }
  };

  const handleBlur = () => {
    setTimeout(() => setShowDropdown(false), 200);
  };

  if (!isLoaded) return <NeuInput placeholder="Loading Maps..." disabled />;

  return (
    <div className="relative">
      <div ref={dummyDiv} className="hidden"></div>

      <div className="relative">
        <NeuInput
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onFocus={() => { if (predictions.length > 0) setShowDropdown(true); }}
          onBlur={handleBlur}
          placeholder={placeholder || "Search Google Maps..."}
          className="pl-10"
          // Visual cue if we are resolving the address, and taller to show full address
          style={{ minHeight: '3rem', ...(isResolving ? { opacity: 0.7 } : {}) }}
        />
        <div className={`absolute left-3 top-3.5 ${styles.textSub}`}>
          {isResolving ? <Loader2 size={18} className="animate-spin text-brand" /> : <MapPin size={18} />}
        </div>

        {/* Helper Text during resolution */}
        {isResolving && (
          <div className="absolute right-3 top-3.5 text-[10px] text-brand font-bold animate-pulse">
            GETTING ADDRESS...
          </div>
        )}
      </div>

      <AnimatePresence>
        {showDropdown && predictions.length > 0 && (
          <motion.div
            layout
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className={`relative w-full mt-3 overflow-hidden rounded-xl ${styles.bg} ${styles.shadowOut} border border-white/10`}
          >
            {predictions.map((prediction) => (
              <button
                key={prediction.place_id}
                onClick={() => handleSelect(prediction)}
                className={`w-full text-left px-4 py-3 flex items-start gap-3 hover:bg-black/5 transition-colors group border-b ${styles.border} last:border-0`}
              >
                <div className={`mt-1 p-1.5 rounded-full ${styles.shadowIn} text-brand`}>
                  <MapPin size={12} />
                </div>
                <div>
                  <div className={`text-sm font-bold ${styles.textMain} group-hover:text-brand transition-colors`}>
                    {prediction.structured_formatting.main_text}
                  </div>
                  <div className={`text-xs ${styles.textSub}`}>
                    {prediction.structured_formatting.secondary_text}
                  </div>
                </div>
              </button>
            ))}
            <div className="px-3 py-1.5 flex justify-end">
              <span className="text-[9px] text-gray-400 flex items-center gap-1 opacity-60">
                Powered by <img src="https://maps.gstatic.com/mapfiles/api-3/images/google_white5_hdpi.png" alt="Google" className="h-3" />
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};