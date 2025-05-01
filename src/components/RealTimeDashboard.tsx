import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import "./RealTimeDashboard.css"

type CryptoDataPoint = { timestamp: Date; price: number };
type WeatherDataPoint = { timestamp: Date; temperature: number };

const RealTimeDashboard = () => {
  const [cryptoData, setCryptoData] = useState<CryptoDataPoint[]>([]);
  const [weatherData, setWeatherData] = useState<WeatherDataPoint[]>([]);

  useEffect(() => {
    const fetchCrypto = async () => {
      try {
        const res = await fetch(
          'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd'
        );
        const json = await res.json();
        const price = json.bitcoin.usd;
        setCryptoData(prev => [...prev.slice(-29), { timestamp: new Date(), price }]);
      } catch (err) {
        console.error('Crypto error:', err);
      }
    };

    const fetchWeather = async () => {
      try {
        const res = await fetch(
          'https://api.open-meteo.com/v1/forecast?latitude=48.75&longitude=30.22&current_weather=true'
        );
        const json = await res.json();
        const temperature = json.current_weather.temperature;
        setWeatherData(prev => [...prev.slice(-29), { timestamp: new Date(), temperature }]);
      } catch (err) {
        console.error('Weather error:', err);
      }
    };

    fetchCrypto();
    fetchWeather();
    const interval = setInterval(() => {
      fetchCrypto();
      fetchWeather();
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="dashboard">
      <h1>Real-Time Dashboard</h1>
      <div className="cards">
        <Card title="Bitcoin Price (USD)" value={cryptoData.at(-1)?.price.toFixed(2)}>
          <LineChart data={cryptoData} dataKey="price" color="#f59e0b" />
        </Card>
        <Card title="Temperature in Uman (°C)" value={weatherData.at(-1)?.temperature.toFixed(1)}>
          <LineChart data={weatherData} dataKey="temperature" color="#3b82f6" />
        </Card>
      </div>
    </div>
  );
};

const Card = ({ title, value, children }: { title: string; value?: string; children: React.ReactNode }) => (
  <div className="card">
    <div className="card-header">
      <h2>{title}</h2>
      {value && <span className="card-value">{value}</span>}
    </div>
    {children}
  </div>
);

const LineChart = ({
  data,
  dataKey,
  color,
}: {
  data: { timestamp: Date; [key: string]: number }[];
  dataKey: string;
  color: string;
}) => {
  const ref = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!ref.current || data.length === 0) return;

    const svg = d3.select(ref.current);
    svg.selectAll('*').remove();

    const width = 500;
    const height = 250;
    const margin = { top: 20, right: 30, bottom: 30, left: 50 };

    svg.attr('viewBox', `0 0 ${width} ${height}`);

    const x = d3
      .scaleTime()
      .domain(d3.extent(data, d => d.timestamp) as [Date, Date])
      .range([margin.left, width - margin.right]);

    const y = d3
      .scaleLinear()
      .domain([
        d3.min(data, d => d[dataKey])! * 0.95,
        d3.max(data, d => d[dataKey])! * 1.05,
      ])
      .nice()
      .range([height - margin.bottom, margin.top]);

    const line = d3
      .line<any>()
      .x(d => x(d.timestamp))
      .y(d => y(d[dataKey]))
      .curve(d3.curveMonotoneX);

    svg
      .append('path')
      .datum(data)
      .attr('fill', 'none')
      .attr('stroke', color)
      .attr('stroke-width', 3)
      .attr('d', line);

    svg
      .append('g')
      .attr('transform', `translate(0,${height - margin.bottom})`)
      .call(d3.axisBottom(x).ticks(5).tickFormat(d3.timeFormat('%H:%M:%S') as any))
      .selectAll('text')
      .attr('fill', 'white');

    svg
      .append('g')
      .attr('transform', `translate(${margin.left},0)`)
      .call(d3.axisLeft(y).ticks(5))
      .selectAll('text')
      .attr('fill', 'white');
  }, [data, dataKey, color]);

  return <svg ref={ref} className="chart" />;
};

export default RealTimeDashboard;
