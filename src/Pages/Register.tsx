import {
  Box,
  Button,
  Card,
  IconButton,
  InputAdornment,
  TextField,
  Typography,
} from "@mui/material";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import CheckIcon from "@mui/icons-material/Check";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import LockIcon from "@mui/icons-material/Lock";
import ShieldIcon from "@mui/icons-material/Shield";
import SmsIcon from "@mui/icons-material/Sms";
import VerifiedUserIcon from "@mui/icons-material/VerifiedUser";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import { useEffect, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import { useNavigate } from "react-router-dom";

const fieldSx = {
  mt: 1,
  "& .MuiOutlinedInput-root": { borderRadius: 2 },
};

const labelSx = { mt: 2.5, display: "block", fontWeight: 700, color: "#17233d" };

const primaryButtonSx = {
  py: 1.5,
  bgcolor: "#2444cf",
  fontWeight: 700,
  borderRadius: 2,
  boxShadow: "none",
  "&:hover": { bgcolor: "#1935b3", boxShadow: "none" },
};

const steps = [
  { title: "Fill your details", detail: "Name, mobile number, card and Aadhaar" },
  { title: "Verify mobile number", detail: "Enter the 6-digit OTP sent by SMS" },
  { title: "Start using CashReady", detail: "Find ATMs that have cash, near you" },
];

const trustPoints = [
  { icon: <LockIcon fontSize="small" />, label: "Password stored encrypted" },
  { icon: <ShieldIcon fontSize="small" />, label: "Card and Aadhaar kept hidden" },
  { icon: <VerifiedUserIcon fontSize="small" />, label: "Mobile verified by OTP" },
];

// Defined outside Register so the form inputs keep focus across re-renders.
function RegisterShell({ step, children }: { step: number; children: ReactNode }) {
  return (
    <Box sx={{ minHeight: "100vh", display: "grid", placeItems: "center", bgcolor: "#eef2f9", p: { xs: 0, md: 2 } }}>
      <Card
        sx={{
          width: "min(100%, 1280px)",
          minHeight: { md: 760 },
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "5fr 7fr" },
          overflow: "hidden",
          borderRadius: { xs: 0, md: 2 },
          boxShadow: "0 16px 45px rgba(25, 53, 112, 0.16)",
          // #root centers text globally; this page reads better left-aligned.
          textAlign: "left",
          "& > *": { minWidth: 0 },
        }}
      >
        <Box
          sx={{
            position: "relative",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            px: { xs: 3, sm: 6 },
            py: { xs: 4, md: 7 },
            color: "#fff",
            background: "linear-gradient(145deg, #0d2857 0%, #153f7d 58%, #071a3d 100%)",
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
            "&:after": {
              content: '""',
              position: "absolute",
              width: 320,
              height: 320,
              right: -140,
              bottom: -120,
              borderRadius: "50%",
              background: "radial-gradient(circle, rgba(143, 183, 255, 0.22) 0%, rgba(143, 183, 255, 0) 70%)",
            },
          }}
        >
          <Box sx={{ position: "relative", zIndex: 1 }}>
            <Typography sx={{ fontSize: 13, letterSpacing: 2, color: "#8fb7ff", fontWeight: 700 }}>
              NEW CUSTOMER
            </Typography>
            <Typography variant="h3" sx={{ mt: 1.5, fontWeight: 800, letterSpacing: -1, fontSize: { xs: 30, md: 40 }, lineHeight: 1.15 }}>
              Open your <Box component="span" sx={{ color: "#8fb7ff" }}>CashReady</Box> account
            </Typography>
            <Typography sx={{ mt: 1.5, fontSize: { xs: 16, md: 18 }, opacity: 0.85 }}>
              Never walk to an empty ATM again. Sign up in under two minutes.
            </Typography>
          </Box>

          <Box component="ol" sx={{ position: "relative", zIndex: 1, listStyle: "none", p: 0, m: 0, mt: { xs: 4, md: 7 }, display: "grid", gap: 3 }}>
            {steps.map((item, index) => {
              const number = index + 1;
              const isDone = number < step;
              const isActive = number === step;
              return (
                <Box component="li" key={item.title} sx={{ display: "flex", gap: 2, alignItems: "flex-start", opacity: isDone || isActive ? 1 : 0.6 }}>
                  <Box
                    sx={{
                      width: 36,
                      height: 36,
                      flexShrink: 0,
                      display: "grid",
                      placeItems: "center",
                      borderRadius: "50%",
                      fontWeight: 800,
                      bgcolor: isDone ? "#318622" : isActive ? "#fff" : "transparent",
                      color: isDone ? "#fff" : isActive ? "#153f7d" : "#fff",
                      border: isDone || isActive ? "none" : "2px solid rgba(255, 255, 255, 0.5)",
                      boxShadow: isActive ? "0 0 0 6px rgba(143, 183, 255, 0.25)" : "none",
                    }}
                  >
                    {isDone ? <CheckIcon fontSize="small" /> : number}
                  </Box>
                  <Box>
                    <Typography sx={{ fontWeight: 700, fontSize: 17 }}>{item.title}</Typography>
                    <Typography sx={{ fontSize: 14, opacity: 0.75 }}>{item.detail}</Typography>
                  </Box>
                </Box>
              );
            })}
          </Box>

          <Box sx={{ position: "relative", zIndex: 1, mt: "auto", pt: 6, display: { xs: "none", md: "grid" }, gap: 1.5 }}>
            {trustPoints.map((point) => (
              <Box
                key={point.label}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1.5,
                  px: 2,
                  py: 1.25,
                  borderRadius: 2,
                  bgcolor: "rgba(255, 255, 255, 0.08)",
                  border: "1px solid rgba(184, 208, 255, 0.25)",
                  fontSize: 14,
                }}
              >
                <Box sx={{ display: "grid", color: "#8fb7ff" }}>{point.icon}</Box>
                {point.label}
              </Box>
            ))}
          </Box>
        </Box>

        <Box sx={{ p: { xs: 3, sm: 6, lg: 8 }, bgcolor: "#fff", display: "flex", flexDirection: "column", justifyContent: "center" }}>
          {children}
        </Box>
      </Card>
    </Box>
  );
}

export default function Register() {
  const navigate = useNavigate();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [mobile, setMobile] = useState("");
  const [debitCard, setDebitCard] = useState("");
  const [aadhaar, setAadhaar] = useState("");
  const [showDebitCard, setShowDebitCard] = useState(false);
  const [showAadhaar, setShowAadhaar] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [registrationId, setRegistrationId] = useState("");
  const [maskedMobile, setMaskedMobile] = useState("");
  const [otp, setOtp] = useState("");
  const [resendIn, setResendIn] = useState(0);
  const [notice, setNotice] = useState("");
  const [isVerified, setIsVerified] = useState(false);

  useEffect(() => {
    if (resendIn <= 0) return undefined;
    const timeoutId = window.setTimeout(() => setResendIn((seconds) => seconds - 1), 1000);
    return () => window.clearTimeout(timeoutId);
  }, [resendIn]);

  const postJson = async <T,>(url: string, body: unknown) => {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = (await response.json()) as T & { error?: string };
    if (!response.ok) throw new Error(data.error ?? "Something went wrong");
    return data;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    setIsSubmitting(true);

    try {
      const data = await postJson<{ registrationId: string; mobile: string; resendAfterSeconds: number }>(
        "/api/register/customer",
        { firstName, lastName, mobile, debitCard, aadhaar, password },
      );
      setRegistrationId(data.registrationId);
      setMaskedMobile(data.mobile);
      setResendIn(data.resendAfterSeconds);
      setOtp("");
      setNotice("");
      setDebitCard("");
      setAadhaar("");
      setPassword("");
      setConfirmPassword("");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to create account");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyOtp = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setNotice("");
    setIsSubmitting(true);

    try {
      await postJson("/api/register/verify-otp", { registrationId, otp });
      setIsVerified(true);
    } catch (verifyError) {
      setError(verifyError instanceof Error ? verifyError.message : "Unable to verify OTP");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendOtp = async () => {
    setError("");
    setNotice("");

    try {
      const data = await postJson<{ resendAfterSeconds: number }>("/api/register/resend-otp", { registrationId });
      setResendIn(data.resendAfterSeconds);
      setOtp("");
      setNotice("A new OTP has been sent.");
    } catch (resendError) {
      setError(resendError instanceof Error ? resendError.message : "Unable to resend OTP");
    }
  };

  if (registrationId) {
    return (
      <RegisterShell step={isVerified ? 4 : 2}>
        <Box
          component={isVerified ? "div" : "form"}
          onSubmit={isVerified ? undefined : handleVerifyOtp}
          sx={{ width: "100%", maxWidth: 440, mx: "auto", textAlign: "center" }}
        >
          {isVerified ? (
            <>
              <CheckCircleIcon sx={{ fontSize: 72, color: "#318622" }} />
              <Typography variant="h4" sx={{ mt: 2, fontWeight: 800, color: "#17233d" }}>
                Account verified
              </Typography>
              <Typography sx={{ mt: 1, color: "#66738b" }}>
                Welcome to CashReady, {firstName}! Log in with your mobile number and password.
              </Typography>
              <Button fullWidth variant="contained" onClick={() => navigate("/login/customer")} sx={{ ...primaryButtonSx, mt: 4 }}>
                Go to Login
              </Button>
            </>
          ) : (
            <>
              <SmsIcon sx={{ fontSize: 72, color: "#2444cf" }} />
              <Typography variant="h4" sx={{ mt: 2, fontWeight: 800, color: "#17233d" }}>
                Verify mobile number
              </Typography>
              <Typography sx={{ mt: 1, color: "#66738b" }}>
                Enter the 6-digit OTP sent to <strong>{maskedMobile}</strong>
              </Typography>
              <TextField
                fullWidth
                required
                autoFocus
                placeholder="------"
                autoComplete="one-time-code"
                value={otp}
                onChange={(event) => setOtp(event.target.value.replace(/\D/g, "").slice(0, 6))}
                slotProps={{
                  htmlInput: {
                    "aria-label": "OTP",
                    inputMode: "numeric",
                    minLength: 6,
                    maxLength: 6,
                    style: { textAlign: "center", fontSize: 28, letterSpacing: 12, fontWeight: 700 },
                  },
                }}
                sx={{ ...fieldSx, mt: 3 }}
              />
              <Button fullWidth type="submit" variant="contained" disabled={isSubmitting || otp.length !== 6} sx={{ ...primaryButtonSx, mt: 3 }}>
                {isSubmitting ? "Verifying..." : "Verify OTP"}
              </Button>

              {error && (
                <Typography role="alert" sx={{ mt: 2, color: "#c62828", fontSize: 14 }}>
                  {error}
                </Typography>
              )}
              {notice && (
                <Typography role="status" sx={{ mt: 2, color: "#318622", fontSize: 14 }}>
                  {notice}
                </Typography>
              )}

              <Box sx={{ display: "flex", gap: 1.5, mt: 2 }}>
                <Button fullWidth type="button" onClick={() => { setRegistrationId(""); setError(""); }} sx={{ color: "#2444cf", textTransform: "none" }}>
                  Wrong number? Go back
                </Button>
                <Button fullWidth type="button" disabled={resendIn > 0} onClick={handleResendOtp} sx={{ color: "#2444cf", textTransform: "none", fontWeight: 700 }}>
                  {resendIn > 0 ? `Resend OTP in ${resendIn}s` : "Resend OTP"}
                </Button>
              </Box>
            </>
          )}
        </Box>
      </RegisterShell>
    );
  }

  const visibilityToggle = (visible: boolean, onToggle: () => void, label: string) => (
    <InputAdornment position="end">
      <IconButton
        aria-label={visible ? `Hide ${label}` : `Show ${label}`}
        onClick={onToggle}
        edge="end"
      >
        {visible ? <VisibilityOff /> : <Visibility />}
      </IconButton>
    </InputAdornment>
  );

  return (
    <RegisterShell step={1}>
      <Box component="form" onSubmit={handleSubmit} sx={{ width: "100%", maxWidth: 620, mx: "auto" }}>
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
            <Typography variant="h5" sx={{ fontWeight: 800, color: "#17233d", lineHeight: 1.1 }}>
              CashReady
            </Typography>
            <Typography variant="caption" sx={{ color: "#71809b", letterSpacing: 1.2 }}>
              AI BANKING PLATFORM
            </Typography>
          </Box>
        </Box>

        <Typography variant="h4" sx={{ mt: 5, fontWeight: 800, color: "#17233d" }}>
          Create your account
        </Typography>
        <Typography sx={{ mt: 1, color: "#66738b" }}>
          Register as a new CashReady customer.
        </Typography>

        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, columnGap: 2 }}>
          <Box>
            <Typography component="label" htmlFor="firstName" sx={labelSx}>
              First Name
            </Typography>
            <TextField
              id="firstName"
              fullWidth
              required
              placeholder="Enter first name"
              value={firstName}
              onChange={(event) => setFirstName(event.target.value)}
              sx={fieldSx}
            />
          </Box>
          <Box>
            <Typography component="label" htmlFor="lastName" sx={labelSx}>
              Last Name
            </Typography>
            <TextField
              id="lastName"
              fullWidth
              required
              placeholder="Enter last name"
              value={lastName}
              onChange={(event) => setLastName(event.target.value)}
              sx={fieldSx}
            />
          </Box>
        </Box>

        <Typography component="label" htmlFor="mobile" sx={labelSx}>
          Mobile Number
        </Typography>
        <TextField
          id="mobile"
          type="tel"
          fullWidth
          required
          placeholder="Enter 10-digit mobile number"
          autoComplete="tel-national"
          value={mobile}
          onChange={(event) => setMobile(event.target.value.replace(/\D/g, "").slice(0, 10))}
          slotProps={{
            htmlInput: { inputMode: "numeric", pattern: "[6-9][0-9]{9}", title: "10-digit mobile number starting with 6, 7, 8 or 9", maxLength: 10 },
            input: { startAdornment: <InputAdornment position="start">+91</InputAdornment> },
          }}
          sx={fieldSx}
        />

        <Typography component="label" htmlFor="debitCard" sx={labelSx}>
          Debit Card Number
        </Typography>
        <TextField
          id="debitCard"
          type={showDebitCard ? "text" : "password"}
          fullWidth
          required
          placeholder="Enter 16-digit card number"
          autoComplete="off"
          value={debitCard}
          onChange={(event) => setDebitCard(event.target.value.replace(/\D/g, "").slice(0, 16))}
          slotProps={{
            htmlInput: { inputMode: "numeric", minLength: 16, maxLength: 16 },
            input: {
              endAdornment: visibilityToggle(showDebitCard, () => setShowDebitCard((value) => !value), "debit card number"),
            },
          }}
          sx={fieldSx}
        />

        <Typography component="label" htmlFor="aadhaar" sx={labelSx}>
          Aadhaar Number
        </Typography>
        <TextField
          id="aadhaar"
          type={showAadhaar ? "text" : "password"}
          fullWidth
          required
          placeholder="Enter 12-digit Aadhaar number"
          autoComplete="off"
          value={aadhaar}
          onChange={(event) => setAadhaar(event.target.value.replace(/\D/g, "").slice(0, 12))}
          slotProps={{
            htmlInput: { inputMode: "numeric", minLength: 12, maxLength: 12 },
            input: {
              endAdornment: visibilityToggle(showAadhaar, () => setShowAadhaar((value) => !value), "Aadhaar number"),
            },
          }}
          sx={fieldSx}
        />

        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, columnGap: 2 }}>
          <Box>
            <Typography component="label" htmlFor="newPassword" sx={labelSx}>
              Password
            </Typography>
            <TextField
              id="newPassword"
              type={showPassword ? "text" : "password"}
              fullWidth
              required
              placeholder="Minimum 8 characters"
              autoComplete="new-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              slotProps={{
                htmlInput: { minLength: 8, maxLength: 128 },
                input: {
                  endAdornment: visibilityToggle(showPassword, () => setShowPassword((value) => !value), "password"),
                },
              }}
              sx={fieldSx}
            />
          </Box>
          <Box>
            <Typography component="label" htmlFor="confirmPassword" sx={labelSx}>
              Confirm Password
            </Typography>
            <TextField
              id="confirmPassword"
              type={showPassword ? "text" : "password"}
              fullWidth
              required
              placeholder="Re-enter password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              error={Boolean(confirmPassword) && confirmPassword !== password}
              helperText={confirmPassword && confirmPassword !== password ? "Passwords do not match" : " "}
              slotProps={{ htmlInput: { minLength: 8, maxLength: 128 } }}
              sx={fieldSx}
            />
          </Box>
        </Box>

        <Button fullWidth type="submit" variant="contained" disabled={isSubmitting} sx={{ ...primaryButtonSx, mt: 4 }}>
          {isSubmitting ? "Sending OTP..." : "Create Account"}
        </Button>

        {error && (
          <Typography role="alert" sx={{ mt: 2, color: "#c62828", fontSize: 14 }}>
            {error}
          </Typography>
        )}

        <Button
          fullWidth
          type="button"
          onClick={() => navigate("/login/customer")}
          sx={{ mt: 1.5, color: "#2444cf", textTransform: "none" }}
        >
          Already a customer? Login
        </Button>
      </Box>
    </RegisterShell>
  );
}
