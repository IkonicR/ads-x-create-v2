import React, { useState, useEffect, useRef } from 'react';
import { useLoadScript } from '@react-google-maps/api';
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

  // Google Services Refs
  const autocompleteService = useRef<google.maps.places.AutocompleteService | null>(null);
  const placesService = useRef<google.maps.places.PlacesService | null>(null);
  const sessionToken = useRef<google.maps.places.AutocompleteSessionToken | null>(null);
  const dummyDiv = useRef<HTMLDivElement | null>(null); // Required for PlacesService

  const { isLoaded } = useLoadScript({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_KEY,
    libraries,
  });

  // Initialize Services
  useEffect(() => {
    if (isLoaded && window.google && !autocompleteService.current) {
      autocompleteService.current = new google.maps.places.AutocompleteService();
      sessionToken.current = new google.maps.places.AutocompleteSessionToken();
      if (dummyDiv.current) {
        placesService.current = new google.maps.places.PlacesService(dummyDiv.current);
      }
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
            console.log('📍 Maps API Results:', results);

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

  const [isResolving, setIsResolving] = useState(false);

  // ... (existing useEffects)

  const handleSelect = (prediction: google.maps.places.AutocompletePrediction) => {
    // 1. Show the user what they clicked, but indicate we are processing
    setInputValue(prediction.description);
    setShowDropdown(false);
    setIsResolving(true); // Start loading state

    if (placesService.current) {
      const request: google.maps.places.PlaceDetailsRequest = {
        placeId: prediction.place_id,
        fields: ['name', 'formatted_address', 'address_components', 'geometry'],
        sessionToken: sessionToken.current || undefined,
      };

      placesService.current.getDetails(request, (place, status) => {
        setIsResolving(false); // Stop loading state

        if (status === google.maps.places.PlacesServiceStatus.OK && place) {
          console.log('📍 Place Details:', place); // Diagnostic Log

          // 2. ROBUST ADDRESS EXTRACTION
          // We want "123 Main St, City, State" NOT "Starbucks, 123 Main St..."
          let streetNumber = '';
          let route = '';
          let city = '';
          let state = '';
          let country = '';
          let postalCode = '';

          place.address_components?.forEach(component => {
            const types = component.types;
            if (types.includes('street_number')) streetNumber = component.long_name;
            if (types.includes('route')) route = component.long_name;
            if (types.includes('locality')) city = component.long_name;
            if (types.includes('administrative_area_level_1')) state = component.short_name;
            if (types.includes('country')) country = component.long_name;
            if (types.includes('postal_code')) postalCode = component.long_name;
          });

          // Fallback for city if locality is missing
          if (!city) {
            place.address_components?.forEach(component => {
              if (component.types.includes('postal_town') || component.types.includes('sublocality')) {
                city = component.long_name;
              }
            });
          }

          // Construct the clean address
          let cleanAddress = place.formatted_address || '';
          if (streetNumber && route) {
            cleanAddress = `${streetNumber} ${route}, ${city}, ${state}`;
          } else if (route) {
            cleanAddress = `${route}, ${city}, ${state}`;
          }

          // 3. Smart Label Logic (for the UI display elsewhere)
          let smartLabel = '';
          if (city && state) smartLabel = `${city}, ${state}`;
          else if (city && country) smartLabel = `${city}, ${country}`;
          else smartLabel = cleanAddress;

          // 4. FORCE UPDATE
          // Explicitly update input to the clean address, overriding the business name
          setInputValue(cleanAddress);
          onChange(cleanAddress, smartLabel, place);

        } else {
          console.error('🚨 Failed to get place details:', status);
          // Revert to what they clicked if details fail, but warn?
          // For now, leave it as the description they clicked.
        }
      });
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
          // Visual cue if we are resolving the address
          style={isResolving ? { opacity: 0.7 } : {}}
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