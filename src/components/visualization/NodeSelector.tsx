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
  const safeNodes = Array.isArray(nodes) ? nodes : [];

  const selectedNodeLabel = React.useMemo(() => {
    const selected = safeNodes.find(node => node.id === selectedNodeId);
    return selected ? selected.label : null;
  }, [safeNodes, selectedNodeId]);

  /**
   * NEW: This memoized value computes the display label.
   * If the full label is longer than 50 characters, it truncates the string
   * at the last space before the 47-character mark to avoid cutting off words.
   */
  const displayLabel = React.useMemo(() => {
    if (!selectedNodeLabel) {
      return null;
    }

    const maxLength = 50;
    const gracefulCutoff = 47;

    // If the label is not too long, return it as is.
    if (selectedNodeLabel.length <= maxLength) {
      return selectedNodeLabel;
    }

    // Find the last space within the "graceful cutoff" limit.
    const substring = selectedNodeLabel.substring(0, gracefulCutoff);
    const lastSpaceIndex = substring.lastIndexOf(' ');

    // If a space is found, cut there. If not (e.g., a very long first word),
    // perform a hard cut at the graceful cutoff length.
    const cutoffIndex = lastSpaceIndex > 0 ? lastSpaceIndex : gracefulCutoff;

    return `${selectedNodeLabel.substring(0, cutoffIndex)}...`;

  }, [selectedNodeLabel]);

  const handleValueChange = (value: string) => {
    onSelectNode(value);
  };

  return (
    <Select
      value={selectedNodeId || ""}
      onValueChange={handleValueChange}
    >
      <SelectTrigger className="w-full">
        <SelectValue placeholder={placeholder}>
          {displayLabel}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {safeNodes.length > 0 ? (
          safeNodes.map((node) => (
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