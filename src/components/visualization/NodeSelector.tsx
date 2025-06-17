import React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Node } from './networkDataService';

interface NodeSelectorProps {
  nodes: Node[];
  selectedNodeId: string | null;
  onSelectNode: (nodeId: string | null) => void;
  placeholder?: string;
}

const NodeSelector = ({
  nodes = [],
  selectedNodeId,
  onSelectNode,
  placeholder = "Select a node..."
}: NodeSelectorProps) => {
  // Safety check - ensure we have an array of nodes
  const safeNodes = Array.isArray(nodes) ? nodes : [];
  
  // Sort nodes alphabetically by label
  const sortedNodes = React.useMemo(() => {
    return [...safeNodes].sort((a, b) => 
      (a.label || '').localeCompare(b.label || '')
    );
  }, [safeNodes]);

  // Handle selection change
  const handleValueChange = (value: string) => {
    onSelectNode(value);
  };

  return (
    <Select
      value={selectedNodeId || ""}
      onValueChange={handleValueChange}
    >
      <SelectTrigger className="w-full">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {sortedNodes.length > 0 ? (
          sortedNodes.map((node) => (
            <SelectItem key={node.id} value={node.id}>
              {node.label}
            </SelectItem>
          ))
        ) : (
          <div className="px-2 py-4 text-sm text-muted-foreground text-center">
            No nodes available
          </div>
        )}
      </SelectContent>
    </Select>
  );
};

export default NodeSelector;