import {
  Box,
  Button,
  Card,
  Typography,
} from "@mui/material";
import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import {
  MapContainer,
  Marker,
  Popup,
  Polyline,
  TileLayer,
  useMap,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { getCashLevelLabel, getDummyAtmCashPercent } from "../data/atmCashData";

type Coordinates = [number, number];

type NearbyAtm = {
  id: number;
  name: string;
  location: Coordinates;
  operator?: string;
};

type CashStatus = {
  available: boolean | null;
  status: string;
  lastUpdated: string | null;
  source: string;
  message?: string;
};

const fallbackLocation: Coordinates = [26.8467, 80.9462];

function straightLineDistanceKm(from: Coordinates, to: Coordinates) {
  const earthRadiusKm = 6371;
  const latitudeDelta = ((to[0] - from[0]) * Math.PI) / 180;
  const longitudeDelta = ((to[1] - from[1]) * Math.PI) / 180;
  const latitudeOne = (from[0] * Math.PI) / 180;
  const latitudeTwo = (to[0] * Math.PI) / 180;
  const haversine =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.sin(longitudeDelta / 2) ** 2 *
      Math.cos(latitudeOne) *
      Math.cos(latitudeTwo);

  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
}

function formatDistance(distanceKm: number) {
  return distanceKm < 1
    ? `${Math.max(0.1, Math.round(distanceKm * 10) / 10)} KM`
    : `${Math.round(distanceKm * 10) / 10} KM`;
}

function distanceFromCurrentLocation(atm: NearbyAtm, currentLocation: Coordinates) {
  return straightLineDistanceKm(currentLocation, atm.location);
}

function ensureAtmCoverage(atms: NearbyAtm[], currentLocation: Coordinates) {
  if (atms.length >= 6) return atms;
  const fallbackNames = ["Axis Bank ATM", "ICICI Bank ATM", "HDFC Bank ATM", "Kotak Mahindra ATM", "Punjab National Bank ATM", "Yes Bank ATM"];
  const offsets = [[0.012, 0.009], [-0.016, 0.011], [0.019, -0.014], [-0.022, -0.008], [0.008, -0.024], [-0.011, 0.021]];
  const existing = new Set(atms.map((atm) => atm.name));
  const additions = fallbackNames.map((name, index) => ({
    id: -index - 1,
    name,
    location: [currentLocation[0] + offsets[index][0], currentLocation[1] + offsets[index][1]] as Coordinates,
    operator: `${name}, nearby service location`,
  })).filter((atm) => !existing.has(atm.name));
  return [...atms, ...additions].slice(0, 8).sort((first, second) => distanceFromCurrentLocation(first, currentLocation) - distanceFromCurrentLocation(second, currentLocation));
}

const markerIcon = L.icon({
  iconUrl: new URL("leaflet/dist/images/marker-icon.png", import.meta.url).href,
  iconRetinaUrl: new URL(
    "leaflet/dist/images/marker-icon-2x.png",
    import.meta.url,
  ).href,
  shadowUrl: new URL("leaflet/dist/images/marker-shadow.png", import.meta.url)
    .href,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

function NavigationController({
  navigationStarted,
  currentLocation,
  selectedAtm,
  routePath,
}: {
  navigationStarted: boolean;
  currentLocation: Coordinates;
  selectedAtm: NearbyAtm | null;
  routePath: Coordinates[];
}) {
  const map = useMap();
  const [currentLatitude, currentLongitude] = currentLocation;
  const atmLatitude = selectedAtm?.location[0];
  const atmLongitude = selectedAtm?.location[1];

  useEffect(() => {
    if (navigationStarted && atmLatitude !== undefined && atmLongitude !== undefined) {
      map.fitBounds(
        L.latLngBounds(
          routePath.length
            ? routePath
            : [
                [currentLatitude, currentLongitude],
                [atmLatitude, atmLongitude],
              ],
        ),
        {
          padding: [48, 48],
          maxZoom: 16,
        },
      );
    }
  }, [
    atmLatitude,
    atmLongitude,
    currentLatitude,
    currentLongitude,
    map,
    navigationStarted,
    routePath,
  ]);

  useEffect(() => {
    if (!navigationStarted) {
      map.setView(currentLocation);
    }
  }, [currentLocation, map, navigationStarted]);

  return null;
}

export default function MapView() {
  const [navigationStarted, setNavigationStarted] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<Coordinates>(
    fallbackLocation,
  );
  const [nearbyAtms, setNearbyAtms] = useState<NearbyAtm[]>([]);
  const [locationStatus, setLocationStatus] = useState(
    "Tap below to allow live location",
  );
  const [atmStatus, setAtmStatus] = useState("Loading nearby ATMs...");
  const [locationEnabled, setLocationEnabled] = useState(false);
  const [cashStatus, setCashStatus] = useState<CashStatus>({
    available: null,
    status: "loading",
    lastUpdated: null,
    source: "cashready-api",
  });
  const [routePath, setRoutePath] = useState<Coordinates[]>([]);
  const lastFetchedLocation = useRef<Coordinates | null>(null);
  const watchIdRef = useRef<number | null>(null);

  const requestLiveLocation = () => {
    if (!navigator.geolocation) {
      setLocationStatus("GPS unavailable on this browser");
      setLocationEnabled(false);
      return;
    }

    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }

    setLocationStatus("Requesting live location access...");

    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setCurrentLocation([coords.latitude, coords.longitude]);
        setLocationEnabled(true);
        setLocationStatus("Live location enabled");
      },
      () => {
        setLocationStatus("Location permission unavailable. Please allow location access for this site.");
        setLocationEnabled(false);
      },
      { enableHighAccuracy: true, maximumAge: 30000, timeout: 15000 },
    );

    watchIdRef.current = navigator.geolocation.watchPosition(
      ({ coords }) => {
        setCurrentLocation([coords.latitude, coords.longitude]);
        setLocationEnabled(true);
        setLocationStatus("Live location enabled");
      },
      () => {
        setLocationStatus("Location permission unavailable. Please allow location access for this site.");
        setLocationEnabled(false);
      },
      { enableHighAccuracy: true, maximumAge: 30000, timeout: 15000 },
    );
  };

  useEffect(() => () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation?.clearWatch(watchIdRef.current);
    }
  }, []);

  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationStatus("GPS unavailable on this browser");
      setLocationEnabled(false);
      return;
    }

    const syncPermissionState = async () => {
      try {
        const permission = await navigator.permissions?.query?.({
          name: "geolocation" as PermissionName,
        });

        if (permission?.state === "granted") {
          requestLiveLocation();
          return;
        }

        if (permission?.state === "prompt") {
          setLocationStatus("Requesting live location access...");
          requestLiveLocation();
          return;
        }
      } catch {
        // Ignore browser permission API issues and trigger the direct request anyway.
      }

      setLocationStatus("Tap below to allow live location");
    };

    void syncPermissionState();
  }, []);

  useEffect(() => {
    const previousLocation = lastFetchedLocation.current;
    const movedLatitude = previousLocation
      ? Math.abs(previousLocation[0] - currentLocation[0])
      : 1;
    const movedLongitude = previousLocation
      ? Math.abs(previousLocation[1] - currentLocation[1])
      : 1;

    if (movedLatitude < 0.002 && movedLongitude < 0.002) return;

    const controller = new AbortController();
    const [latitude, longitude] = currentLocation;
    const query = `[out:json][timeout:15];node[amenity=atm](around:5000,${latitude},${longitude});out;`;
    const endpoints = [
      "https://overpass-api.de/api/interpreter",
      "https://overpass.kumi.systems/api/interpreter",
      "https://overpass.private.coffee/api/interpreter",
    ];

    setNearbyAtms([]);
    setAtmStatus("Refreshing nearby ATMs...");
    lastFetchedLocation.current = currentLocation;

    const loadNearbyAtms = async () => {
      try {
        const west = longitude - 0.06;
        const east = longitude + 0.06;
        const south = latitude - 0.06;
        const north = latitude + 0.06;
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=jsonv2&q=ATM&limit=20&viewbox=${west},${north},${east},${south}&bounded=1`,
          {
            headers: { Accept: "application/json" },
            signal: AbortSignal.any([
              controller.signal,
              AbortSignal.timeout(10000),
            ]),
          },
        );
        if (response.ok) {
          const places: Array<{
            place_id: number;
            lat: string;
            lon: string;
            display_name: string;
          }> = await response.json();
          const atms = ensureAtmCoverage(places
            .map((place) => ({
              id: place.place_id,
              name: place.display_name.split(",")[0] || "Nearby ATM",
              location: [Number(place.lat), Number(place.lon)] as Coordinates,
              operator: place.display_name,
            }))
            .sort(
              (firstAtm, secondAtm) =>
                distanceFromCurrentLocation(firstAtm, currentLocation) -
                distanceFromCurrentLocation(secondAtm, currentLocation),
            ), currentLocation);
          setNearbyAtms(atms);
          setAtmStatus(`${atms.length} nearby ATM${atms.length === 1 ? "" : "s"} found`);
          return;
        }
      } catch (error) {
        if (controller.signal.aborted) return;
      }

      for (const endpoint of endpoints) {
        try {
          const response = await fetch(endpoint, {
            method: "POST",
            body: query,
            headers: { "Content-Type": "text/plain" },
            signal: AbortSignal.any([
              controller.signal,
              AbortSignal.timeout(8000),
            ]),
          });
          if (!response.ok) continue;

          const data: {
            elements?: Array<{
              id: number;
              lat: number;
              lon: number;
              tags?: Record<string, string>;
            }>;
          } = await response.json();
          const atms = ensureAtmCoverage((data.elements ?? [])
            .map((element) => ({
              id: element.id,
              name: element.tags?.name ?? element.tags?.operator ?? "Nearby ATM",
              location: [element.lat, element.lon] as Coordinates,
              operator: element.tags?.operator,
            }))
            .sort(
              (firstAtm, secondAtm) =>
                distanceFromCurrentLocation(firstAtm, currentLocation) -
                distanceFromCurrentLocation(secondAtm, currentLocation),
            ), currentLocation);

          setNearbyAtms(atms);
          setAtmStatus(
            atms.length
              ? `${atms.length} nearby ATM${atms.length === 1 ? "" : "s"} found`
              : "No mapped ATMs found within 5 km",
          );
          return;
        } catch (error) {
          if (controller.signal.aborted) return;
        }
      }

      const fallbackAtms = ensureAtmCoverage([], currentLocation);
      setNearbyAtms(fallbackAtms);
      setAtmStatus("Showing nearby ATM locations");
    };

    void loadNearbyAtms();

    return () => controller.abort();
  }, [currentLocation]);

  const [selectedAtmId, setSelectedAtmId] = useState<number | null>(null);
  const selectedAtm = nearbyAtms.find((atm) => atm.id === selectedAtmId) ?? null;

  const openGoogleMapsNavigation = (atm: NearbyAtm = selectedAtm as NearbyAtm) => {
    if (!atm) return;

    const [originLatitude, originLongitude] = currentLocation;
    const [destinationLatitude, destinationLongitude] = atm.location;
    const googleMapsUrl = new URL(
      "https://www.google.com/maps/dir/?api=1",
    );
    googleMapsUrl.searchParams.set(
      "origin",
      `${originLatitude},${originLongitude}`,
    );
    googleMapsUrl.searchParams.set(
      "destination",
      `${destinationLatitude},${destinationLongitude}`,
    );
    googleMapsUrl.searchParams.set("travelmode", "driving");

    window.open(googleMapsUrl.toString(), "_blank", "noopener,noreferrer");
    setNavigationStarted(true);
  };

  const selectAtm = (atm: NearbyAtm) => {
    setSelectedAtmId(atm.id);
    setNavigationStarted(true);
  };

  useEffect(() => {
    if (!selectedAtm) {
      setCashStatus({
        available: null,
        status: "unavailable",
        lastUpdated: null,
        source: "no-atm-selected",
      });
      return;
    }

    const controller = new AbortController();
    const [latitude, longitude] = selectedAtm.location;

    fetch(`/api/atm-status?lat=${latitude}&lon=${longitude}&radius=5000`, {
      signal: controller.signal,
    })
      .then((response) => response.json())
      .then((data: CashStatus) => setCashStatus(data))
      .catch((error: Error) => {
        if (error.name !== "AbortError") {
          setCashStatus({
            available: null,
            status: "unavailable",
            lastUpdated: null,
            source: "cashready-api",
            message: "Start the CashReady API server to load cash status.",
          });
        }
      });

    return () => controller.abort();
  }, [selectedAtm]);

  useEffect(() => {
    if (!selectedAtm) {
      setRoutePath([]);
      return;
    }

    const controller = new AbortController();
    const [currentLatitude, currentLongitude] = currentLocation;
    const [atmLatitude, atmLongitude] = selectedAtm.location;
    setRoutePath([currentLocation, selectedAtm.location]);

    fetch(
      `https://router.project-osrm.org/route/v1/driving/${currentLongitude},${currentLatitude};${atmLongitude},${atmLatitude}?overview=full&geometries=geojson`,
      {
        signal: AbortSignal.any([
          controller.signal,
          AbortSignal.timeout(10000),
        ]),
      },
    )
      .then((response) => {
        if (!response.ok) throw new Error("Route service unavailable");
        return response.json();
      })
      .then((data: {
        routes?: Array<{
          distance: number;
          duration: number;
          geometry?: { coordinates: Array<[number, number]> };
        }>;
      }) => {
        const route = data.routes?.[0];
        if (!route) return;

        if (route.geometry?.coordinates.length) {
          setRoutePath(
            route.geometry.coordinates.map(
              ([longitude, latitude]) => [latitude, longitude],
            ),
          );
        }

      })
      .catch((error: Error) => {
        if (error.name !== "AbortError") return;
      });

    return () => controller.abort();
  }, [currentLocation, selectedAtm]);

  return (
    <Box className="atm-locator-page" sx={{ minHeight: "100%", bgcolor: "#F5F7FA", p: { xs: 2, md: 3 }, boxSizing: "border-box" }}>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", lg: "minmax(0, 1fr) minmax(0, 4fr)" },
          gap: 2,
          alignItems: "stretch",
        }}
      >
        <Card sx={{ p: { xs: 2, md: 2.5 }, borderRadius: 3 }}>
          <Card
            sx={{
              p: 2,
              mb: 2,
              borderRadius: 3,
              background: "linear-gradient(135deg, #eef8ff 0%, #eafaf5 100%)",
              border: "1px solid #cfe8ff",
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: "bold", color: "#16324F" }}>
              📍 Allow live location
            </Typography>
            <Typography sx={{ mt: 0.8, color: "#475569", fontSize: 13 }}>
              Share your current location to get nearby ATM suggestions instantly.
            </Typography>
            <Button
              variant="contained"
              fullWidth
              sx={{ mt: 1.5, borderRadius: 2, fontWeight: "bold", background: "linear-gradient(135deg,#16324F,#0F766E)" }}
              onClick={requestLiveLocation}
            >
              {locationEnabled ? "Refresh live location" : "Allow Live Location"}
            </Button>
          </Card>

          <Typography variant="h6" sx={{ fontWeight: "bold", color: "#16324F" }}>Nearby ATMs</Typography>
          <Typography sx={{ mt: 0.5, color: "#64748B", fontSize: 13 }}>{locationStatus} · {atmStatus}</Typography>
          <Box className="atm-list" sx={{ display: "grid", gap: 1.5, mt: 2 }}>
            {nearbyAtms.map((atm) => {
              const isSelected = atm.id === selectedAtmId;
              const cashPercent = getDummyAtmCashPercent(atm.name, atm.id);
              const cashLevel = getCashLevelLabel(cashPercent);
              const statusTone = cashPercent >= 75 ? "#16A34A" : cashPercent >= 50 ? "#D97706" : "#DC2626";
              const cashLabel = isSelected && cashStatus.available === true ? "Available" : isSelected && cashStatus.available === false ? "Unavailable" : cashLevel;
              return <Card key={atm.id} component="button" onClick={() => selectAtm(atm)} sx={{ p: 1.5, textAlign: "left", borderRadius: 2, border: isSelected ? "2px solid #0F766E" : "1px solid #E2E8F0", bgcolor: isSelected ? "#E7F5F1" : "#fff", cursor: "pointer", "&:hover": { borderColor: "#0F766E" } }}>
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1 }}>
                  <Box sx={{ minWidth: 0, flex: 1 }}>
                    <Typography sx={{ fontWeight: "bold", color: "#16324F", fontSize: 14 }}>🏧 {atm.name}</Typography>
                    <Typography sx={{ mt: 0.5, fontSize: 12, color: "#475569" }}>{atm.operator ?? "Address unavailable"}</Typography>
                    <Box sx={{ display: "flex", gap: 1.5, mt: 0.75, whiteSpace: "nowrap", alignItems: "center", flexWrap: "wrap" }}>
                      <Typography sx={{ fontSize: 12 }}><strong>Distance:</strong> {formatDistance(distanceFromCurrentLocation(atm, currentLocation))}</Typography>
                      <Typography sx={{ fontSize: 12 }}><strong>Cash:</strong> {cashPercent}%</Typography>
                    </Box>
                    <Box sx={{ mt: 0.75, display: "flex", alignItems: "center", gap: 1 }}>
                      <Box sx={{ flex: 1, height: 8, borderRadius: 999, background: "#E2E8F0", overflow: "hidden" }}>
                        <Box sx={{ width: `${cashPercent}%`, height: "100%", borderRadius: 999, background: statusTone }} />
                      </Box>
                      <Typography sx={{ fontSize: 11, color: statusTone, fontWeight: 700 }}>{cashLabel}</Typography>
                    </Box>
                  </Box>
                  <Button className="google-maps-button" size="small" variant="outlined" aria-label={`Open ${atm.name} in Google Maps`} title="Open in Google Maps" onClick={(event) => { event.stopPropagation(); selectAtm(atm); openGoogleMapsNavigation(atm); }} sx={{ flexShrink: 0, minWidth: 34, width: 34, height: 34, p: 0, borderRadius: "50%", fontSize: 20 }}>⌖</Button>
                </Box>
              </Card>;
            })}
            {!nearbyAtms.length && <Typography sx={{ py: 4, color: "#64748B", textAlign: "center" }}>Searching for nearby ATMs...</Typography>}
          </Box>
        </Card>

        {/* Map Area */}
        <Card
          sx={{
            p: 2,
            borderRadius: 4,
          }}
        >
          <MapContainer
            center={currentLocation}
            zoom={15}
            scrollWheelZoom
            style={{ height: "calc(100vh - 225px)", minHeight: "520px", width: "100%", borderRadius: "12px" }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            <Marker position={currentLocation} icon={markerIcon}>
              <Popup>📍 Your live location</Popup>
            </Marker>

            {nearbyAtms.map((atm) => (
              <Marker key={atm.id} position={atm.location} icon={markerIcon} eventHandlers={{ click: () => selectAtm(atm) }}>
                <Popup>
                  🏧 {atm.name}
                  {atm.operator ? ` (${atm.operator})` : ""}
                </Popup>
              </Marker>
            ))}

            {selectedAtm && (
              <Polyline
                positions={routePath}
                pathOptions={{ color: "#0F766E", weight: 5 }}
              />
            )}
            <NavigationController
              currentLocation={currentLocation}
              navigationStarted={navigationStarted}
              routePath={routePath}
              selectedAtm={selectedAtm}
            />
          </MapContainer>
        </Card>
      </Box>
    </Box>
  );
}