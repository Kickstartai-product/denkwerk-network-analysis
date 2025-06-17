import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ListOrdered, ArrowBigRight, BookText, Move, ShieldAlert } from "lucide-react";
import { useState, useEffect, useRef, useMemo } from 'react';
import GraphChart, { GraphChartRef } from './GraphChart';
import NodeSelector from './NodeSelector';
import ColorLegend from './ColorLegend';
import { EdgeDisplayMode } from './EdgeDisplayToggle';
import type { Node, Edge } from './networkGraph/networkService';
import { Sheet, SheetTrigger, SheetContent } from "@/components/ui/sheet";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";
import ThreatTable from './ThreatTable';
import { shortNodeDescriptions, threatImpacts } from './shortNodeDescriptions'; // <-- IMPORTED

interface MainContentProps {
  nodes: Node[];
  loading: boolean;
  error: string | null;
  filteredNodes: Node[];
  filteredEdges: Edge[];
  selectedNodeId: string | null;
  onSelectNode: (id: string | null) => void;
  edgeDisplayMode: EdgeDisplayMode;
  onSetEdgeDisplayMode: (mode: EdgeDisplayMode) => void;
}

export type CentralityMetric =
  'eigen_centrality' |
  'eigen_centrality_in' |
  'eigen_centrality_out' |
  'cross_category_eigen_centrality' |
  'cross_category_eigen_centrality_in' |
  'cross_category_eigen_centrality_out';

// Helper function to get the centrality value for a node
const getCentralityValue = (node: Node, metric: CentralityMetric): number | null => {
  return node.data?.[metric] ?? null;
};

// Helper function to determine the centrality tier
const getCentralityTier = (node: Node | null, allNodes: Node[]): string => {
  const metric: CentralityMetric = 'cross_category_eigen_centrality_out';
  if (!node) return "N.v.t.";

  const currentValue = getCentralityValue(node, metric);
  if (currentValue === null) return "N.v.t.";

  // 1. Get all non-null values for the metric and sort them
  const allValues = allNodes
    .map(n => getCentralityValue(n, metric))
    .filter((v): v is number => v !== null)
    .sort((a, b) => a - b);

  if (allValues.length === 0) return "N.v.t.";

  // 2. Find the rank of the current node's value
  const rank = allValues.indexOf(currentValue);

  // 3. Calculate percentile
  const percentile = (rank / (allValues.length -1)) * 100;

  // 4. Return the tier string
  if (percentile >= 80) return "Zeer hoog";
  if (percentile >= 60) return "Hoog";
  if (percentile >= 40) return "Gemiddeld";
  if (percentile >= 20) return "Laag";
  return "Zeer laag";
};

// MODIFIED: Helper function to get the impact level
const getImpactLevel = (node: Node | null): string => {
  if (!node) return "N.v.t.";
  // The full threat name is the node's ID
  return threatImpacts[node.id] || "Onbekend";
};


export const MainContent = ({
  nodes,
  loading,
  error,
  filteredNodes,
  filteredEdges,
  selectedNodeId,
  onSelectNode,
  edgeDisplayMode,
}: MainContentProps) => {
  const graphRef = useRef<GraphChartRef>(null);

  const [selectedEdge, setSelectedEdge] = useState<Edge | null>(null);
  const [showRelationships] = useState<boolean>(false);
  const [showPanel, setShowPanel] = useState<boolean>(false);
  // Default sizing attribute is now the primary centrality metric
  const [scoringMetric] = useState<CentralityMetric>('cross_category_eigen_centrality_out');
  const [minNodeSize] = useState<number>(5);
  const [maxNodeSize] = useState<number>(15);
  const [edgeWeightCutoff] = useState<number>(0.5);
  const [useWeightBasedEdgeSize] = useState<boolean>(true);

  const selectedNode = selectedNodeId
    ? nodes.find(n => n.id === selectedNodeId) || null
    : null;

  const sourceNodeForEdge = selectedEdge ? nodes.find(n => n.id === selectedEdge.source) : null;
  const targetNodeForEdge = selectedEdge ? nodes.find(n => n.id === selectedEdge.target) : null;

  const handleNodeSelect = (nodeId: string | null) => {
    setSelectedEdge(null);
    onSelectNode(nodeId);
    if (nodeId && window.innerWidth < 768) {
      setShowPanel(true);
    }
  };

  const handleEdgeSelect = (edge: Edge | null) => {
    onSelectNode(null);
    setSelectedEdge(edge);
    if (edge && window.innerWidth < 768) {
        setShowPanel(true);
    }
  };

  const sortedNodesForSelector = useMemo(() => {
    return [...filteredNodes]
      .map(node => ({
        ...node,
        // Add the short label to the objects for the selector component
        displayLabel: shortNodeDescriptions[node.id] || node.label,
      }))
      .sort((a, b) => {
        const valA = getCentralityValue(a, scoringMetric);
        const valB = getCentralityValue(b, scoringMetric);
        const scoreA = valA === null ? -Infinity : valA;
        const scoreB = valB === null ? -Infinity : valB;
        return scoreB - scoreA;
      });
  }, [filteredNodes, scoringMetric]);


  useEffect(() => {
    if (selectedNodeId && graphRef.current) {
      graphRef.current.centerOnNode(selectedNodeId);
    }
  }, [selectedNodeId]);

  const formatDocumentLink = (link: string): string => {
    if (link && link.startsWith('/')) {
      return `https://open.overheid.nl${link}`;
    }
    return link || '#';
  };

  const getTotalCitationsCount = (node: Node): number => {
    return node.nr_citations || 0;
  };

  const renderCitationParts = (citationText: string) => {
    if (!citationText.includes(" ||| ")) {
      return <div className="italic bg-muted/40 p-3 rounded text-sm">"{citationText}"</div>;
    }
    const parts = citationText.split(" ||| ");
    return (
      <div className="space-y-2">
        {parts.map((part, i) => (
          <div key={i} className="italic bg-muted/40 p-3 rounded text-sm">
            "{part.trim()}"
          </div>
        ))}
      </div>
    );
  };

  return (
  <div className="relative w-full h-full">
      <div className="absolute inset-0 w-full h-full">
      <GraphChart
        ref={graphRef}
        nodes={filteredNodes}
        edges={filteredEdges}
        loading={loading}
        error={error}
        selectedNodeId={selectedNodeId}
        onNodeSelect={handleNodeSelect}
        onEdgeClick={handleEdgeSelect}
        showRelationships={showRelationships}
        sizingAttribute={scoringMetric}
        minNodeSize={minNodeSize}
        maxNodeSize={maxNodeSize}
        edgeWeightCutoff={edgeWeightCutoff}
        useWeightBasedEdgeSize={useWeightBasedEdgeSize}
        shortNodeDescriptions={shortNodeDescriptions} // <-- PASSED AS PROP
      />
      </div>

      <div className="absolute bottom-10 left-10 z-10">
        <ColorLegend />
      </div>
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10 flex items-center space-x-2">
        <div className="bg-background/70 backdrop-blur-md p-2 rounded-lg shadow-lg">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Sheet>
                </Sheet>
              </TooltipTrigger>
              <TooltipContent><p>Open grafiek instellingen</p></TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <div className="bg-background/70 backdrop-blur-md p-2 rounded-lg shadow-lg">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                 <Sheet>
                   <SheetTrigger asChild>
                     <Button variant="outline" size="sm" className="gap-1 px-3" disabled={loading || !!error || nodes.length === 0}>
                       <ListOrdered className="h-4 w-4" />
                       <span>Ranglijst</span>
                     </Button>
                   </SheetTrigger>
                   <SheetContent side="bottom" className="h-[75vh] flex flex-col p-0">
                       <ThreatTable nodes={nodes} />
                   </SheetContent>
                 </Sheet>
              </TooltipTrigger>
              <TooltipContent><p>Bekijk dreiging ranglijst & exporteer</p></TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
       {edgeWeightCutoff > 0.5 && (
         <div className="absolute top-16 left-1/2 transform -translate-x-1/2 z-10">
           <div className="bg-background/70 backdrop-blur-md px-3 py-1 rounded-lg shadow-lg text-xs">
             <span className="text-muted-foreground">Filteren: </span>
             <span>Alleen verbindingen met gewicht ≥ {edgeWeightCutoff.toFixed(2)} worden getoond</span>
           </div>
         </div>
       )}
      {edgeDisplayMode !== 'all' && selectedNodeId && (
        <div className="absolute top-24 left-1/2 transform -translate-x-1/2 z-10">
          <div className="bg-background/70 backdrop-blur-md px-3 py-1 rounded-lg shadow-lg text-xs">
            <span className="text-muted-foreground">Verbindingen: </span>
            <span>Toon alleen {edgeDisplayMode === 'incoming' ? 'inkomende' : 'uitgaande'} verbindingen voor geselecteerde dreiging</span>
          </div>
        </div>
      )}
      <div className="md:hidden absolute top-4 right-4 z-10">
        <Button variant="secondary" className="bg-background/70 backdrop-blur-md shadow-lg" onClick={() => setShowPanel(!showPanel)}>
          {showPanel ? "Verberg Paneel" : "Toon Paneel"}
        </Button>
      </div>

      <div className={`absolute right-0 top-0 bottom-0 z-10 w-full md:w-2/5 lg:w-1/3 transform transition-transform duration-300 ease-in-out ${
        showPanel || window.innerWidth >= 768 ? 'translate-x-0' : 'translate-x-full'
      } ${ window.innerWidth >= 768 ? 'md:translate-x-0' : '' }`}>
        <Card className="h-full bg-background/60 backdrop-blur-md border-0 shadow-lg rounded-l-lg rounded-r-none overflow-hidden">
          <div className="flex flex-col h-full p-4">
            <div className="mb-4 pt-2">
              <h4 className="text-sm font-medium mb-2">Selecteer Dreiging</h4>
              <div className="flex gap-2 items-center">
                <div className="flex-1">
                  <NodeSelector
                    nodes={sortedNodesForSelector}
                    selectedNodeId={selectedNodeId}
                    onSelectNode={handleNodeSelect}
                    placeholder="Selecteer een dreiging..."
                  />
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Gesorteerd op centraliteit (hoogste eerst)
              </p>
            </div>

            <Separator className="my-2 bg-border/30" />

            <div className="flex-1 overflow-hidden flex flex-col">
              <h4 className="text-sm font-medium mb-3">
                  {selectedNode ? "Geselecteerde Dreiging" : selectedEdge ? "Geselecteerde Verbinding" : "Details"}
              </h4>

              {!selectedNode && !selectedEdge && (
                <div className="text-sm text-muted-foreground p-4 bg-muted/30 rounded-lg">
                  Klik op een dreiging of verbinding in de grafiek om details te bekijken.
                </div>
              )}

              {selectedNode && (
                <div className="flex flex-col h-full overflow-hidden">
                  {/* MODIFIED: Sleek and elegant selected node display */}
                  <div className="flex-shrink-0">
                    <div className="p-4 bg-muted/20 rounded-lg border border-border/20">
                      <p className="font-semibold text-lg text-primary mb-4">{shortNodeDescriptions[selectedNode.id] || selectedNode.label}</p>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">

                        <div className="p-3 bg-background/50 rounded-md flex items-center gap-3">
                          <BookText className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <span className="text-muted-foreground">Citaties</span>
                            <p className="font-bold text-sm text-foreground">{getTotalCitationsCount(selectedNode)}</p>
                          </div>
                        </div>

                        <div className="p-3 bg-background/50 rounded-md flex items-center gap-3">
                          <Move className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <span className="text-muted-foreground">Centraliteit</span>
                            <p className="font-semibold text-sm text-foreground">{getCentralityTier(selectedNode, nodes)}</p>
                          </div>
                        </div>

                        <div className="p-3 bg-background/50 rounded-md flex items-center gap-3">
                          <ShieldAlert className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <span className="text-muted-foreground">Impact</span>
                            <p className="font-semibold text-sm text-foreground">{getImpactLevel(selectedNode)}</p>
                          </div>
                        </div>

                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex-1 flex flex-col overflow-hidden">
                    <h5 className="text-sm font-medium mb-2 flex-shrink-0">Representatieve citaten</h5>
                    <div className="space-y-3 overflow-y-auto pr-2 flex-1">
                      {selectedNode.citaten && selectedNode.citaten.length > 0 ? (
                         selectedNode.citaten.map((citation, index) => (
                          <div key={index} className="p-3 bg-background/50 rounded-lg border border-border/20">
                            <div className="flex justify-between items-start mb-2">
                              <a href={formatDocumentLink(citation.document_link)} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-primary hover:underline flex-1 mr-2">
                                {citation.title || "Onbekende Titel"}
                              </a>
                            </div>
                            <div className="flex flex-wrap text-xs text-muted-foreground mb-2 space-x-2">
                              {citation.publication_date && <div>{citation.publication_date.slice(0, 7)}</div>}
                              {citation.publication_date && (citation.document_type || citation.source) && <div>•</div>}
                              {citation.document_type && <div>{citation.document_type}</div>}
                              {citation.document_type && citation.source && <div>•</div>}
                              {citation.source && <div>{citation.source}</div>}
                            </div>
                            {citation.citaat.split('|||').map((citaatPart, partIndex) => (
                              <div key={partIndex} className="text-sm mt-2 italic bg-muted/40 p-2 rounded">
                                "{citaatPart.trim()}"
                              </div>
                            ))}
                          </div>
                         ))
                      ) : (
                        <div className="text-sm text-muted-foreground p-3 bg-muted/30 rounded-lg">
                          Geen citaties beschikbaar voor deze dreiging.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* MODIFICATION START: Updated edge info screen */}
              {selectedEdge && (
                <div className="flex flex-col h-full overflow-hidden">
                   <div className="flex-shrink-0">
                    <div className="p-4 bg-muted/20 rounded-lg border border-border/20">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mb-4">
                          <span className="font-semibold text-lg text-primary">{shortNodeDescriptions[sourceNodeForEdge?.id || ''] || sourceNodeForEdge?.label || 'Onbekend'}</span>
                          <ArrowBigRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                          <span className="font-semibold text-lg text-primary">{shortNodeDescriptions[targetNodeForEdge?.id || ''] || targetNodeForEdge?.label || 'Onbekend'}</span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                        <div className="p-3 bg-background/50 rounded-md flex items-center gap-3">
                          <BookText className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <span className="text-muted-foreground">Citaties Verbinding</span>
                            <p className="font-bold text-sm text-foreground">{selectedEdge.citaat_relaties?.length || 0}</p>
                          </div>
                        </div>

                        <div className="p-3 bg-background/50 rounded-md flex items-center gap-3">
                          <ShieldAlert className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <span className="text-muted-foreground">Impact van Gevolg</span>
                            <p className="font-semibold text-sm text-foreground">{getImpactLevel(targetNodeForEdge as any)}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex-1 flex flex-col overflow-hidden">
                    <h5 className="text-sm font-medium mb-2 flex-shrink-0">Representatieve citaten</h5>
                     <div className="space-y-3 overflow-y-auto pr-2 flex-1">
                      {selectedEdge.citaat_relaties && selectedEdge.citaat_relaties.length > 0 ? (
                        selectedEdge.citaat_relaties.map((citation, index) => (
                           <div key={index} className="p-4 bg-background/50 rounded-lg border border-border/20">
                            <div className="flex justify-between items-start mb-2">
                              <a href={formatDocumentLink(citation.document_link)} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-primary hover:underline flex-1 mr-2">
                                {citation.title || "Onbekende Titel"}
                              </a>
                            </div>
                            <div className="flex flex-wrap text-xs text-muted-foreground mb-3 space-x-2">
                              {citation.publication_date && <div>{citation.publication_date.slice(0, 7)}</div>}
                              {citation.publication_date && (citation.source) && <div>•</div>}
                              {citation.source && <div>{citation.source}</div>}
                            </div>
                            <div className="text-sm mt-2">
                              <div className="flex gap-2 mb-1">
                                <span className="text-xs font-medium bg-primary/10 px-2 py-0.5 rounded">Oorzaak</span>
                                <span>{citation.oorzaak}</span>
                              </div>
                              <div className="flex gap-2 mb-3">
                                <span className="text-xs font-medium bg-primary/10 px-2 py-0.5 rounded">Gevolg</span>
                                <span>{citation.gevolg}</span>
                              </div>
                              {renderCitationParts(citation.citaat)}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-sm text-muted-foreground p-3 bg-muted/30 rounded-lg">
                          Geen citaties beschikbaar voor deze verbinding.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
              {/* MODIFICATION END */}
            </div>

            <div className="md:hidden mt-4">
              <Button variant="outline" className="w-full" onClick={() => setShowPanel(false)}>
                Sluit Paneel
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default MainContent;