import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import './ForceGraph.css';

type NodeType = {
  id: string;
  x?: number;
  y?: number;
  fx?: number | null;
  fy?: number | null;
};

type LinkType = {
  source: string;
  target: string;
};

const ForceGraph: React.FC = () => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [nodes, setNodes] = useState<NodeType[]>([]);
  const [links, setLinks] = useState<LinkType[]>([]);
  const [newNodeName, setNewNodeName] = useState<string>('');

  useEffect(() => {
    if (!svgRef.current) return;

    const width = 800;
    const height = 500;

    const svg = d3.select(svgRef.current)
      .attr('viewBox', `0 0 ${width} ${height}`)
      .style('border-radius', '12px');

    svg.selectAll('*').remove(); 

    svg.append('defs').append('radialGradient')
      .attr('id', 'gradBlue')
      .attr('cx', '50%')
      .attr('cy', '50%')
      .attr('r', '50%')
      .selectAll('stop')
      .data([
        { offset: '0%', color: '#00f' },
        { offset: '100%', color: '#005' }
      ])
      .join('stop')
      .attr('offset', d => d.offset)
      .attr('stop-color', d => d.color);

    const simulation = d3.forceSimulation(nodes)
      .force('link', d3.forceLink<NodeType, LinkType>(links).id(d => d.id).distance(120))
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(width / 2, height / 2));

    const link = svg.append('g')
      .attr('stroke', '#888')
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
      .attr('r', 12)
      .attr('fill', 'url(#gradBlue)')
      .style('filter', 'drop-shadow(0 0 5px #00f)')
      .call(drag(simulation));

    const label = svg.append('g')
      .selectAll('text')
      .data(nodes)
      .join('text')
      .text(d => d.id)
      .attr('font-size', 12)
      .attr('fill', '#eee')
      .attr('text-anchor', 'middle')
      .attr('dy', -18);

    simulation.on('tick', () => {
      link
        .attr('x1', d => (typeof d.source === 'object' ? d.source.x! : 0))
        .attr('y1', d => (typeof d.source === 'object' ? d.source.y! : 0))
        .attr('x2', d => (typeof d.target === 'object' ? d.target.x! : 0))
        .attr('y2', d => (typeof d.target === 'object' ? d.target.y! : 0));

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
  }, [nodes, links]);

  const addNode = () => {
    if (!newNodeName.trim()) return;

    const newNode: NodeType = {
      id: newNodeName.trim(),
      x: Math.random() * 800,
      y: Math.random() * 500,
    };

    setNodes(prev => {
      const updated = [...prev, newNode];

      if (prev.length > 0) {
        const last = prev[prev.length - 1];
        setLinks(prevLinks => [...prevLinks, { source: last.id, target: newNode.id }]);
      }

      return updated;
    });

    setNewNodeName('');
  };

  const clearGraph = () => {
    setNodes([]);
    setLinks([]);
  };

  return (
    <>
          <div className='container-node-add'>
        <input
          type="text"
          className='force-input'
          value={newNodeName}
          onChange={e => setNewNodeName(e.target.value)}
          placeholder="Enter the node name"
        />
        <button  className="theme-toggle" onClick={addNode}>Add</button>
        <button className="theme-toggle" onClick={clearGraph}>Clear</button>
      </div>
      <div className='container'>

<div><svg ref={svgRef} width="100%"  /></div>
</div>
    </>

  );
};

export default ForceGraph;
