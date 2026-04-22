import { useEffect, useRef, useState } from "react";

import { Input } from "@/components/ui/input";

declare global {
  interface Window {
    google?: {
      maps?: {
        places?: {
          Autocomplete: new (input: HTMLInputElement, options?: Record<string, unknown>) => {
            addListener: (eventName: string, callback: () => void) => void;
            getPlace: () => { formatted_address?: string; name?: string };
          };
        };
      };
    };
  }
}

const GOOGLE_SCRIPT_ID = "google-places-autocomplete";
const googlePlacesKey = import.meta.env.VITE_GOOGLE_PLACES_API_KEY || import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

const loadGooglePlaces = () => {
  if (!googlePlacesKey || window.google?.maps?.places) return;
  if (document.getElementById(GOOGLE_SCRIPT_ID)) return;

  const script = document.createElement("script");
  script.id = GOOGLE_SCRIPT_ID;
  script.src = `https://maps.googleapis.com/maps/api/js?key=${googlePlacesKey}&libraries=places`;
  script.async = true;
  document.head.appendChild(script);
};

interface AddressSearchInputProps {
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

const AddressSearchInput = ({ value = "", onChange, placeholder = "Search address or enter manually", className }: AddressSearchInputProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [placesReady, setPlacesReady] = useState(false);

  useEffect(() => {
    loadGooglePlaces();
    const timer = window.setInterval(() => {
      if (window.google?.maps?.places) {
        setPlacesReady(true);
        window.clearInterval(timer);
      }
    }, 250);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!placesReady || !inputRef.current || !window.google?.maps?.places) return;
    const autocomplete = new window.google.maps.places.Autocomplete(inputRef.current, {
      componentRestrictions: { country: "au" },
      fields: ["formatted_address", "name"],
      types: ["address"],
    });
    autocomplete.addListener("place_changed", () => {
      const place = autocomplete.getPlace();
      onChange(place.formatted_address || place.name || inputRef.current?.value || "");
    });
  }, [onChange, placesReady]);

  return (
    <Input
      ref={inputRef}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      className={className}
    />
  );
};

export default AddressSearchInput;