import React, { useState, useEffect, useRef } from 'react';
import { useLoadScript } from '@react-google-maps/api';
import { useThemeStyles, NeuInput } from './NeuComponents';
import { Search, Loader2, MapPin } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const libraries: ("places")[] = ["places"];

interface LocationSearchProps {
  value: string;
  onChange: (address: string, smartLabel?: string) => void;
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
          },
          (results, status) => {
            if (status === google.maps.places.PlacesServiceStatus.OK && results) {
              setPredictions(results);
              setShowDropdown(true);
            } else {
              setPredictions([]);
            }
          }
        );
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [inputValue, value]);

  const handleSelect = (prediction: google.maps.places.AutocompletePrediction) => {
    setInputValue(prediction.description);
    setShowDropdown(false);
    setIsLoadingDetails(true);

    if (placesService.current) {
      const request: google.maps.places.PlaceDetailsRequest = {
        placeId: prediction.place_id,
        fields: ['name', 'formatted_address', 'address_components'],
        sessionToken: sessionToken.current || undefined,
      };

      placesService.current.getDetails(request, (place, status) => {
        setIsLoadingDetails(false);
        if (status === google.maps.places.PlacesServiceStatus.OK && place && place.formatted_address) {
          const fullAddress = place.formatted_address;
          
          // Regenerate Session Token after a complete search cycle
          sessionToken.current = new google.maps.places.AutocompleteSessionToken();

          // Smart Label Logic
          let city = '';
          let region = '';
          let country = '';

          place.address_components?.forEach(component => {
            if (component.types.includes('locality')) city = component.long_name;
            if (component.types.includes('administrative_area_level_1')) region = component.long_name;
            if (component.types.includes('country')) country = component.long_name;
          });

          if (!city) {
             place.address_components?.forEach(component => {
               if (component.types.includes('postal_town') || component.types.includes('administrative_area_level_2')) {
                 city = component.long_name;
               }
             });
          }

          let smartLabel = '';
          if (city && region) smartLabel = `${city}, ${region}`;
          else if (city && country) smartLabel = `${city}, ${country}`;
          else if (region && country) smartLabel = `${region}, ${country}`;
          else smartLabel = fullAddress;

          onChange(fullAddress, smartLabel);
        }
      });
    }
  };

  const handleBlur = () => {
    // Small delay to allow click event to fire on dropdown
    setTimeout(() => setShowDropdown(false), 200);
  };

  if (!isLoaded) return <NeuInput placeholder="Loading Maps..." disabled />;

  return (
    <div className="relative">
      <div ref={dummyDiv} className="hidden"></div> {/* Hidden div for PlacesService */}
      
      <div className="relative">
        <NeuInput
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onFocus={() => { if (predictions.length > 0) setShowDropdown(true); }}
          onBlur={handleBlur}
          placeholder={placeholder || "Search Google Maps..."}
          className="pl-10"
        />
        <div className={`absolute left-3 top-3.5 ${styles.textSub}`}>
          {isLoadingDetails ? <Loader2 size={18} className="animate-spin text-[#6D5DFC]" /> : <MapPin size={18} />}
        </div>
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
                <div className={`mt-1 p-1.5 rounded-full ${styles.shadowIn} text-[#6D5DFC]`}>
                   <MapPin size={12} />
                </div>
                <div>
                  <div className={`text-sm font-bold ${styles.textMain} group-hover:text-[#6D5DFC] transition-colors`}>
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