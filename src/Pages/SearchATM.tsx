import { Box, Button, Card, Chip, TextField, Typography } from "@mui/material";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function SearchATM() {
  const navigate = useNavigate();
  const [amount, setAmount] = useState("");
  const [error, setError] = useState("");
  const handleSearch = () => {
    const value = Number(amount);
    if (!Number.isFinite(value) || value <= 0) { setError("Enter a valid withdrawal amount."); return; }
    if (value > 75000) { setError("The requested amount exceeds your daily withdrawal limit."); return; }
    setError("");
    localStorage.setItem("cashready_search_amount", String(value));
    localStorage.setItem("cashready_customer_limit", "75000");
    navigate("/map");
  };
  return <Box sx={{ minHeight: "100vh", background: "#F5F7FA", p: 4 }}>
    <Typography variant="h4" sx={{ fontWeight: "bold", color: "#16324F", mb: 4 }}>💵 CashReady Search</Typography>
    <Card sx={{ maxWidth: 900, mx: "auto", p: 5, borderRadius: 6, boxShadow: 5 }}>
      <Typography variant="h4" sx={{ fontWeight: "bold", color: "#16324F" }}>How Much Cash Do You Need Today?</Typography>
      <Typography sx={{ mt: 1, color: "#64748B" }}>Enter your withdrawal amount and let AI find the best ATM for you.</Typography>
      <TextField fullWidth label="Enter Amount" placeholder="₹50,000" value={amount} onChange={(event) => { setAmount(event.target.value); setError(""); }} sx={{ mt: 4 }} />
      {error && <Typography role="alert" sx={{ mt: 1, color: "#b42318", fontSize: 14 }}>{error}</Typography>}
      <Box sx={{ display: "flex", gap: 2, mt: 3, flexWrap: "wrap" }}>{["10000", "20000", "50000", "75000"].map((preset) => <Chip key={preset} label={`₹${Number(preset).toLocaleString()}`} onClick={() => setAmount(preset)} color="primary" />)}</Box>
      <Card sx={{ mt: 4, p: 3, borderRadius: 4, bgcolor: "#EEF5FF" }}><Typography sx={{ color: "#64748B" }}>Daily Withdrawal Limit</Typography><Typography variant="h4" sx={{ fontWeight: "bold", color: "#0F766E" }}>₹75,000</Typography></Card>
      <Card sx={{ mt: 4, p: 3, borderRadius: 4, bgcolor: "#F8FAFC", border: "1px solid #E2E8F0" }}><Typography sx={{ fontWeight: "bold", color: "#16324F" }}>🤖 AI Assistant</Typography><Typography sx={{ mt: 1, color: "#475569" }}>Based on customer location, ATM health, and historical usage trends, CashReady can identify the most reliable ATM for your withdrawal request.</Typography></Card>
      <Button fullWidth variant="contained" sx={{ mt: 4, py: 2, borderRadius: 3, fontSize: "16px", fontWeight: "bold", background: "linear-gradient(135deg,#16324F,#0F766E)" }} onClick={handleSearch}>🔍 FIND ELIGIBLE ATMs</Button>
    </Card>
  </Box>;
}
