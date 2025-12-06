import { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { isHabitUnlocked } from '../utils/habitData';

const HabitGraph = ({ habits, completedHabits, onHabitClick }) => {
  const svgRef = useRef();
  const containerRef = useRef();

  useEffect(() => {
    if (!habits.length) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const width = containerRef.current?.clientWidth || 1000;
    const height = 600;
    
    svg.attr('width', width).attr('height', height);

    // Create links (edges) between habits
    const links = habits.flatMap(habit => 
      habit.dependencies.map(depId => ({
        source: depId,
        target: habit.id,
      }))
    );

    // Create nodes with initial positions
    const nodes = habits.map(habit => ({
      id: habit.id,
      name: habit.name,
      color: habit.color,
      position: habit.position,
      unlocked: isHabitUnlocked(habit, completedHabits),
      completed: completedHabits.includes(habit.id),
      x: habit.position.x || width / 2 + (Math.random() - 0.5) * 200,
      y: habit.position.y || height / 2 + (Math.random() - 0.5) * 200,
    }));

    // Create force simulation
    const simulation = d3.forceSimulation(nodes)
      .force('link', d3.forceLink(links).id(d => d.id).distance(150))
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(60));

    // Draw links
    const link = svg.append('g')
      .selectAll('line')
      .data(links)
      .enter()
      .append('line')
      .attr('stroke', '#94a3b8')
      .attr('stroke-width', 2)
      .attr('stroke-opacity', 0.6)
      .attr('marker-end', 'url(#arrowhead)');

    // Create arrow marker
    svg.append('defs')
      .append('marker')
      .attr('id', 'arrowhead')
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 35)
      .attr('refY', 0)
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-5L10,0L0,5')
      .attr('fill', '#94a3b8');

    // Draw nodes
    const node = svg.append('g')
      .selectAll('g')
      .data(nodes)
      .enter()
      .append('g')
      .attr('class', 'node')
      .style('cursor', d => d.unlocked ? 'pointer' : 'not-allowed')
      .call(d3.drag()
        .on('start', dragstarted)
        .on('drag', dragged)
        .on('end', dragended));

    // Add rectangles for nodes
    const rects = node.append('rect')
      .attr('width', 120)
      .attr('height', 80)
      .attr('rx', 8)
      .attr('x', -60)
      .attr('y', -40)
      .attr('fill', d => d.color)
      .attr('opacity', d => {
        if (!d.unlocked) return 0.3;
        return d.completed ? 1 : 0.7;
      })
      .attr('stroke', d => d.completed ? '#10b981' : '#64748b')
      .attr('stroke-width', d => d.completed ? 3 : 2)
      .attr('filter', d => d.completed ? 'url(#glow)' : null);

    // Add glow filter for completed habits
    const defs = svg.append('defs');
    defs.append('filter')
      .attr('id', 'glow')
      .append('feGaussianBlur')
      .attr('stdDeviation', 3)
      .attr('result', 'coloredBlur');
    
    defs.select('#glow')
      .append('feMerge')
      .append('feMergeNode')
      .attr('in', 'coloredBlur');
    
    defs.select('#glow')
      .select('feMerge')
      .append('feMergeNode')
      .attr('in', 'SourceGraphic');

    // Add text labels
    const labels = node.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', -10)
      .attr('fill', '#ffffff')
      .attr('font-size', '14px')
      .attr('font-weight', 'bold')
      .text(d => d.name);

    // Add status text
    const statusText = node.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', 15)
      .attr('fill', '#ffffff')
      .attr('font-size', '12px')
      .text(d => {
        if (!d.unlocked) return 'Locked';
        return d.completed ? 'Completed' : 'Click to complete';
      });

    // Add click handler
    node.on('click', (event, d) => {
      if (d.unlocked) {
        onHabitClick(d.id);
      }
    });

    // Update positions on simulation tick
    simulation.on('tick', () => {
      link
        .attr('x1', d => d.source.x)
        .attr('y1', d => d.source.y)
        .attr('x2', d => d.target.x)
        .attr('y2', d => d.target.y);

      node.attr('transform', d => `translate(${d.x},${d.y})`);
    });

    // Drag functions
    function dragstarted(event, d) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }

    function dragged(event, d) {
      d.fx = event.x;
      d.fy = event.y;
    }

    function dragended(event, d) {
      if (!event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }

    // Cleanup
    return () => {
      simulation.stop();
    };
  }, [habits, completedHabits, onHabitClick]);

  return (
    <div ref={containerRef} className="w-full bg-slate-900 rounded-lg overflow-hidden">
      <svg ref={svgRef} className="w-full h-full"></svg>
    </div>
  );
};

export default HabitGraph;

