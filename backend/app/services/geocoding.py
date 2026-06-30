import httpx

NOMINATIM_URL = "https://nominatim.openstreetmap.org/search"


async def geocode_address(address: str) -> tuple[float, float]:
    params = {"q": address, "format": "json", "limit": 1}
    headers = {"User-Agent": "PhoneStoreMVP/1.0 (contact@phone-store.com)"}

    async with httpx.AsyncClient(timeout=15.0) as client:
        response = await client.get(NOMINATIM_URL, params=params, headers=headers)
        response.raise_for_status()
        results = response.json()

    if not results:
        raise ValueError("Could not geocode delivery address")

    return float(results[0]["lat"]), float(results[0]["lon"])
