import { Box, Card, Chip, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

type DashboardSnapshot = {
  updatedAt: string;
  healthData: Array<{ name: string; value: number; color: string }>;
  trendData: Array<{ day: string; cash: number }>;
  queue: Array<{ id: string; location: string; status: string; level: string; color: string }>;
  activity: string[][];
  monitored: number;
  availability: string;
  withdrawals: string;
};

const emptySnapshot: DashboardSnapshot = {
  updatedAt: "",
  healthData: [],
  trendData: [],
  queue: [],
  activity: [],
  monitored: 0,
  availability: "0.0",
  withdrawals: "0.0",
};

export default function BankerDashboard() {
  const navigate = useNavigate();
  const [snapshot, setSnapshot] = useState(emptySnapshot);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const token = localStorage.getItem("cashready_token") ?? sessionStorage.getItem("cashready_token");
        const response = await fetch("/api/banker/dashboard", {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        const data: { dashboard?: DashboardSnapshot; error?: string } = await response.json();
        if (response.status === 401) {
          localStorage.removeItem("cashready_token");
          localStorage.removeItem("cashready_role");
          sessionStorage.removeItem("cashready_token");
          navigate("/login/banker");
          return;
        }
        if (!response.ok || !data.dashboard) throw new Error(data.error ?? "Unable to load dashboard");
        setSnapshot(data.dashboard);
        setError("");
      } catch (dashboardError) {
        setError(dashboardError instanceof Error ? dashboardError.message : "Unable to load dashboard");
      } finally {
        setIsLoading(false);
      }
    };

    void loadDashboard();
    const intervalId = window.setInterval(() => void loadDashboard(), 10000);
    return () => window.clearInterval(intervalId);
  }, [navigate]);

  const { healthData, trendData, queue, activity } = snapshot;
  if (isLoading) return <main className="development-page"><h1>Bank Analytics</h1><p className="page-subtitle">Loading live banking data...</p></main>;
  if (error) return <main className="development-page"><h1>Bank Analytics</h1><p className="page-subtitle" role="alert">{error}</p></main>;
  return (
    <main className="analytics-page">
      <Box className="analytics-heading">
        <Box><Typography variant="h3">Bank Analytics</Typography><Typography className="analytics-subtitle">A live view of ATM health, cash levels, and replenishment priorities.</Typography></Box>
      </Box>
      <Box className="analytics-kpis">
        <Card className="analytics-kpi"><span className="kpi-label">ATMs monitored</span><strong>{snapshot.monitored.toLocaleString()}</strong><small className="kpi-positive">Live network count</small></Card>
        <Card className="analytics-kpi"><span className="kpi-label">Cash availability</span><strong>{snapshot.availability}%</strong><small className="kpi-positive">Live provider signal</small></Card>
        <Card className="analytics-kpi"><span className="kpi-label">Daily withdrawals</span><strong>₹{snapshot.withdrawals}M</strong><small>Live estimate, Delhi NCR</small></Card>
        <Card className="analytics-kpi"><span className="kpi-label">Needs attention</span><strong className="kpi-alert">{healthData[1].value + healthData[2].value}</strong><small>{healthData[2].value} critical terminals</small></Card>
      </Box>
      <Box className="analytics-main-grid">
        <Card className="analytics-panel trend-panel"><Box className="panel-heading"><Box><Typography variant="h6">Cash demand trend</Typography><Typography className="panel-note">Average cash dispensed, ₹ thousands</Typography></Box><span className="panel-period">Last 6 days</span></Box><ResponsiveContainer width="100%" height={260}><BarChart data={trendData} margin={{ top: 15, right: 8, left: -18, bottom: 0 }}><CartesianGrid stroke="#E6EDF5" vertical={false} /><XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: "#718096", fontSize: 12 }} /><YAxis axisLine={false} tickLine={false} tick={{ fill: "#718096", fontSize: 12 }} /><Tooltip cursor={{ fill: "#F2F7FC" }} /><Bar dataKey="cash" fill="#0872C9" radius={[4, 4, 0, 0]} barSize={28} /></BarChart></ResponsiveContainer></Card>
        <Card className="analytics-panel health-panel"><Box className="panel-heading"><Box><Typography variant="h6">ATM health</Typography><Typography className="panel-note">Current fleet distribution</Typography></Box></Box><Box className="health-chart"><ResponsiveContainer width="100%" height={190}><PieChart><Pie data={healthData} dataKey="value" innerRadius={58} outerRadius={82} paddingAngle={3}>{healthData.map((item) => <Cell key={item.name} fill={item.color} />)}</Pie></PieChart></ResponsiveContainer><div><strong>140</strong><span>active ATMs</span></div></Box><Box className="health-legend">{healthData.map((item) => <span key={item.name}><i style={{ background: item.color }} />{item.name}<b>{item.value}</b></span>)}</Box></Card>
      </Box>
      <Box className="analytics-lower-grid">
        <Card className="analytics-panel queue-panel"><Box className="panel-heading"><Box><Typography variant="h6">Replenishment queue</Typography><Typography className="panel-note">Terminals requiring action</Typography></Box><Chip label="3 open" size="small" /></Box><Box className="queue-list">{queue.map((item) => <Box className="queue-row" key={item.id}><Box className="queue-name"><span className={`severity ${item.color}`} /><strong>{item.id}</strong><small>{item.location}</small></Box><Box className="queue-level"><strong>{item.level}</strong><small>{item.status}</small></Box></Box>)}</Box></Card>
        <Card className="analytics-panel insight-panel"><Typography className="panel-kicker">AI INSIGHT</Typography><Typography variant="h6">Weekend demand is expected to rise 18%</Typography><Typography className="insight-copy">Historical withdrawals and local event activity suggest increasing replenishment frequency across Delhi NCR this weekend.</Typography><Box className="insight-callout"><strong>Recommended action</strong><span>Schedule 12 additional cash runs before Saturday morning.</span></Box></Card>
      </Box>
      <Card className="analytics-panel activity-panel"><Box className="panel-heading"><Box><Typography variant="h6">Latest operations activity</Typography><Typography className="panel-note">Most recent network events</Typography></Box></Box><Box className="activity-table"><Box className="activity-header"><span>Terminal</span><span>Event</span><span>Time</span><span>Owner</span></Box>{activity.map((row) => <Box className="activity-row" key={row[0]}><strong>{row[0]}</strong><span>{row[1]}</span><span>{row[2]}</span><span>{row[3]}</span></Box>)}</Box></Card>
    </main>
  );
}
