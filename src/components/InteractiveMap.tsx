import  { useEffect, useRef } from 'react';
import * as d3 from 'd3';
// @ts-ignore
import * as topojson from 'topojson-client';
import { FeatureCollection, Geometry } from 'geojson';

const MapComponent = () => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const width = 1000;
    const height = 600;

    const svg = d3.select(svgRef.current)
      .attr('viewBox', `0 0 ${width} ${height}`)
      .style('width', '100%')
      .style('height', 'auto');

    d3.json<FeatureCollection<Geometry, { name: string }>>('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json')
      .then((worldData) => {
        if (!worldData) return;

        const countries = topojson.feature(worldData as any, (worldData as any).objects.countries) as FeatureCollection;

        const projection = d3.geoNaturalEarth1()
          .scale(160)
          .translate([width / 2, height / 2]);

        const path = d3.geoPath().projection(projection);

        const colorScale = d3.scaleOrdinal(d3.schemeCategory10);

        svg.selectAll('path')
          .data(countries.features)
          .enter()
          .append('path')
          .attr('d', path as any)
          .attr('fill', (d, i) => colorScale(String(i)))
          .attr('stroke', '#333')
          .attr('stroke-width', 0.5);

        svg.selectAll('text')
          .data(countries.features)
          .enter()
          .append('text')
          .attr('x', (d) => {
            const centroid = path.centroid(d as any);
            return centroid[0];
          })
          .attr('y', (d) => {
            const centroid = path.centroid(d as any);
            return centroid[1];
          })
          .text((d) => d.properties.name)
          .attr('text-anchor', 'middle')
          .attr('font-size', '8px')
          .attr('fill', 'black')
          .style('pointer-events', 'none'); 
      })
      .catch((error) => {
        console.error('Error loading map data:', error);
      });
  }, []);

  return (
    <svg ref={svgRef}></svg>
  );
};

export default MapComponent;
