import { useEffect, useRef } from 'react';
import * as d3 from 'd3';

const HabitGraph = ({
  habits,
  edges = [],
  completedHabits = [],
  onHabitClick,
  criticalEdges = [],
  criticalNodes = [],
  showCriticalPath = false,
  topologicalLevels = {},
  keystoneHabitId = null
}) => {
  const svgRef = useRef();
  const containerRef = useRef();

  useEffect(() => {
    if (!habits.length) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const width = containerRef.current?.clientWidth || 900;
    const height = 550;

    svg.attr('viewBox', `0 0 ${width} ${height}`)
       .attr('width', '100%')
       .attr('height', height);

    // Deep copy edges for simulation mutation
    const links = edges.map(e => ({
      source: e.source,
      target: e.target,
      weight: e.weight || 1,
      isCritical: showCriticalPath && criticalEdges.some(
        ce => (ce.source === e.source && ce.target === e.target)
      )
    }));

    // Precalculate unlocked state
    const isUnlocked = (habit) => {
      const incoming = edges.filter(e => e.target === habit.id);
      return incoming.every(e => completedHabits.includes(e.source));
    };

    // Construct nodes with initial positions
    const nodes = habits.map(habit => {
      const level = topologicalLevels[habit.id] ?? 0;
      const xInit = habit.position?.x || (120 + level * 160);
      const yInit = habit.position?.y || (height / 2 + (Math.random() - 0.5) * 150);

      return {
        id: habit.id,
        name: habit.name,
        color: habit.color || '#3b82f6',
        durationMinutes: habit.durationMinutes || 30,
        unlocked: isUnlocked(habit),
        completed: completedHabits.includes(habit.id),
        isCritical: showCriticalPath && criticalNodes.includes(habit.id),
        isKeystone: habit.id === keystoneHabitId,
        level,
        x: xInit,
        y: yInit
      };
    });

    // Force simulation
    const simulation = d3.forceSimulation(nodes)
      .force('link', d3.forceLink(links).id(d => d.id).distance(140))
      .force('charge', d3.forceManyBody().strength(-350))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(65));

    // Defs & Filters
    const defs = svg.append('defs');

    // Standard arrowhead
    defs.append('marker')
      .attr('id', 'arrowhead-normal')
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 46)
      .attr('refY', 0)
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-5L10,0L0,5')
      .attr('fill', '#64748b');

    // Critical Path arrowhead (Gold)
    defs.append('marker')
      .attr('id', 'arrowhead-critical')
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 46)
      .attr('refY', 0)
      .attr('markerWidth', 7)
      .attr('markerHeight', 7)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-5L10,0L0,5')
      .attr('fill', '#f59e0b');

    // Glow filter for completed nodes
    const glowFilter = defs.append('filter')
      .attr('id', 'glow-green')
      .attr('x', '-20%').attr('y', '-20%').attr('width', '140%').attr('height', '140%');
    glowFilter.append('feGaussianBlur').attr('stdDeviation', 4).attr('result', 'coloredBlur');
    const feMerge = glowFilter.append('feMerge');
    feMerge.append('feMergeNode').attr('in', 'coloredBlur');
    feMerge.append('feMergeNode').attr('in', 'SourceGraphic');

    // Glow filter for critical nodes (Gold)
    const criticalGlow = defs.append('filter')
      .attr('id', 'glow-gold')
      .attr('x', '-20%').attr('y', '-20%').attr('width', '140%').attr('height', '140%');
    criticalGlow.append('feGaussianBlur').attr('stdDeviation', 4).attr('result', 'goldBlur');
    const mergeGold = criticalGlow.append('feMerge');
    mergeGold.append('feMergeNode').attr('in', 'goldBlur');
    mergeGold.append('feMergeNode').attr('in', 'SourceGraphic');

    // Render Links
    const linkGroup = svg.append('g').attr('class', 'links');
    const link = linkGroup
      .selectAll('line')
      .data(links)
      .enter()
      .append('line')
      .attr('stroke', d => d.isCritical ? '#f59e0b' : '#475569')
      .attr('stroke-width', d => d.isCritical ? 3.5 : 2)
      .attr('stroke-opacity', d => d.isCritical ? 1 : 0.6)
      .attr('stroke-dasharray', d => d.isCritical ? '6,3' : 'none')
      .attr('marker-end', d => d.isCritical ? 'url(#arrowhead-critical)' : 'url(#arrowhead-normal)');

    // Render Nodes Group
    const nodeGroup = svg.append('g').attr('class', 'nodes');
    const node = nodeGroup
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

    // Node Box Rectangle
    node.append('rect')
      .attr('width', 130)
      .attr('height', 74)
      .attr('rx', 10)
      .attr('x', -65)
      .attr('y', -37)
      .attr('fill', d => d.color)
      .attr('opacity', d => {
        if (!d.unlocked) return 0.28;
        return d.completed ? 1 : 0.85;
      })
      .attr('stroke', d => {
        if (d.completed) return '#10b981';
        if (d.isCritical) return '#f59e0b';
        return d.unlocked ? '#94a3b8' : '#334155';
      })
      .attr('stroke-width', d => {
        if (d.completed || d.isCritical) return 3;
        return 1.5;
      })
      .attr('filter', d => {
        if (d.completed) return 'url(#glow-green)';
        if (d.isCritical) return 'url(#glow-gold)';
        return null;
      });

    // Node Habit Title
    node.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', -8)
      .attr('fill', '#ffffff')
      .attr('font-size', '13px')
      .attr('font-weight', '600')
      .text(d => d.name);

    // Duration Subtitle
    node.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', 8)
      .attr('fill', '#cbd5e1')
      .attr('font-size', '10px')
      .text(d => `⏱ ${d.durationMinutes}m | Level ${d.level}`);

    // Status / Action Text
    node.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', 23)
      .attr('fill', d => {
        if (!d.unlocked) return '#94a3b8';
        return d.completed ? '#6ee7b7' : '#93c5fd';
      })
      .attr('font-size', '11px')
      .attr('font-weight', '500')
      .text(d => {
        if (!d.unlocked) return '🔒 Locked';
        return d.completed ? '✓ Completed' : '⚡ Click to Complete';
      });

    // Special Keystone / Critical Badges
    node.each(function(d) {
      const g = d3.select(this);
      if (d.isKeystone) {
        g.append('text')
          .attr('x', 52)
          .attr('y', -24)
          .attr('font-size', '14px')
          .attr('title', 'Keystone Habit: Unlocks max downstream nodes')
          .text('★');
      }
      if (d.isCritical && !d.completed) {
        g.append('text')
          .attr('x', -54)
          .attr('y', -24)
          .attr('font-size', '11px')
          .attr('fill', '#fbbf24')
          .text('⚡');
      }
    });

    // Click handler
    node.on('click', (event, d) => {
      if (d.unlocked) {
        onHabitClick(d.id);
      }
    });

    // Simulation Tick
    simulation.on('tick', () => {
      link
        .attr('x1', d => d.source.x)
        .attr('y1', d => d.source.y)
        .attr('x2', d => d.target.x)
        .attr('y2', d => d.target.y);

      node.attr('transform', d => `translate(${d.x},${d.y})`);
    });

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

    return () => {
      simulation.stop();
    };
  }, [habits, edges, completedHabits, onHabitClick, criticalEdges, criticalNodes, showCriticalPath, topologicalLevels, keystoneHabitId]);

  return (
    <div ref={containerRef} className="w-full bg-slate-900/90 rounded-2xl border border-slate-800 p-4 relative overflow-hidden shadow-2xl">
      <svg ref={svgRef} className="w-full h-[550px]"></svg>

      {/* Floating Canvas Legend */}
      <div className="absolute bottom-4 left-4 bg-slate-950/80 backdrop-blur-md px-3.5 py-2 rounded-xl border border-slate-800/80 text-[11px] flex flex-wrap items-center gap-4 text-slate-300">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50"></span>
          <span>Completed</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-blue-500"></span>
          <span>Unlocked (Ready)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-slate-600 opacity-60"></span>
          <span>🔒 Locked Prerequisite</span>
        </div>
        {showCriticalPath && (
          <div className="flex items-center gap-1.5 text-amber-400 font-semibold">
            <span className="w-3 h-1 bg-amber-400"></span>
            <span>⚡ Critical Bottleneck Path (CPM)</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default HabitGraph;
