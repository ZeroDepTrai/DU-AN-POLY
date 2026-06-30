import { useEffect, useState } from "react";
import { CircleMarker, MapContainer, TileLayer, useMapEvents } from "react-leaflet";

interface AdminMapPickerProps {
  lat: number;
  lng: number;
  onChange: (lat: number, lng: number) => void;
}

function DraggableMarker({
  lat,
  lng,
  onChange,
}: {
  lat: number;
  lng: number;
  onChange: (lat: number, lng: number) => void;
}) {
  const map = useMapEvents({
    click(e) {
      onChange(e.latlng.lat, e.latlng.lng);
      map.flyTo([e.latlng.lat, e.latlng.lng], map.getZoom());
    },
  });

  return (
    <CircleMarker
      center={[lat, lng]}
      radius={10}
      pathOptions={{ color: "#D94A63", fillColor: "#D94A63", fillOpacity: 1 }}
      // @ts-ignore - draggable prop not in types but works at runtime
      draggable
      eventHandlers={{
        dragend(e) {
          const marker = e.target;
          const pos = marker.getLatLng();
          onChange(pos.lat, pos.lng);
        },
      }}
    />
  );
}

export default function AdminMapPicker({ lat, lng, onChange }: AdminMapPickerProps) {
  const [position, setPosition] = useState({ lat, lng });

  useEffect(() => {
    setPosition({ lat, lng });
  }, [lat, lng]);

  const handleChange = (newLat: number, newLng: number) => {
    setPosition({ lat: newLat, lng: newLng });
    onChange(newLat, newLng);
  };

  return (
    <div className="h-64 rounded-xl border border-gunmetal/60 overflow-hidden">
      <MapContainer center={[position.lat, position.lng]} zoom={13} scrollWheelZoom>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <DraggableMarker lat={position.lat} lng={position.lng} onChange={handleChange} />
      </MapContainer>
    </div>
  );
}
