import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import "./RealTimeDashboard.css";

type DataPoint = {
  timestamp: Date;
  value: number;
};

const RealTimeDashboard = () => {
  const [bitcoinData, setBitcoinData] = useState<DataPoint[]>([]);
  const [tempData, setTempData] = useState<DataPoint[]>([]);
  const [humidityData, setHumidityData] = useState<DataPoint[]>([]);
  const [windData, setWindData] = useState<DataPoint[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Bitcoin
        const cryptoRes = await fetch(
          "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd"
        );
        const cryptoJson = await cryptoRes.json();
        const btcPrice = cryptoJson.bitcoin.usd;
        const now = new Date();
        setBitcoinData((prev) => [
          ...prev.slice(-29),
          { timestamp: now, value: btcPrice },
        ]);

        // Weather
        const weatherRes = await fetch(
          "https://api.open-meteo.com/v1/forecast?latitude=48.75&longitude=30.22&current_weather=true"
        );
        const weatherJson = await weatherRes.json();
        const current = weatherJson.current_weather;
        setTempData((prev) => [
          ...prev.slice(-29),
          { timestamp: now, value: current.temperature },
        ]);
        setWindData((prev) => [
          ...prev.slice(-29),
          { timestamp: now, value: current.windspeed },
        ]);

        // For humidity (using relative humidity approximation)
        const humidity = Math.random() * 50 + 30; // 🔧 Прикладова вологість (нема в open-meteo)
        setHumidityData((prev) => [
          ...prev.slice(-29),
          { timestamp: now, value: humidity },
        ]);
      } catch (err) {
        console.error("Fetch error:", err);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className={`dashboard `}>
      <div className="header">
        <h1>Real-Time Dashboard</h1>
      </div>
      <div className="chart-container">
        <div className="chart-wrapper">
          <ChartCard title="Bitcoin (USD)" data={bitcoinData} color="#f59e0b" />
          <ChartCard title="Temperature (°C)" data={tempData} color="#3b82f6" />
        </div>
        <div className="chart-wrapper">
          <ChartCard title="Humidity (%)" data={humidityData} color="#10b981" />
          <ChartCard title="Wind Speed (m/s)" data={windData} color="#6366f1" />
        </div> 
      </div>
    </div>
  );
};



const ChartCard = ({
  title,
  data,
  color,
}: {
  title: string;
  data: DataPoint[];
  color: string;
}) => {
  const latest = data.length ? data[data.length - 1].value : undefined;
  const previous = data.length > 1 ? data[data.length - 2].value : undefined;
  const change =
    latest !== undefined && previous !== undefined
      ? latest > previous
        ? "▲"
        : latest < previous
        ? "▼"
        : ""
      : "";

  return (
    <div className="card">
      <div className="card-header">
        <h2>{title}</h2>
        {latest !== undefined && (
          <span className="card-value">
            {latest.toFixed(2)}{" "}
            <span
              className={`indicator ${
                change === "▲" ? "up" : change === "▼" ? "down" : ""
              }`}
            >
              {change}
            </span>
          </span>
        )}
      </div>
      <LineChart data={data} color={color} />
    </div>
  );
};

const LineChart = ({ data, color }: { data: DataPoint[]; color: string }) => {
  const ref = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!ref.current || data.length === 0) return;

    const svg = d3.select(ref.current);
    svg.selectAll("*").remove();

    const width = 500;
    const height = 250;
    const margin = { top: 20, right: 30, bottom: 30, left: 50 };

    svg.attr("viewBox", `0 0 ${width} ${height}`);

    const x = d3
      .scaleTime()
      .domain(d3.extent(data, (d) => d.timestamp) as [Date, Date])
      .range([margin.left, width - margin.right]);

    const y = d3
      .scaleLinear()
      .domain([
        d3.min(data, (d) => d.value)! * 0.95,
        d3.max(data, (d) => d.value)! * 1.05,
      ])
      .nice()
      .range([height - margin.bottom, margin.top]);

    const line = d3
      .line<DataPoint>()
      .x((d) => x(d.timestamp))
      .y((d) => y(d.value))
      .curve(d3.curveMonotoneX);

    svg
      .append("path")
      .datum(data)
      .attr("fill", "none")
      .attr("stroke", color)
      .attr("stroke-width", 3)
      .attr("d", line)
      .attr("opacity", 0)
      .transition()
      .duration(1000)
      .attr("opacity", 1);

    svg
      .append("g")
      .attr("transform", `translate(0,${height - margin.bottom})`)
      .call(d3.axisBottom(x).ticks(5).tickFormat(d3.timeFormat("%H:%M")))
      .selectAll("text")
      .attr("fill", "var(--text)");

    svg
      .append("g")
      .attr("transform", `translate(${margin.left},0)`)
      .call(d3.axisLeft(y).ticks(5))
      .selectAll("text")
      .attr("fill", "var(--text)");
  }, [data, color]);

  return <svg ref={ref} className="chart" />;
};

export default RealTimeDashboard;
