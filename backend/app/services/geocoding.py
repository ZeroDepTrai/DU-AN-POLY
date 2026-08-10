import httpx

NOMINATIM_URL = "https://nominatim.openstreetmap.org/search"

# Vietnam bounding box (south, west, north, east)
VN_BOUNDS = {"lat_min": 8.0, "lat_max": 23.5, "lon_min": 102.0, "lon_max": 110.0}


def _in_vietnam(lat: float, lon: float) -> bool:
    return (
        VN_BOUNDS["lat_min"] <= lat <= VN_BOUNDS["lat_max"]
        and VN_BOUNDS["lon_min"] <= lon <= VN_BOUNDS["lon_max"]
    )


async def geocode_address(address: str) -> tuple[float, float, bool]:
    """
    Returns (lat, lng, verified).
    - verified=True  : Nominatim returned a point inside Vietnam.
    - verified=False : geocoding failed or returned a point outside Vietnam;
                       the caller should fall back to a default location.
    """
    params = {
        "q": f"{address}, Vietnam",
        "format": "json",
        "limit": 1,
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
        return 0.0, 0.0, False

    if not results:
        return 0.0, 0.0, False

    lat = float(results[0]["lat"])
    lon = float(results[0]["lon"])

    if not _in_vietnam(lat, lon):
        # Point found but outside Vietnam — treat as unverified.
        return 0.0, 0.0, False

    return lat, lon, True
