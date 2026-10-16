import {
  Box,
  Button,
  Card,
  Divider,
  IconButton,
  TextField,
  Typography,
} from "@mui/material";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import QrCode2Icon from "@mui/icons-material/QrCode2";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import { useEffect, useRef, useState } from "react";
import type { FormEvent, KeyboardEvent } from "react";
import { useNavigate } from "react-router-dom";
import jsQR from "jsqr";
import QRCode from "qrcode";
import { buildLoginQrPayload, parseLoginQrPayload } from "../lib/qrLogin";
import CashReadyLogo from "../Components/CashReadyLogo";

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
  const [otp, setOtp] = useState("");
  const [otpDigits, setOtpDigits] = useState<string[]>(Array(4).fill(""));
  const [otpSent, setOtpSent] = useState(false);
  const [otpRequestCount, setOtpRequestCount] = useState(0);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);
  const [blockedUntil, setBlockedUntil] = useState<number | null>(null);
  const [showOtpValue, setShowOtpValue] = useState(false);
  const otpRefs = useRef<Array<HTMLInputElement | null>>([]);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [cameraStatus, setCameraStatus] = useState("Ready to scan");
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const details = roleDetails[role];

  const demoUsername = role === "customer" ? "customer@cashready.test" : "banker@cashready.test";
  const demoPassword = role === "customer" ? "Customer@123" : "Banker@123";
  const MAX_OTP_REQUESTS = 3;
  const OTP_COOLDOWN_SECONDS = 60;
  const OTP_BLOCK_DURATION_SECONDS = 300;

  useEffect(() => {
    const payload = buildLoginQrPayload(role, demoUsername, demoPassword);
    QRCode.toDataURL(payload, { width: 220, margin: 1, color: { dark: "#102a5d", light: "#ffffff" } })
      .then((url: string) => setQrDataUrl(url))
      .catch(() => setQrDataUrl(""));

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    };
  }, [role, demoUsername, demoPassword]);

  useEffect(() => {
    if (cooldownSeconds <= 0) return undefined;
    const timeoutId = window.setTimeout(() => setCooldownSeconds((seconds) => seconds - 1), 1000);
    return () => window.clearTimeout(timeoutId);
  }, [cooldownSeconds]);

  useEffect(() => {
    if (!notice) return undefined;
    const timeoutId = window.setTimeout(() => setNotice(""), 2600);
    return () => window.clearTimeout(timeoutId);
  }, [notice]);

  const getBlockedRemainingSeconds = () => {
    if (!blockedUntil) return 0;
    const remaining = Math.ceil((blockedUntil - Date.now()) / 1000);
    return remaining > 0 ? remaining : 0;
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setIsCameraOpen(false);
    setCameraStatus("Ready to scan");
  };

  const handleOtpDigitChange = (index: number, value: string) => {
    const sanitizedValue = value.replace(/\D/g, "").slice(0, 1);
    const nextDigits = [...otpDigits];
    nextDigits[index] = sanitizedValue;
    setOtpDigits(nextDigits);
    setOtp(nextDigits.join(""));

    if (sanitizedValue && index < nextDigits.length - 1) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Backspace" && !otpDigits[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpToggle = () => {
    setShowOtpValue((visible) => !visible);
  };

  const handleSendOtp = () => {
    if (!username.trim()) {
      setError("Please enter your mobile number or user ID first.");
      return;
    }

    if (getBlockedRemainingSeconds() > 0) {
      return;
    }

    if (cooldownSeconds > 0) {
      setError(`OTP already sent. Please wait ${cooldownSeconds} seconds before requesting another code.`);
      return;
    }

    const nextRequestCount = otpRequestCount + 1;
    setOtpRequestCount(nextRequestCount);
    setOtpSent(true);
    setOtp("");
    setOtpDigits(Array(4).fill(""));
    setNotice("OTP has been sent successfully.");
    setError("");
    setCooldownSeconds(OTP_COOLDOWN_SECONDS);

    if (nextRequestCount >= MAX_OTP_REQUESTS) {
      setBlockedUntil(Date.now() + OTP_BLOCK_DURATION_SECONDS * 1000);
      setNotice("OTP has been sent successfully. You have reached the resend limit. Please try again in 5 minutes.");
    }
  };

  const handleScanQr = async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setError("This browser does not support camera scanning.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });

      streamRef.current = stream;
      setIsCameraOpen(true);
      setCameraStatus("Scanning for QR code...");
      setError("");

      const video = videoRef.current;
      if (!video) {
        throw new Error("Camera preview is not ready.");
      }

      video.srcObject = stream;
      await video.play();

      const canvas = canvasRef.current ?? document.createElement("canvas");
      canvasRef.current = canvas;
      const context = canvas.getContext("2d", { willReadFrequently: true });

      if (!context) {
        throw new Error("Canvas is not available.");
      }

      const scanFrame = () => {
        if (!video || !streamRef.current) {
          return;
        }

        if (video.readyState < 2) {
          requestAnimationFrame(scanFrame);
          return;
        }

        const width = Math.min(video.videoWidth, 640);
        const height = Math.min(video.videoHeight, 480);
        canvas.width = width;
        canvas.height = height;
        context.drawImage(video, 0, 0, width, height);

        const image = context.getImageData(0, 0, width, height);
        const result = jsQR(image.data, image.width, image.height, { inversionAttempts: "dontInvert" });

        if (result) {
          const payload = parseLoginQrPayload(result.data);
          if (!payload) {
            setCameraStatus("Scanned code is not a CashReady login QR");
            setTimeout(() => {
              if (streamRef.current) {
                requestAnimationFrame(scanFrame);
              }
            }, 1000);
            return;
          }

          setUsername(payload.username);
          setOtpSent(true);
          setOtp("");
          setOtpDigits(Array(4).fill(""));
          setNotice("OTP has been sent successfully.");
          setError("");
          setCooldownSeconds(OTP_COOLDOWN_SECONDS);
          setCameraStatus("QR found. Login data loaded.");
          stopCamera();
          return;
        }

        requestAnimationFrame(scanFrame);
      };

      requestAnimationFrame(scanFrame);
    } catch (scanError) {
      setError(scanError instanceof Error ? scanError.message : "Unable to access camera.");
      stopCamera();
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    if (!otpSent) {
      handleSendOtp();
      return;
    }

    if (otp.length !== 4) {
      setError("Please enter the 4-digit OTP.");
      return;
    }

    if (otp !== "1234") {
      setError("Incorrect OTP. Please try again.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role, username, otp }),
      });
      const data: { token?: string; error?: string } = await response.json().catch(() => ({}));

      if (response.ok && data.token) {
        localStorage.setItem("cashready_token", data.token);
        localStorage.setItem("cashready_role", role);
        sessionStorage.setItem("cashready_token", data.token);
        navigate(details.destination);
        return;
      }

      const demoToken = `demo-${role}-${username}`;
      localStorage.setItem("cashready_token", demoToken);
      localStorage.setItem("cashready_role", role);
      sessionStorage.setItem("cashready_token", demoToken);
      navigate(details.destination);
    } catch (loginError) {
      const demoToken = `demo-${role}-${username}`;
      localStorage.setItem("cashready_token", demoToken);
      localStorage.setItem("cashready_role", role);
      sessionStorage.setItem("cashready_token", demoToken);
      navigate(details.destination);
      if (loginError instanceof Error && loginError.message) {
        setError(loginError.message);
      }
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
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, flexWrap: "wrap" }}>
            <CashReadyLogo className="brand-lockup brand-lockup--auth" />
            <Typography variant="caption" sx={{ color: "#71809b", letterSpacing: 1.2 }}>
              AI BANKING PLATFORM
            </Typography>
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
              onClick={handleScanQr}
              sx={{
                width: 62,
                height: 62,
                display: "grid",
                placeItems: "center",
                flexShrink: 0,
                bgcolor: "#fff",
                borderRadius: 2,
                color: "#2444cf",
                cursor: "pointer",
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
            <Button
              type="button"
              onClick={handleScanQr}
              sx={{ color: "#2444cf", minWidth: 0, p: 0.5 }}
              aria-label="Scan QR code"
            >
              <ArrowForwardIcon sx={{ color: "#2444cf" }} />
            </Button>
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

          {qrDataUrl && (
            <Box
              sx={{
                mt: 2,
                p: 2,
                borderRadius: 2,
                border: "1px solid #d9e5ff",
                background: "#f8fbff",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 1,
              }}
            >
              <img src={qrDataUrl} alt="CashReady QR login code" style={{ width: 160, height: 160, display: "block" }} />
              <Typography variant="caption" sx={{ color: "#4c5d7a" }}>
                Demo QR for {role === "customer" ? "customer" : "banker"} login
              </Typography>
            </Box>
          )}

          {isCameraOpen && (
            <Box sx={{ mt: 3, border: "1px solid #d5e0ff", borderRadius: 2, overflow: "hidden", bgcolor: "#f5f8ff" }}>
              <video ref={videoRef} autoPlay playsInline muted style={{ width: "100%", maxHeight: 220, display: "block", background: "#000" }} />
              <canvas ref={canvasRef} style={{ display: "none" }} />
              <Box sx={{ px: 2, py: 1.5, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Typography variant="caption" sx={{ color: "#2d3d5c" }}>{cameraStatus}</Typography>
                <Button type="button" size="small" variant="text" onClick={stopCamera} sx={{ color: "#2444cf" }}>
                  Close
                </Button>
              </Box>
            </Box>
          )}

          <Divider sx={{ my: 4, color: "#7a8497" }}>Or login with ID</Divider>

          <Typography
          component="label"
          htmlFor="username"
          sx={{ fontWeight: 700, color: "#17233d" }}
        >
          {role === "customer" ? "Mobile Number / User ID" : "Employee ID / User ID"}
          </Typography>
          <TextField
          id="username"
          fullWidth
          required
          placeholder={role === "customer" ? "Enter your mobile number or user ID" : "Enter your user ID"}
          slotProps={{ htmlInput: { "aria-label": "Username" } }}
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          sx={{
            mt: 1,
            "& .MuiOutlinedInput-root": { borderRadius: 2 },
          }}
          />

          {otpSent && (
            <>
              <Box sx={{ mt: 2.5, display: "flex", alignItems: "center", justifyContent: "center", width: "100%" }}>
                <Typography component="label" htmlFor="otp-0" sx={{ fontWeight: 700, color: "#17233d", mr: 1 }}>
                  Enter OTP
                </Typography>
              </Box>

              <Box sx={{ mt: 1, display: "flex", gap: 1, justifyContent: "center", alignItems: "center" }}>
                {Array.from({ length: 4 }).map((_, index) => (
                  <TextField
                    key={index}
                    id={`otp-${index}`}
                    inputRef={(element) => {
                      otpRefs.current[index] = element;
                    }}
                    value={otpDigits[index] ?? ""}
                    onChange={(event) => handleOtpDigitChange(index, event.target.value)}
                    onKeyDown={(event) => handleOtpKeyDown(index, event)}
                    type={showOtpValue ? "text" : "password"}
                    slotProps={{
                      htmlInput: {
                        inputMode: "numeric",
                        maxLength: 1,
                        style: { textAlign: "center", fontSize: 22, fontWeight: 700 },
                      },
                    }}
                    sx={{
                      width: 56,
                      "& .MuiOutlinedInput-root": {
                        borderRadius: 2,
                        height: 56,
                        bgcolor: "#f8faff",
                      },
                    }}
                  />
                ))}

                <IconButton
                  aria-label="Show OTP"
                  size="small"
                  onClick={handleOtpToggle}
                  sx={{
                    color: "#5d6b82",
                    width: 24,
                    height: 24,
                    p: 0,
                    borderRadius: 1,
                    opacity: 0.9,
                    "&:hover": { backgroundColor: "transparent", opacity: 1 },
                  }}
                >
                  {showOtpValue ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                </IconButton>
              </Box>
            </>
          )}

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
            {isSubmitting ? "Verifying..." : otpSent ? "Verify OTP" : "Send OTP"}
          </Button>

          {notice && (
            <Box
              role="status"
              sx={{
                mt: 2,
                px: 2,
                py: 1,
                borderRadius: 2,
                bgcolor: "rgba(49, 134, 34, 0.12)",
                color: "#2a7a2d",
                border: "1px solid rgba(49, 134, 34, 0.2)",
                fontSize: 14,
                fontWeight: 600,
                boxShadow: "0 12px 28px rgba(38, 127, 57, 0.16)",
                position: "relative",
                animation: "fadeInUp 0.22s ease",
                "@keyframes fadeInUp": {
                  "0%": { opacity: 0, transform: "translateY(8px)" },
                  "100%": { opacity: 1, transform: "translateY(0)" },
                },
              }}
            >
              {notice}
            </Box>
          )}

          {error && (
            <Typography role="alert" sx={{ mt: 2, color: "#c62828", fontSize: 14 }}>
              {error}
            </Typography>
          )}

          <Box sx={{ display: "flex", gap: 1.5, mt: 1.5 }}>
            <Button
            fullWidth
            type="button"
            variant="outlined"
            onClick={() => navigate("/")}
            sx={{ color: "#2444cf", borderColor: "#2444cf", borderRadius: 2, textTransform: "none", fontWeight: 700 }}
          >
            Back to Home
            </Button>
            {role === "customer" && (
              <Button
              fullWidth
              type="button"
              variant="outlined"
              onClick={() => navigate("/register/customer")}
              sx={{ color: "#2444cf", borderColor: "#2444cf", borderRadius: 2, textTransform: "none", fontWeight: 700 }}
            >
              New Customer
              </Button>
            )}
          </Box>
        </Box>
      </Card>
    </Box>
  );
}
