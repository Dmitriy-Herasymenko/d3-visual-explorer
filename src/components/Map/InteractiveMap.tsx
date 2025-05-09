import { useEffect, useState, useRef } from "react";
import * as d3 from "d3";
import * as topojson from "topojson-client";
import "./MapComponent.css";

type WorldData = topojson.Topology; // Define the TopoJSON type

const MapComponent = () => {
  const svgRef = useRef<SVGSVGElement>(null);
  const projectionRef = useRef<any>(null);
  const pathRef = useRef<any>(null);
  const featuresRef = useRef<any[]>([]);
  const rotationRef = useRef<[number, number]>([0, 0]);
  const draggingRef = useRef(false);

  const [countryInfo, setCountryInfo] = useState<string>("");
  const [zoomLevel, setZoomLevel] = useState<number>(250);
  const [theme, setTheme] = useState<"light" | "dark">("light"); // додали стан для теми

  const updateZoom = (event: any) => {
    setZoomLevel(event.target.value);
  };

  const getCurrentTimeInCountry = (countryName: string) => {
    const countryTime = new Date().toLocaleString("en-US", { timeZone: "UTC" });
    return `${countryName}: ${countryTime}`;
  };

  useEffect(() => {
    const width = 900; // Increased width for more space
    const height = 900;

    const svg = d3
      .select(svgRef.current)
      .attr("viewBox", `0 0 ${width} ${height}`)
      .style("width", "100%")
      .style("height", "auto");

    d3.json(
      "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json"
    ).then((worldData) => {
      const data = worldData as WorldData;

      const countries = topojson.feature(data, data.objects.countries);

      const featureCollection: GeoJSON.FeatureCollection<GeoJSON.Geometry> = {
        type: "FeatureCollection",
        features: Array.isArray(countries.features)
          ? countries.features
          : [countries],
      };

      featuresRef.current = featureCollection.features;

      const projection = d3
        .geoOrthographic()
        .scale(zoomLevel)
        .translate([width / 2, height / 2])
        .clipAngle(90)
        .rotate(rotationRef.current);

      projectionRef.current = projection;

      const path = d3.geoPath().projection(projection);
      pathRef.current = path;

      const colorScale = d3.scaleOrdinal(d3.schemeSet3);

      svg
        .insert("path", ":first-child")
        .datum({ type: "Sphere" })
        .attr("class", "ocean")
        .attr("d", path)
        .attr("fill", "#cce5f6");

      svg
        .selectAll("path.country")
        .data(featuresRef.current)
        .enter()
        .append("path")
        .attr("class", "country")
        .attr("d", path)
        .attr("fill", (d, i) => colorScale(i.toString()))
        .attr("stroke", "#333")
        .attr("stroke-width", 0.5)
        .on("click", (event, d) => {
          const countryName = d.properties.name;
          const timeInCountry = getCurrentTimeInCountry(countryName);
          setCountryInfo(timeInCountry);
        });

      let startRotate: [number, number] = [0, 0];
      let startPos: [number, number] = [0, 0];

      const drag = d3
        .drag<SVGSVGElement, unknown>()
        .on("start", (event) => {
          draggingRef.current = true;
          startRotate = projection.rotate();
          startPos = [event.x, event.y];
        })
        .on("drag", (event) => {
          const dx = event.x - startPos[0];
          const dy = event.y - startPos[1];
          const newRotate: [number, number] = [
            startRotate[0] + dx / 2,
            startRotate[1] - dy / 2,
          ];
          projection.rotate(newRotate);
          rotationRef.current = newRotate;
          svg.selectAll("path.country").attr("d", path);
          svg.selectAll("path.ocean").attr("d", path);
        })
        .on("end", () => {
          draggingRef.current = false;
        });
      svg.call(drag);
    });
  }, [zoomLevel]);

  useEffect(() => {
    if (projectionRef.current) {
      const svg = d3.select(svgRef.current);
      projectionRef.current.scale(zoomLevel);
      svg.selectAll("path.country").attr("d", pathRef.current);
      svg.selectAll("path.ocean").attr("d", pathRef.current);
    }
  }, [zoomLevel]);

  useEffect(() => {
    const svg = d3.select(svgRef.current);

    const timer = d3.timer(() => {
      if (
        !projectionRef.current ||
        !pathRef.current ||
        !featuresRef.current.length ||
        draggingRef.current
      )
        return;

      const rotation = projectionRef.current.rotate();
      const speed = 0.02;
      const newRotation = [rotation[0] + speed, rotation[1]];
      projectionRef.current.rotate(newRotation);
      rotationRef.current = newRotation;

      svg.selectAll("path.country").attr("d", pathRef.current);
      svg.selectAll("path.ocean").attr("d", pathRef.current);
    });

    return () => timer.stop();
  }, []);

  return (
    <div className="container">
      <div className="header">
        <h1>Real-Time Dashboard</h1>
      </div>
      <div className="container-map">
        <div style={{ flex: 1, width: "100%" }}>
          <svg ref={svgRef} style={{ width: "100%", height: "100%" }}></svg>
        </div>
        <div
          style={{
            width: "500px",
            padding: "20px",
            height: "100vh",
            overflowY: "auto",
          }}
        >
          <h2 style={{ fontSize: "24px", fontWeight: "bold" }}>Country Info</h2>
          <p style={{ fontSize: "16px" }}>{countryInfo}</p>
          <h3 style={{ fontSize: "20px" }}>Zoom</h3>
          <input
            type="range"
            min="100"
            max="500"
            value={zoomLevel}
            onChange={updateZoom}
            style={{
              width: "100%",
              marginTop: "10px",
              marginBottom: "20px",
              borderRadius: "8px",
              height: "10px",
            }}
          />
          <p style={{ fontSize: "16px" }}>Zoom Level: {zoomLevel}</p>
        </div>
      </div>
    </div>
  );
};

export default MapComponent;
