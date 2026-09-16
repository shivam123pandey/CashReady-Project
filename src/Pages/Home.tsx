import {
  Box,
  Button,
  Card,
  IconButton,
  Typography,
} from "@mui/material";
import { RefreshRounded } from "@mui/icons-material";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

type Coordinates = [number, number];

const defaultLocation: Coordinates = [26.8467, 80.9462];

const atmCards = [
  {
    name: "HDFC Bank",
    address: "HDFC Bank, Faizabad Road, Tiwariganj, Lucknow, Uttar Pradesh, 226028, India",
    location: [26.84, 80.94] as Coordinates,
    status: "Cash: Provider unavailable",
  },
  {
    name: "State Bank of India",
    address: "State Bank of India, RL B Road 1, Sector-14, Munshi Pulia, Lucknow, Uttar Pradesh, 255001, India",
    location: [26.861, 80.908] as Coordinates,
    status: "Cash: Provider unavailable",
  },
  {
    name: "Ring Road",
    address: "Ring Road, Indira Nagar, Lucknow, Uttar Pradesh, 255001, India",
    location: [26.875, 80.923] as Coordinates,
    status: "Cash: Provider unavailable",
  },
  {
    name: "Old Picnic Spot Road",
    address: "Old Picnic Spot Road, Lucknow, Uttar Pradesh, 255001, India",
    location: [26.832, 80.965] as Coordinates,
    status: "Cash: Provider unavailable",
  },
] as const;

function distanceInKm(from: Coordinates, to: Coordinates) {
  const latitudeDelta = ((to[0] - from[0]) * Math.PI) / 180;
  const longitudeDelta = ((to[1] - from[1]) * Math.PI) / 180;
  const latitudeOne = (from[0] * Math.PI) / 180;
  const latitudeTwo = (to[0] * Math.PI) / 180;
  const haversine =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.sin(longitudeDelta / 2) ** 2 *
      Math.cos(latitudeOne) *
      Math.cos(latitudeTwo);

  return 6371 * 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
}

function formatDistance(distanceKm: number) {
  return distanceKm < 1
    ? `${Math.max(0.1, Math.round(distanceKm * 10) / 10)} KM`
    : `${Math.round(distanceKm * 10) / 10} KM`;
}

export default function Home() {
  const navigate = useNavigate();
  const [currentLocation, setCurrentLocation] = useState<Coordinates>(defaultLocation);

  const requestLiveLocation = () => {
    if (!navigator.geolocation) {
      return;
    }

    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const nextLocation: Coordinates = [coords.latitude, coords.longitude];
        setCurrentLocation(nextLocation);
      },
      () => {
        setCurrentLocation(defaultLocation);
      },
      { enableHighAccuracy: true, maximumAge: 30000, timeout: 15000 },
    );
  };

  useEffect(() => {
    if (!navigator.geolocation) {
      return;
    }

    const loadPermissionState = async () => {
      try {
        const permission = await navigator.permissions?.query?.({
          name: "geolocation" as PermissionName,
        });

        if (permission?.state === "granted" || permission?.state === "prompt") {
          requestLiveLocation();
          return;
        }
      } catch {
        // Ignore unsupported permission API; button will still work.
      }
    };

    void loadPermissionState();
  }, []);

  const nearbyAtms = useMemo(
    () =>
      atmCards.map((atm) => ({
        ...atm,
        distance: formatDistance(distanceInKm(currentLocation, atm.location)),
      })),
    [currentLocation],
  );

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#f4f7fb", p: { xs: 2, md: 2.5 } }}>
      <Box
        sx={{
          maxWidth: 1440,
          mx: "auto",
          bgcolor: "#f8fafc",
          border: "1px solid #dfe7f1",
          borderRadius: 1.5,
          overflow: "hidden",
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            px: 3,
            py: 1.8,
            bgcolor: "#f8fafc",
            borderBottom: "1px solid #dfe7f1",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Box
              sx={{
                width: 32,
                height: 32,
                borderRadius: 1,
                bgcolor: "#eafaff",
                border: "1px solid #bfeaf5",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#0f766e",
                fontWeight: 700,
                fontSize: 18,
              }}
            >
              🏛
            </Box>
            <Typography sx={{ fontWeight: 700, fontSize: 32, color: "#16324F", letterSpacing: -0.8 }}>
              CashReady
            </Typography>
          </Box>

          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              minWidth: 340,
              maxWidth: 420,
              width: "100%",
              justifyContent: "center",
            }}
          >
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                width: "100%",
                maxWidth: 420,
                px: 2,
                py: 1.2,
                bgcolor: "#ffffff",
                border: "1px solid #dfe7f1",
                borderRadius: 2,
                color: "#94a3b8",
              }}
            >
              <Box sx={{ mr: 1, fontSize: 18 }}>⌕</Box>
              <Typography sx={{ color: "#64748B", fontSize: 15 }}>
                What are you looking for today?
              </Typography>
            </Box>
            <Button
              variant="contained"
              onClick={() => navigate("/login/customer")}
              sx={{
                borderRadius: 2,
                px: 3,
                py: 1.2,
                background: "linear-gradient(135deg,#16324F,#0F766E)",
                textTransform: "none",
                fontWeight: 700,
                boxShadow: "none",
              }}
            >
              Login
            </Button>
          </Box>
        </Box>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "1fr 1.8fr",
            borderBottom: "1px solid #dfe7f1",
            bgcolor: "#f8fafc",
          }}
        >
          {[
            "Dashboard",
            "ATM Locator",
            "Operations Center & Reports",
            "Contact",
          ].map((item, index) => (
            <Box
              key={item}
              sx={{
                textAlign: "center",
                py: 2,
                fontWeight: 700,
                color: index === 1 ? "#1d4ed8" : "#16324F",
                borderBottom: index === 1 ? "3px solid #1d4ed8" : "3px solid transparent",
                fontSize: 16,
                cursor: "pointer",
                transition: "all 0.2s ease",
                "&:hover": { bgcolor: "rgba(59,130,246,0.03)" },
              }}
            >
              {item}
            </Box>
          ))}
        </Box>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", xl: "360px 1fr" },
            gap: 2,
            p: 2.5,
            bgcolor: "#f3f6fb",
          }}
        >
          <Box sx={{ display: "grid", gap: 2 }}>
            <Box sx={{ p: 0.5 }}>
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1.5 }}>
                <Typography sx={{ fontWeight: 700, fontSize: 20, color: "#16324F" }}>
                  Nearby ATMs
                </Typography>
                <IconButton
                  aria-label="Refresh nearby ATMs"
                  onClick={requestLiveLocation}
                  size="small"
                  sx={{
                    border: "1px solid #dfe7f1",
                    bgcolor: "#ffffff",
                    color: "#16324F",
                    width: 32,
                    height: 32,
                    "&:hover": { bgcolor: "#f0f9ff", borderColor: "#bfeaf5" },
                  }}
                >
                  <RefreshRounded fontSize="small" />
                </IconButton>
              </Box>

              {nearbyAtms.map((atm, index) => (
                <Card
                  key={atm.name}
                  sx={{
                    p: 1.5,
                    mb: 1.5,
                    borderRadius: 2,
                    border: index === 0 ? "1px solid #0ea5e9" : "1px solid #dfe7f1",
                    bgcolor: index === 0 ? "#eef8ff" : "#ffffff",
                    boxShadow: "none",
                  }}
                >
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <Box>
                      <Typography sx={{ fontWeight: 700, fontSize: 15, color: "#16324F" }}>
                        🏧 {atm.name}
                      </Typography>
                      <Typography sx={{ mt: 0.7, color: "#475569", fontSize: 12, lineHeight: 1.5 }}>
                        {atm.address}
                      </Typography>
                    </Box>
                    <Box
                      sx={{
                        width: 28,
                        height: 28,
                        borderRadius: 1,
                        bgcolor: index === 0 ? "#e0f2fe" : "#f0f4f8",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#0f766e",
                        fontSize: 16,
                        flexShrink: 0,
                      }}
                    >
                      +
                    </Box>
                  </Box>

                  <Typography sx={{ mt: 1.5, color: "#475569", fontSize: 12 }}>
                    Distance: <Box component="span" sx={{ fontWeight: 700, color: "#16324F" }}>{atm.distance}</Box>
                    &nbsp;&nbsp;|&nbsp;&nbsp;{atm.status}
                  </Typography>
                </Card>
              ))}
            </Box>
          </Box>

          <Card
            sx={{
              minHeight: 760,
              borderRadius: 3,
              bgcolor: "#ffffff",
              border: "1px solid #dfe7f1",
              overflow: "hidden",
              boxShadow: "none",
              position: "relative",
            }}
          >
            <Box
              sx={{
                position: "absolute",
                inset: 0,
                background:
                  "linear-gradient(135deg, rgba(255,255,255,0.4), rgba(255,255,255,0.1)), " +
                  "repeating-linear-gradient(0deg, rgba(148,163,184,0.07) 0px, rgba(148,163,184,0.07) 1px, transparent 1px, transparent 12px), " +
                  "repeating-linear-gradient(90deg, rgba(148,163,184,0.08) 0px, rgba(148,163,184,0.08) 1px, transparent 1px, transparent 18px), " +
                  "#f2f2f0",
              }}
            />

            <Box sx={{ position: "absolute", inset: 0, opacity: 0.7 }}>
              <Box
                sx={{
                  position: "absolute",
                  left: "18%",
                  top: "13%",
                  width: "52%",
                  height: 2,
                  bgcolor: "#1ea672",
                  transform: "rotate(27deg)",
                  borderRadius: 999,
                  boxShadow: "0 0 0 3px rgba(30,166,114,0.2)",
                }}
              />
              <Box
                sx={{
                  position: "absolute",
                  left: "36%",
                  top: "32%",
                  width: "34%",
                  height: 2,
                  bgcolor: "#1ea672",
                  transform: "rotate(-18deg)",
                  borderRadius: 999,
                  boxShadow: "0 0 0 3px rgba(30,166,114,0.2)",
                }}
              />
              <Box
                sx={{
                  position: "absolute",
                  left: "47%",
                  top: "51%",
                  width: "32%",
                  height: 2,
                  bgcolor: "#1ea672",
                  transform: "rotate(14deg)",
                  borderRadius: 999,
                  boxShadow: "0 0 0 3px rgba(30,166,114,0.2)",
                }}
              />
              <Box
                sx={{
                  position: "absolute",
                  left: "20%",
                  top: "62%",
                  width: "36%",
                  height: 2,
                  bgcolor: "#1ea672",
                  transform: "rotate(-20deg)",
                  borderRadius: 999,
                  boxShadow: "0 0 0 3px rgba(30,166,114,0.2)",
                }}
              />
            </Box>

            <Box sx={{ position: "absolute", left: "34%", top: "43%", zIndex: 2 }}>
              <Box
                sx={{
                  width: 18,
                  height: 18,
                  borderRadius: "50%",
                  bgcolor: "#0ea5e9",
                  border: "4px solid #ffffff",
                  boxShadow: "0 0 0 3px rgba(14,165,233,0.35)",
                }}
              />
            </Box>

            <Box sx={{ position: "absolute", right: 16, bottom: 14, zIndex: 2, display: "flex", alignItems: "center", gap: 1, color: "#64748B", fontSize: 12 }}>
              <Box sx={{ width: 12, height: 12, borderRadius: "50%", bgcolor: "#8bc34a", border: "1px solid rgba(0,0,0,0.15)" }} />
              <Box>Leaflet</Box>
            </Box>

            <Box sx={{ position: "absolute", left: 14, top: 12, zIndex: 2, width: 36, height: 36, bgcolor: "rgba(255,255,255,0.9)", border: "1px solid #dfe7f1", borderRadius: 1.5, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>
              +
            </Box>

            <Box sx={{ position: "absolute", left: 14, top: 60, zIndex: 2, width: 36, height: 36, bgcolor: "rgba(255,255,255,0.9)", border: "1px solid #dfe7f1", borderRadius: 1.5, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>
              −
            </Box>
          </Card>
        </Box>
      </Box>
    </Box>
  );
}