import React, { useEffect, useState } from "react";
import './Dashboard.css';
import axios from "axios";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
  PieChart, Pie, Cell, Legend, ResponsiveContainer
} from "recharts";

const Dashboard = () => {
  const [stockCount, setStockCount] = useState(0);
  const [frequenceData, setFrequenceData] = useState([]);
  const [fonctionDistribution, setFonctionDistribution] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const stockRes = await axios.get("/api/dashboard/stock-count");
      setStockCount(stockRes.data.total);

      const frequenceRes = await axios.get("/api/dashboard/frequence-usage");
      setFrequenceData(frequenceRes.data);

      const fonctionRes = await axios.get("/api/dashboard/distribution-par-fonction");
      setFonctionDistribution(fonctionRes.data);
    } catch (err) {
      console.error("Erreur chargement dashboard", err);
    }
  };

  return (
    <div className="dashboard-container">
      <h1 className="dashboard-title">Dashboard</h1>

      <div className="dashboard-grid">
        <div className="card green">
          <h2>Total matériels en stock</h2>
          <p className="count">{stockCount}</p>
        </div>

        <div className="card blue chart">
          <h2>Fréquence d'utilisation</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={frequenceData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="frequence" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card yellow chart">
          <h2>Équipements par fonction</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={fonctionDistribution}
                dataKey="count"
                nameKey="fonction"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label
              >
                {fonctionDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"];

export default Dashboard;
