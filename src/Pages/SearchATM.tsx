import {
  Box,
  Button,
  Card,
  Chip,
  TextField,
  Typography,
} from "@mui/material";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function SearchATM() {
  const navigate = useNavigate();
  const [amount, setAmount] = useState("");

  const handleSearch = () => {
    const value = Number(amount);

    if (!value) {
      alert("Please enter an amount");
      return;
    }

    if (value > 75000) {
      alert("The requested amount exceeds your daily withdrawal limit.");
      return;
    }

    localStorage.setItem("cashready_search_amount", String(value));
    localStorage.setItem("cashready_customer_limit", "75000");
    navigate("/results");
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: "#F5F7FA",
        p: 4,
      }}
    >
      <Typography
        variant="h4"
        sx={{
          fontWeight: "bold",
          color: "#16324F",
          mb: 4,
        }}
      >
        💵 CashReady Search
      </Typography>

      <Card
        sx={{
          maxWidth: 900,
          mx: "auto",
          p: 5,
          borderRadius: 6,
          boxShadow: 5,
        }}
      >
        <Typography
          variant="h4"
          sx={{
            fontWeight: "bold",
            color: "#16324F",
          }}
        >
          How Much Cash Do You Need Today?
        </Typography>

        <Typography
          sx={{
            mt: 1,
            color: "#64748B",
          }}
        >
          Enter your withdrawal amount and let AI find the
          best ATM for you.
        </Typography>

        <TextField
          fullWidth
          label="Enter Amount"
          placeholder="₹50,000"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          sx={{ mt: 4 }}
        />

        <Box
          sx={{
            display: "flex",
            gap: 2,
            mt: 3,
            flexWrap: "wrap",
          }}
        >
          <Chip
            label="₹10,000"
            onClick={() => setAmount("10000")}
            color="primary"
          />

          <Chip
            label="₹20,000"
            onClick={() => setAmount("20000")}
            color="primary"
          />

          <Chip
            label="₹50,000"
            onClick={() => setAmount("50000")}
            color="primary"
          />

          <Chip
            label="₹75,000"
            onClick={() => setAmount("75000")}
            color="primary"
          />
        </Box>

        <Card
          sx={{
            mt: 4,
            p: 3,
            borderRadius: 4,
            bgcolor: "#EEF5FF",
          }}
        >
          <Typography
            sx={{
              color: "#64748B",
            }}
          >
            Daily Withdrawal Limit
          </Typography>

          <Typography
            variant="h4"
            sx={{
              fontWeight: "bold",
              color: "#0F766E",
            }}
          >
            ₹75,000
          </Typography>
        </Card>

        <Card
          sx={{
            mt: 4,
            p: 3,
            borderRadius: 4,
            bgcolor: "#F8FAFC",
            border: "1px solid #E2E8F0",
          }}
        >
          <Typography
            sx={{
              fontWeight: "bold",
              color: "#16324F",
            }}
          >
            🤖 AI Assistant
          </Typography>

          <Typography
            sx={{
              mt: 1,
              color: "#475569",
            }}
          >
            Based on customer location, ATM health, and
            historical usage trends, CashReady can identify
            the most reliable ATM for your withdrawal
            request.
          </Typography>
        </Card>

        <Button
          fullWidth
          variant="contained"
          sx={{
            mt: 4,
            py: 2,
            borderRadius: 3,
            fontSize: "16px",
            fontWeight: "bold",
            background:
              "linear-gradient(135deg,#16324F,#0F766E)",
          }}
          onClick={handleSearch}
        >
          🔍 FIND ELIGIBLE ATMs
        </Button>
      </Card>
    </Box>
  );
}