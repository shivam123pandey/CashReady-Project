import { Box, Button, Card, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";
import CashReadyLogo from "../Components/CashReadyLogo";

export default function BackupLanding() {
  const navigate = useNavigate();

  return (
    <Box sx={{ minHeight: "100vh", background: "linear-gradient(135deg,#00175A,#006FCF)", display: "flex", justifyContent: "center", alignItems: "center", p: 4 }}>
      <Card sx={{ width: 900, p: 6, borderRadius: 6, textAlign: "center" }}>
        <Box sx={{ display: "flex", justifyContent: "center" }}>
          <CashReadyLogo />
        </Box>
        <Typography sx={{ mt: 2, color: "#64748B", fontSize: 20 }}>
          Never Visit an Empty ATM Again
        </Typography>
        <Box sx={{ display: "flex", gap: 4, mt: 6, justifyContent: "center", flexWrap: "wrap" }}>
          <Card sx={{ width: 300, p: 4, borderRadius: 5 }}>
            <Typography variant="h5" sx={{ fontWeight: "bold" }}>Customer Portal</Typography>
            <Typography sx={{ mt: 2 }}>
              Find nearby ATMs capable of fulfilling your withdrawal request.
            </Typography>
            <Button
              fullWidth
              variant="contained"
              sx={{ mt: 3, background: "linear-gradient(135deg,#00175A,#006FCF)" }}
              onClick={() => navigate("/home")}
            >
              Enter Customer Portal
            </Button>
          </Card>
          <Card sx={{ width: 300, p: 4, borderRadius: 5 }}>
            <Typography variant="h5" sx={{ fontWeight: "bold" }}>Banker Portal</Typography>
            <Typography sx={{ mt: 2 }}>
              Monitor ATM health, forecast cash availability and manage operations.
            </Typography>
            <Button
              fullWidth
              variant="contained"
              sx={{ mt: 3, background: "linear-gradient(135deg,#00175A,#006FCF)" }}
              onClick={() => navigate("/banker-dashboard")}
            >
              Enter Banker Portal
            </Button>
          </Card>
        </Box>
      </Card>
    </Box>
  );
}