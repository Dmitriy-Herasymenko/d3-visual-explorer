import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

type NodeType = {
  id: string;
};

type LinkType = {
  source: string;
  target: string;
};

const nodes: NodeType[] = [
  { id: 'React' },
  { id: 'D3.js' },
  { id: 'TypeScript' },
  { id: 'JavaScript' },
  { id: 'SVG' },
  { id: 'React' },
  { id: 'D3.js' },
  { id: 'TypeScript' },
  { id: 'JavaScript' },
  { id: 'SVG' },
];

const links: LinkType[] = [
  { source: 'React', target: 'D3.js' },
  { source: 'D3.js', target: 'JavaScript' },
  { source: 'TypeScript', target: 'JavaScript' },
  { source: 'React', target: 'TypeScript' },
  { source: 'D3.js', target: 'SVG' },
  { source: 'React', target: 'D3.js' },
  { source: 'D3.js', target: 'JavaScript' },
  { source: 'TypeScript', target: 'JavaScript' },
  { source: 'React', target: 'TypeScript' },
  { source: 'D3.js', target: 'SVG' },
];

const ForceGraph: React.FC = () => {
  const svgRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    if (!svgRef.current) return;

    const width = 600;
    const height = 400;

    const svg = d3.select(svgRef.current)
      .attr('viewBox', `0 0 ${width} ${height}`)
      .style('border', '1px solid #fff');

    const simulation = d3.forceSimulation<NodeType>(nodes)
      .force('link', d3.forceLink<NodeType, LinkType>(links).id(d => d.id).distance(100))
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(width / 2, height / 2));

    const link = svg.append('g')
      .attr('stroke', '#999')
      .attr('stroke-opacity', 0.6)
      .selectAll('line')
      .data(links)
      .join('line')
      .attr('stroke-width', 2);

    const node = svg.append('g')
      .attr('stroke', '#fff')
      .attr('stroke-width', 1.5)
      .selectAll('circle')
      .data(nodes)
      .join('circle')
      .attr('r', 10)
      .attr('fill', '#007bff')
      .call(drag(simulation));

    const label = svg.append('g')
      .selectAll('text')
      .data(nodes)
      .join('text')
      .text(d => d.id)
      .attr('font-size', 12)
      .attr('text-anchor', 'middle')
      .attr('dy', -15);

    simulation.on('tick', () => {
      link
        .attr('x1', d => (d.source as NodeType).x!)
        .attr('y1', d => (d.source as NodeType).y!)
        .attr('x2', d => (d.target as NodeType).x!)
        .attr('y2', d => (d.target as NodeType).y!);

      node
        .attr('cx', d => d.x!)
        .attr('cy', d => d.y!);

      label
        .attr('x', d => d.x!)
        .attr('y', d => d.y!);
    });

    function drag(sim: d3.Simulation<NodeType, LinkType>) {
      return d3.drag<SVGCircleElement, NodeType>()
        .on('start', (event, d) => {
          if (!event.active) sim.alphaTarget(0.3).restart();
          d.fx = d.x;
          d.fy = d.y;
        })
        .on('drag', (event, d) => {
          d.fx = event.x;
          d.fy = event.y;
        })
        .on('end', (event, d) => {
          if (!event.active) sim.alphaTarget(0);
          d.fx = null;
          d.fy = null;
        });
    }
  }, []);

  return <svg ref={svgRef} width="100%" height="400px" />;
};

export default ForceGraph;
