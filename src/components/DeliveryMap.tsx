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
      title: "Loja FB Tabacaria",
      alt: "Loja FB Tabacaria",
    })
      .bindPopup("<strong>Loja FB Tabacaria</strong><br>Saída das entregas")
      .addTo(map);

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
    const ok = ({ coords }: GeolocationPosition) => {
      setLocating(false);
      onSelectRef.current({ lat: coords.latitude, lon: coords.longitude });
    };
    const explain = (err: GeolocationPositionError) => {
      setLocating(false);
      setGeoError(
        err.code === err.PERMISSION_DENIED
          ? "A localização está bloqueada. Libere o acesso à localização no navegador (ícone ao lado do endereço do site) ou toque no mapa."
          : "Não conseguimos achar sua localização agora. Ligue o GPS e tente de novo, ou toque no mapa.",
      );
    };
    // Tenta com GPS; se demorar ou falhar, tenta de novo com a localização aproximada.
    navigator.geolocation.getCurrentPosition(ok, (err) => {
      if (err.code === err.PERMISSION_DENIED) return explain(err);
      navigator.geolocation.getCurrentPosition(ok, explain, { enableHighAccuracy: false, timeout: 15000, maximumAge: 300000 });
    }, { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 });
  };

  return (
    <div className="space-y-3">
      <Button type="button" variant="outline" className="w-full" onClick={useCurrentLocation} disabled={locating}>
        {locating ? <Loader2 className="animate-spin" /> : <Crosshair />}
        {locating ? "Obtendo localização..." : "Usar minha localização atual"}
      </Button>
      {geoError && <p className="text-sm text-destructive">{geoError}</p>}
      <div ref={elementRef} className="h-[55vh] min-h-[280px] max-h-[460px] w-full rounded-lg border border-border" aria-label="Mapa para escolher o local de entrega" />
      <p className="text-xs text-muted-foreground">Toque no mapa ou arraste o marcador roxo. O marcador verde é a loja.</p>
    </div>
  );
}
