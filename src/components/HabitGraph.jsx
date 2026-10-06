import { useEffect, useRef, useState, useCallback } from 'react';
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
  const zoomBehaviorRef = useRef(null);
  const [showLegend, setShowLegend] = useState(false);

  // Auto-center and fit graph inside SVG viewport
  const fitGraphToView = useCallback((nodes, width, height, duration = 400) => {
    if (!svgRef.current || !zoomBehaviorRef.current || !nodes || nodes.length === 0) return;

    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    nodes.forEach(n => {
      const x = n.x ?? n.position?.x ?? 0;
      const y = n.y ?? n.position?.y ?? 0;
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    });

    const padding = 80;
    const graphWidth = (maxX - minX) + padding * 2;
    const graphHeight = (maxY - minY) + padding * 2;

    const scale = Math.min(width / Math.max(graphWidth, 1), height / Math.max(graphHeight, 1), 1.1);
    const midX = (minX + maxX) / 2;
    const midY = (minY + maxY) / 2;
    const translateX = width / 2 - midX * scale;
    const translateY = height / 2 - midY * scale;

    const svg = d3.select(svgRef.current);
    svg.transition().duration(duration).call(
      zoomBehaviorRef.current.transform,
      d3.zoomIdentity.translate(translateX, translateY).scale(scale)
    );
  }, []);

  useEffect(() => {
    if (!habits.length) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const width = containerRef.current?.clientWidth || 800;
    const isMobile = width < 640;
    const height = isMobile ? 360 : 500;

    svg.attr('viewBox', `0 0 ${width} ${height}`)
       .attr('width', '100%')
       .attr('height', '100%');

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

    // Construct nodes with initial positions centered in available space
    const nodes = habits.map(habit => {
      const level = topologicalLevels[habit.id] ?? 0;
      const xInit = habit.position?.x || (100 + level * 150);
      const yInit = habit.position?.y || (height / 2 + (Math.random() - 0.5) * 80);

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

    // Defs & Arrowheads
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

    // Root zoom layer for pan & zoom gestures
    const zoomLayer = svg.append('g').attr('class', 'zoom-layer');

    const zoom = d3.zoom()
      .scaleExtent([0.35, 2.5])
      .on('zoom', (event) => {
        zoomLayer.attr('transform', event.transform);
      });

    zoomBehaviorRef.current = zoom;
    svg.call(zoom);

    // Force simulation
    const simulation = d3.forceSimulation(nodes)
      .force('link', d3.forceLink(links).id(d => d.id).distance(130))
      .force('charge', d3.forceManyBody().strength(-300))
      .force('collision', d3.forceCollide().radius(65));

    // Render Links
    const linkGroup = zoomLayer.append('g').attr('class', 'links');
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
    const nodeGroup = zoomLayer.append('g').attr('class', 'nodes');
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
    let hasCentered = false;
    simulation.on('tick', () => {
      link
        .attr('x1', d => d.source.x)
        .attr('y1', d => d.source.y)
        .attr('x2', d => d.target.x)
        .attr('y2', d => d.target.y);

      node.attr('transform', d => `translate(${d.x},${d.y})`);

      // Once simulation starts settling, auto-center graph to avoid dead whitespace
      if (!hasCentered && simulation.alpha() < 0.8) {
        hasCentered = true;
        fitGraphToView(nodes, width, height, 300);
      }
    });

    // Run fit after initial settle
    const timer = setTimeout(() => {
      fitGraphToView(nodes, width, height, 400);
    }, 350);

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
      clearTimeout(timer);
      simulation.stop();
    };
  }, [habits, edges, completedHabits, onHabitClick, criticalEdges, criticalNodes, showCriticalPath, topologicalLevels, keystoneHabitId, fitGraphToView]);

  // Zoom control triggers
  const handleZoom = (factor) => {
    if (!svgRef.current || !zoomBehaviorRef.current) return;
    d3.select(svgRef.current).transition().duration(250).call(zoomBehaviorRef.current.scaleBy, factor);
  };

  const handleResetZoom = () => {
    if (!containerRef.current) return;
    const width = containerRef.current.clientWidth || 800;
    const isMobile = width < 640;
    const height = isMobile ? 360 : 500;
    fitGraphToView(habits, width, height, 300);
  };

  return (
    <div
      ref={containerRef}
      className="w-full bg-slate-900/90 rounded-xl sm:rounded-2xl border border-slate-800 p-2 sm:p-4 relative overflow-hidden shadow-2xl flex flex-col justify-center"
    >
      {/* SVG Canvas with responsive height */}
      <div className="w-full h-[320px] sm:h-[420px] md:h-[500px] relative">
        <svg ref={svgRef} className="w-full h-full block touch-none"></svg>

        {/* Canvas Floating Controls (Zoom In, Zoom Out, Auto-Fit) */}
        <div className="absolute top-2 right-2 flex items-center gap-1 bg-slate-950/80 backdrop-blur-md p-1 rounded-lg border border-slate-800 shadow-md z-10">
          <button
            onClick={() => handleZoom(1.2)}
            className="w-7 h-7 flex items-center justify-center rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-bold transition-colors"
            title="Zoom In"
            aria-label="Zoom In"
          >
            +
          </button>
          <button
            onClick={() => handleZoom(0.8)}
            className="w-7 h-7 flex items-center justify-center rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-bold transition-colors"
            title="Zoom Out"
            aria-label="Zoom Out"
          >
            −
          </button>
          <button
            onClick={handleResetZoom}
            className="w-7 h-7 flex items-center justify-center rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs transition-colors"
            title="Fit to Center"
            aria-label="Fit to Center"
          >
            ⛶
          </button>
        </div>

        {/* Floating Canvas Legend Button / Panel */}
        <div className="absolute bottom-2 left-2 z-10">
          <button
            onClick={() => setShowLegend(prev => !prev)}
            className="sm:hidden px-2.5 py-1 rounded-md bg-slate-950/80 backdrop-blur-md border border-slate-800 text-[10px] text-slate-300 font-medium"
          >
            {showLegend ? 'Hide Legend' : 'Legend'}
          </button>

          <div className={`${showLegend ? 'flex' : 'hidden sm:flex'} bg-slate-950/85 backdrop-blur-md px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-lg sm:rounded-xl border border-slate-800/80 text-[10px] sm:text-[11px] flex-wrap items-center gap-2 sm:gap-4 text-slate-300 mt-1 sm:mt-0 shadow-lg`}>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50"></span>
              <span>Completed</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
              <span>Ready</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-600 opacity-60"></span>
              <span>Locked</span>
            </div>
            {showCriticalPath && (
              <div className="flex items-center gap-1.5 text-amber-400 font-semibold">
                <span className="w-2.5 h-1 bg-amber-400"></span>
                <span>Critical Path</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HabitGraph;
