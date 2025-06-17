import { useState, useMemo, useRef, useEffect } from 'react';
import { GraphCanvas, GraphCanvasRef, lightTheme } from 'reagraph';
import {
Select,
SelectContent,
SelectItem,
SelectTrigger,
SelectValue,
} from '@/components/ui/select';

// Define types for our enhanced network data
export interface Node {
id: string;
label: string;
summary: string;
citaten: any[];
nr_docs: number;
nr_citations: number;
data?: {
eigen_centrality?: number;
eigen_centrality_in?: number;
eigen_centrality_out?: number;
eigen_centrality_cross_category?: number;
eigen_centrality_in_cross_category?: number;
eigen_centrality_out_cross_category?: number;
[key: string]: any;
};
category: string;
[key: string]: any;
}

export interface Edge {
id: string;
source: string;
target: string;
label: string;
weight: number;
citaat_relaties: any[];
raw_count: number;
[key: string]: any;
}

export const categoryColors: Record<string, string> = {
'Sociaal & Maatschappelijk': '#0699a9',
'Economisch': '#702f8e',
'Ecologisch': '#84b440',
'Geopolitiek & militair': '#a8aaad',
'Technologisch & digitaal': '#abccd5',
'Gezondheid': '#e42259'
};

const theme = {
...lightTheme,
canvas: {
background: 'rgb(252, 253, 254)',
fog: 'rgb(252, 253, 254)',
},
node: {
...lightTheme.node,
activeFill: 'rgb(0,168,120)',
label: { ...lightTheme.node.label, activeColor: 'rgb(0,168,120)' },
},
edge: {
...lightTheme.edge,
activeStroke: 'rgb(0,168,120)',
activeFill: 'rgb(0,168,120)',
opacity: 0.5,
},
arrow: { ...lightTheme.arrow, activeFill: 'rgb(0,168,120)' },
ring: { ...lightTheme.ring, activeFill: 'rgb(0,168,120)' },
cluster: null as any,
};

interface RelationGraphCanvasProps {
nodes: Node[];
edges: Edge[];
}

export const RelationGraphCanvas = ({ nodes, edges }: RelationGraphCanvasProps) => {
const [selectedThreat, setSelectedThreat] = useState<string>('');
const graphRef = useRef<GraphCanvasRef | null>(null);

// Handle undefined nodes/edges
const safeNodes = nodes || [];
const safeEdges = edges || [];

// Get nodes that have outgoing connections for the selection menu
const nodesWithOutgoingConnections = useMemo(() => {
const nodesWithOutgoing = new Set<string>();
safeEdges.forEach(edge => {
nodesWithOutgoing.add(edge.source);
});
return safeNodes.filter(node => nodesWithOutgoing.has(node.id));
}, [safeNodes, safeEdges]);

// Filter nodes and edges based on selected threat
const { filteredNodes, filteredEdges } = useMemo(() => {
let relevantNodes = safeNodes;
let relevantEdges = safeEdges;

if (selectedThreat) {
// Find first order effects (direct outgoing connections) with weights
const firstOrderConnections = safeEdges
.filter(edge => edge.source === selectedThreat)
.sort((a, b) => (b.weight || 0) - (a.weight || 0)) // Sort by weight descending
.slice(0, 6); // Take top 9 highest weighted connections

const firstOrderTargets = new Set(firstOrderConnections.map(edge => edge.target));

// Find second order effects (connections from first order targets) with weights
const secondOrderConnections = safeEdges
.filter(edge =>
firstOrderTargets.has(edge.source) &&
edge.target !== selectedThreat &&
!firstOrderTargets.has(edge.target)
)
.sort((a, b) => (b.weight || 0) - (a.weight || 0)) // Sort by weight descending
.slice(0, 6); // Take top 9 highest weighted connections

const secondOrderTargets = new Set(secondOrderConnections.map(edge => edge.target));

// Combine all relevant node IDs
const relevantNodeIds = new Set([
selectedThreat,
...firstOrderTargets,
...secondOrderTargets
]);

// Filter nodes to only include relevant ones
relevantNodes = safeNodes.filter(node => relevantNodeIds.has(node.id));

// Use the pruned edges (no need to filter for cycles since we're being selective)
relevantEdges = [...firstOrderConnections, ...secondOrderConnections];
}

// Apply category colors and process nodes
const processedNodes = relevantNodes.map(node => {
const category = node.category || 'unknown';
const color = categoryColors[category] || categoryColors.unknown;
return {
...node,
fill: color,
color: color
};
});

// Process edges with weight-based sizing
const processedEdges = relevantEdges.map(edge => {
const weight = edge.weight || 1;
// Scale edge size based on weight (1-4 range)
const size = Math.max(1, Math.min(4, Math.round(weight * 2)));
return {
...edge,
size
};
});

return {
filteredNodes: processedNodes,
filteredEdges: processedEdges
};
}, [selectedThreat, safeNodes, safeEdges]);

// Auto-fit the graph view when threat selection changes
useEffect(() => {
if (graphRef.current && selectedThreat) {
// Small delay to ensure the graph has rendered with new data
const timer = setTimeout(() => {
graphRef.current?.fitNodesInView();
}, 100);
return () => clearTimeout(timer);
}
}, [selectedThreat, filteredNodes]);

return (
<div className="w-full space-y-4">
{/* Threat Selection */}
<div className="flex items-center justify-center">
<div className="w-80">
<Select value={selectedThreat} onValueChange={setSelectedThreat}>
<SelectTrigger className="w-full bg-white border-gray-200 shadow-sm hover:border-[rgb(0,168,120)] focus:border-[rgb(0,168,120)] focus:ring-1 focus:ring-[rgb(0,168,120)] transition-colors">
<SelectValue placeholder="Selecteer een dreiging..." />
</SelectTrigger>
<SelectContent className="max-h-60">
{nodesWithOutgoingConnections
.sort((a, b) => a.label.localeCompare(b.label))
.map((node) => (
<SelectItem
key={node.id}
value={node.id}
className="hover:bg-gray-50 focus:bg-[rgb(0,168,120)]/10"
>
<div className="flex flex-col">
<span className="font-medium">{node.label}</span>
{node.summary && (
<span className="text-xs text-gray-500 truncate max-w-60">
{node.summary}
</span>
)}
</div>
</SelectItem>
))}
</SelectContent>
</Select>
</div>
</div>

{/* Graph Canvas */}
<div className="w-full bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
<div
style={{
width: '100%',
height: '600px',
position: 'relative'
}}
>
<GraphCanvas
ref={graphRef}
nodes={filteredNodes}
edges={filteredEdges}
theme={theme}
cameraMode="rotate"
layoutType="hierarchicalLr"
/>
</div>
</div>
</div>
);
};