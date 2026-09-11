import {
  Box,
  Button,
  Card,
  Divider,
  InputAdornment,
  TextField,
  Typography,
} from "@mui/material";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import KeyIcon from "@mui/icons-material/Key";
import QrCode2Icon from "@mui/icons-material/QrCode2";
import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";

type LoginRole = "customer" | "banker";

type LoginProps = {
  role: LoginRole;
};

const roleDetails = {
  customer: {
    title: "Customer Login",
    subtitle: "Find reliable ATMs and plan your cash withdrawal.",
    destination: "/customer-dashboard",
  },
  banker: {
    title: "Banker Login",
    subtitle: "Monitor ATM health, cash levels, and banking operations.",
    destination: "/banker-dashboard",
  },
} as const;

export default function Login({ role }: LoginProps) {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const details = roleDetails[role];

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role, username, password }),
      });
      const data: { token?: string; error?: string } = await response.json();

      if (!response.ok || !data.token) {
        throw new Error(data.error ?? "Unable to log in");
      }

      localStorage.setItem("cashready_token", data.token);
      localStorage.setItem("cashready_role", role);
      sessionStorage.setItem("cashready_token", data.token);
      navigate(details.destination);
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : "Unable to log in");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        bgcolor: "#eef2f9",
        p: { xs: 0, md: 2 },
      }}
    >
      <Card
        sx={{
          width: "min(100%, 1440px)",
          minHeight: { xs: "100vh", md: 760 },
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
          overflow: "hidden",
          borderRadius: { xs: 0, md: 2 },
          boxShadow: "0 16px 45px rgba(25, 53, 112, 0.16)",
        }}
      >
        <Box
          sx={{
            position: "relative",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            px: { xs: 3, sm: 6 },
            py: { xs: 5, md: 7 },
            color: "#fff",
            background:
              "linear-gradient(145deg, #0d2857 0%, #153f7d 58%, #071a3d 100%)",
            "&:before": {
              content: '""',
              position: "absolute",
              width: 520,
              height: 520,
              top: -180,
              left: -170,
              border: "1px solid rgba(117, 166, 255, 0.15)",
              borderRadius: "45% 55% 60% 40%",
              transform: "rotate(28deg)",
            },
          }}
        >
          <Box sx={{ position: "relative", zIndex: 1, textAlign: "center" }}>
            <Typography
              variant="h3"
              sx={{ fontWeight: 800, letterSpacing: -1, fontSize: { xs: 34, md: 44 } }}
            >
              Introducing <Box component="span" sx={{ color: "#8fb7ff" }}>KAVACH</Box>
            </Typography>
            <Typography sx={{ mt: 1, fontSize: { xs: 20, md: 26 }, opacity: 0.92 }}>
              A new way to login and verify
            </Typography>
          </Box>

          <Box
            sx={{
              position: "relative",
              zIndex: 1,
              width: "min(100%, 480px)",
              height: { xs: 330, sm: 390 },
              mt: { xs: 4, md: 7 },
            }}
          >
            <Box
              sx={{
                position: "absolute",
                top: 24,
                left: "8%",
                width: "70%",
                height: 210,
                border: "8px solid #06152e",
                borderRadius: 2,
                bgcolor: "#264d8c",
                boxShadow: "0 18px 30px rgba(0,0,0,0.3)",
              }}
            >
              <Typography sx={{ p: 2, fontSize: 12, opacity: 0.8 }}>
                CashReady secure login
              </Typography>
              <Box sx={{ mx: 2, mt: 2, width: "55%", height: 10, bgcolor: "#77a2ee", borderRadius: 4 }} />
              <Box sx={{ mx: 2, mt: 1, width: "40%", height: 8, bgcolor: "#547bbd", borderRadius: 4 }} />
            </Box>
            <Box
              sx={{
                position: "absolute",
                right: "3%",
                bottom: 30,
                width: 105,
                height: 190,
                border: "7px solid #07142b",
                borderRadius: 4,
                bgcolor: "#f8fbff",
                color: "#2444cf",
                display: "grid",
                placeItems: "center",
                boxShadow: "0 16px 24px rgba(0,0,0,0.32)",
              }}
            >
              <QrCode2Icon sx={{ fontSize: 62 }} />
            </Box>
            <Box
              sx={{
                position: "absolute",
                left: "28%",
                bottom: 48,
                width: 190,
                p: 2,
                bgcolor: "#fff",
                color: "#17233d",
                border: "3px solid #6c9dff",
                borderRadius: 2,
                textAlign: "center",
                boxShadow: "0 10px 20px rgba(0,0,0,0.22)",
              }}
            >
              <QrCode2Icon sx={{ fontSize: 52, color: "#2444cf" }} />
              <Typography variant="caption" sx={{ display: "block", fontWeight: 700 }}>
                Scan to login securely
              </Typography>
            </Box>
          </Box>

          <Box sx={{ position: "relative", zIndex: 1, width: "min(100%, 380px)", mt: "auto" }}>
            <Button
              fullWidth
              variant="outlined"
              sx={{ color: "#fff", borderColor: "#b8d0ff", py: 1.2, borderRadius: 2 }}
            >
              Know More
            </Button>
          </Box>
        </Box>

        <Box
          component="form"
          onSubmit={handleSubmit}
          sx={{ p: { xs: 3, sm: 6, lg: 9 }, bgcolor: "#fff" }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Box
            sx={{
              width: 42,
              height: 42,
              display: "grid",
              placeItems: "center",
              borderRadius: 1.5,
              color: "#2444cf",
              bgcolor: "#edf1ff",
            }}
          >
            <AccountBalanceIcon />
          </Box>
          <Box>
            <Typography
              variant="h5"
              sx={{ fontWeight: 800, color: "#17233d", lineHeight: 1.1 }}
            >
              CashReady
            </Typography>
            <Typography
              variant="caption"
              sx={{ color: "#71809b", letterSpacing: 1.2 }}
            >
              AI BANKING PLATFORM
            </Typography>
          </Box>
          </Box>

          <Typography
            variant="h4"
            sx={{ mt: 5, fontWeight: 800, color: "#17233d" }}
          >
            Welcome to CashReady
          </Typography>
          <Typography sx={{ mt: 1, color: "#66738b" }}>
            {details.subtitle}
          </Typography>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              mt: 4,
              borderBottom: "1px solid #d8deea",
            }}
          >
          <Typography
            sx={{
              pb: 1.5,
              textAlign: "center",
              color: "#2444cf",
              fontWeight: 700,
              borderBottom: "3px solid #2444cf",
            }}
          >
            {role === "customer" ? "Personal Banking" : "Bank Operations"}
          </Typography>
          <Typography
            sx={{
              pb: 1.5,
              textAlign: "center",
              color: "#6c768a",
            }}
          >
            Secure Login
          </Typography>
          </Box>

          <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 2,
            mt: 4,
            p: 2,
            bgcolor: "#f1f5ff",
            border: "1px solid #cbd8ff",
            borderRadius: 2,
          }}
        >
          <Box
            sx={{
              width: 62,
              height: 62,
              display: "grid",
              placeItems: "center",
              flexShrink: 0,
              bgcolor: "#fff",
              borderRadius: 2,
              color: "#2444cf",
            }}
          >
            <QrCode2Icon sx={{ fontSize: 42 }} />
          </Box>
          <Box sx={{ flex: 1 }}>
            <Typography sx={{ fontWeight: 700, color: "#17233d" }}>
              Login without password
            </Typography>
            <Typography variant="body2" sx={{ mt: 0.5, color: "#66738b" }}>
              Scan with the CashReady mobile app
            </Typography>
          </Box>
          <ArrowForwardIcon sx={{ color: "#2444cf" }} />
          </Box>
          <Box
          sx={{
            mt: 1,
            px: 2,
            py: 1,
            borderRadius: 1.5,
            bgcolor: "#318622",
            color: "#fff",
            fontWeight: 700,
            fontSize: 14,
          }}
        >
          Quick and secure login with QR code
          </Box>

          <Divider sx={{ my: 4, color: "#7a8497" }}>Or login with ID</Divider>

          <Typography
          component="label"
          htmlFor="username"
          sx={{ fontWeight: 700, color: "#17233d" }}
        >
          {role === "customer" ? "Customer ID / User ID" : "Employee ID / User ID"}
          </Typography>
          <TextField
          id="username"
          fullWidth
          required
          placeholder="Enter your user ID"
          slotProps={{ htmlInput: { "aria-label": "Username" } }}
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          sx={{
            mt: 1,
            "& .MuiOutlinedInput-root": { borderRadius: 2 },
          }}
          />

          <Typography
          component="label"
          htmlFor="password"
          sx={{ mt: 2.5, fontWeight: 700, color: "#17233d" }}
        >
          Password
          </Typography>
          <TextField
          id="password"
          fullWidth
          required
          type="password"
          placeholder="Enter your password"
          slotProps={{
            htmlInput: { "aria-label": "Password" },
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <KeyIcon sx={{ color: "#71809b" }} />
                </InputAdornment>
              ),
            },
          }}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          sx={{
            mt: 1,
            "& .MuiOutlinedInput-root": { borderRadius: 2 },
          }}
          />

          <Button
          fullWidth
          type="submit"
          variant="contained"
          sx={{
            mt: 3.5,
            py: 1.5,
            bgcolor: "#2444cf",
            fontWeight: 700,
            borderRadius: 2,
            boxShadow: "none",
            "&:hover": { bgcolor: "#1935b3", boxShadow: "none" },
          }}
        >
          {isSubmitting ? "Signing in..." : "Login"}
          </Button>

          {error && (
            <Typography role="alert" sx={{ mt: 2, color: "#c62828", fontSize: 14 }}>
              {error}
            </Typography>
          )}

          <Button
          fullWidth
          type="button"
          onClick={() => navigate("/")}
          sx={{ mt: 1.5, color: "#2444cf", textTransform: "none" }}
        >
          Back to Home
          </Button>
        </Box>
      </Card>
    </Box>
  );
}
