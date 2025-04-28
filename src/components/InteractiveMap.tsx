import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import * as topojson from 'topojson-client';

const MapComponent = () => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [rotation, setRotation] = useState([0, 0]);

  useEffect(() => {
    const width = 1000;
    const height = 600;

    const svg = d3.select(svgRef.current)
      .attr('viewBox', `0 0 ${width} ${height}`)
      .style('width', '100%')
      .style('height', 'auto');

    d3.json('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json')
      .then((worldData) => {
        const countries = topojson.feature(worldData as any, worldData.objects.countries);

        const projection = d3.geoOrthographic()
          .scale(300)
          .translate([width / 2, height / 2])
          .rotate(rotation); 

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

        const zoom = d3.zoom()
          .scaleExtent([1, 8])  
          .on('zoom', (event: any) => {
            const [angleY, angleX] = event.transform.k ? 
                [event.transform.x, event.transform.y] : rotation;
            setRotation([angleY, angleX]); 
            projection.rotate([angleY, angleX]);  
            svg.selectAll('path').attr('d', path as any);  
            svg.selectAll('text').attr('x', (d) => {
              const centroid = path.centroid(d as any);
              return centroid[0];
            }).attr('y', (d) => {
              const centroid = path.centroid(d as any);
              return centroid[1];
            });
          });

        svg.call(zoom);

      })
      .catch((error) => {
        console.error('Error loading map data:', error);
      });

  }, [rotation]);

  return (
    <svg ref={svgRef}></svg>
  );
};

export default MapComponent;
