import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import { Crosshair, Loader2 } from "lucide-react";
import "leaflet/dist/leaflet.css";
import { Button } from "@/components/ui/button";
import { ORIGIN, type DeliveryPoint } from "@/lib/delivery";

type Props = {
  selected: DeliveryPoint | null;
  onSelect: (point: DeliveryPoint) => void;
};

export default function DeliveryMap({ selected, onSelect }: Props) {
  const elementRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const onSelectRef = useRef(onSelect);
  const initialSelectedRef = useRef(selected);
  const [locating, setLocating] = useState(false);
  const [geoError, setGeoError] = useState("");

  useEffect(() => {
    onSelectRef.current = onSelect;
  }, [onSelect]);

  useEffect(() => {
    if (!elementRef.current) return;
    const initial = initialSelectedRef.current ?? ORIGIN;
    const map = L.map(elementRef.current).setView([initial.lat, initial.lon], initialSelectedRef.current ? 16 : 14);
    mapRef.current = map;

    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

    const originIcon = L.divIcon({
      className: "delivery-map-icon",
      html: '<span class="delivery-map-pin delivery-map-pin--origin"></span>',
      iconSize: [24, 24],
      iconAnchor: [12, 12],
    });
    L.marker([ORIGIN.lat, ORIGIN.lon], {
      icon: originIcon,
      interactive: false,
      title: "Saída da entrega",
    }).addTo(map);

    map.on("click", (event: L.LeafletMouseEvent) => {
      onSelectRef.current({ lat: event.latlng.lat, lon: event.latlng.lng });
    });

    const resizeTimer = window.setTimeout(() => map.invalidateSize(), 50);
    return () => {
      window.clearTimeout(resizeTimer);
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (!selected) {
      markerRef.current?.remove();
      markerRef.current = null;
      return;
    }

    if (!markerRef.current) {
      const destinationIcon = L.divIcon({
        className: "delivery-map-icon",
        html: '<span class="delivery-map-pin delivery-map-pin--destination"></span>',
        iconSize: [30, 30],
        iconAnchor: [15, 15],
      });
      markerRef.current = L.marker([selected.lat, selected.lon], {
        icon: destinationIcon,
        draggable: true,
        title: "Local de entrega; arraste para ajustar",
        alt: "Local de entrega",
      }).addTo(map);
      markerRef.current.on("dragend", () => {
        const point = markerRef.current?.getLatLng();
        if (point) onSelectRef.current({ lat: point.lat, lon: point.lng });
      });
    } else {
      markerRef.current.setLatLng([selected.lat, selected.lon]);
    }
    map.panTo([selected.lat, selected.lon], { animate: false });
  }, [selected]);

  const useCurrentLocation = () => {
    setGeoError("");
    if (!navigator.geolocation) {
      setGeoError("Seu navegador não oferece localização atual.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setLocating(false);
        onSelectRef.current({ lat: coords.latitude, lon: coords.longitude });
      },
      () => {
        setLocating(false);
        setGeoError("Não foi possível obter sua localização. Permita o acesso ou toque no mapa.");
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 },
    );
  };

  return (
    <div className="space-y-3">
      <Button type="button" variant="outline" className="w-full" onClick={useCurrentLocation} disabled={locating}>
        {locating ? <Loader2 className="animate-spin" /> : <Crosshair />}
        {locating ? "Obtendo localização..." : "Usar minha localização atual"}
      </Button>
      {geoError && <p className="text-sm text-destructive">{geoError}</p>}
      <div ref={elementRef} className="h-[360px] w-full rounded-lg border border-border" aria-label="Mapa para escolher o local de entrega" />
      <p className="text-xs text-muted-foreground">Toque no mapa ou arraste o marcador roxo. O marcador verde é a saída da entrega.</p>
    </div>
  );
}
