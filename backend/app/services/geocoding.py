import httpx

NOMINATIM_URL = "https://nominatim.openstreetmap.org/search"

# Vietnam bounding box (south, west, north, east)
VN_BOUNDS = {"lat_min": 8.0, "lat_max": 23.5, "lon_min": 102.0, "lon_max": 110.0}


def _in_vietnam(lat: float, lon: float) -> bool:
    return (
        VN_BOUNDS["lat_min"] <= lat <= VN_BOUNDS["lat_max"]
        and VN_BOUNDS["lon_min"] <= lon <= VN_BOUNDS["lon_max"]
    )


async def geocode_address(
    address: str,
    fallback_lat: float | None = None,
    fallback_lng: float | None = None,
) -> tuple[float, float, bool]:
    """
    Returns (lat, lng, verified).

    - verified=True  : Nominatim found a point inside Vietnam.
    - verified=False : geocoding failed or found a point outside Vietnam;
                       lat/lng fall back to fallback_lat/fallback_lng (or 0/0 if
                       those are also not provided).

    Using the store's own coords as the fallback means that if the delivery
    address cannot be geocoded, the map destination pin lands on the store
    instead of (0, 0) in the ocean — still wrong, but not a broken route.
    The verified=False flag lets callers (and the frontend) show a warning.
    """
    # Try a precise query scoped to Vietnam
    params = {
        "q": f"{address}, Vietnam",
        "format": "json",
        "limit": 1,
        "addressdetails": 1,
        "viewbox": f"{VN_BOUNDS['lon_min']},{VN_BOUNDS['lat_max']},{VN_BOUNDS['lon_max']},{VN_BOUNDS['lat_min']}",
        "bounded": 1,
    }
    headers = {"User-Agent": "PhoneStoreMVP/1.0 (contact@phone-store.com)"}

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.get(NOMINATIM_URL, params=params, headers=headers)
            response.raise_for_status()
            results = response.json()
    except Exception:
        # Network error / timeout
        return (fallback_lat or 0.0), (fallback_lng or 0.0), False

    if not results:
        # Nominatim found nothing
        return (fallback_lat or 0.0), (fallback_lng or 0.0), False

    lat = float(results[0]["lat"])
    lon = float(results[0]["lon"])

    if not _in_vietnam(lat, lon):
        # Found a result but it's outside Vietnam (e.g. "Bình Dương" → Philippines)
        return (fallback_lat or 0.0), (fallback_lng or 0.0), False

    return lat, lon, True
