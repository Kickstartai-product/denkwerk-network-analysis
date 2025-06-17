// src/components/ThreatTable.tsx
import { useState, useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ArrowUpDown, Download } from 'lucide-react';
import type { Node } from './networkGraph/networkService'; // Updated import path
import type { CentralityMetric } from './MainContent'; // Import the type from MainContent

// Define the columns we want to display and sort by
type SortableColumn = CentralityMetric | 'label' | 'nr_docs' | 'nr_citations';

interface ThreatTableProps {
  nodes: Node[];
}

// Helper to get centrality value safely
const getCentralityValue = (node: Node, metric: CentralityMetric): number | null => {
  return node.data?.[metric] ?? null;
};

// Helper to format numbers or show 'N/A'
const formatScore = (score: number | null | undefined): string => {
  if (score === null || score === undefined) return 'N/A';
  return score.toFixed(4);
};

// Mapping for user-friendly column names
const columnNames: Record<SortableColumn, string> = {
  label: 'Dreiging',
  nr_docs: 'Documenten',
  nr_citations: 'Citaties',
  eigen_centrality: 'Eigen Centrality',
  eigen_centrality_in: 'Prestige (In)',
  eigen_centrality_out: 'Importance (Out)',
  cross_category_eigen_centrality: 'Cross-Cat Centrality',
  cross_category_eigen_centrality_in: 'Cross-Cat Prestige',
  cross_category_eigen_centrality_out: 'Cross-Cat Importance',
};

export const ThreatTable = ({ nodes }: ThreatTableProps) => {
  const [sortColumn, setSortColumn] = useState<SortableColumn>('eigen_centrality_out'); // Default sort
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const sortedNodes = useMemo(() => {
    return [...nodes].sort((a, b) => {
      let valA: string | number | null = null;
      let valB: string | number | null = null;

      switch (sortColumn) {
        case 'label':
          valA = a.label.toLowerCase();
          valB = b.label.toLowerCase();
          break;
        case 'nr_docs':
          valA = a.nr_docs ?? 0;
          valB = b.nr_docs ?? 0;
          break;
        case 'nr_citations':
          valA = a.nr_citations ?? 0;
          valB = b.nr_citations ?? 0;
          break;
        default: // Centrality metrics
          valA = getCentralityValue(a, sortColumn);
          valB = getCentralityValue(b, sortColumn);
          // Handle nulls: treat them as lowest value
          valA = valA === null ? -Infinity : valA;
          valB = valB === null ? -Infinity : valB;
          break;
      }

      if (valA < valB) {
        return sortDirection === 'asc' ? -1 : 1;
      }
      if (valA > valB) {
        return sortDirection === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }, [nodes, sortColumn, sortDirection]);

  const handleSort = (column: SortableColumn) => {
    if (sortColumn === column) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      // Default to descending for centrality/counts, ascending for label
      setSortDirection(['label'].includes(column) ? 'asc' : 'desc');
    }
  };

  const exportToCSV = () => {
    // Define the columns to export in the order they should appear
    const headers: SortableColumn[] = [
      'label',
      'nr_docs',
      'nr_citations',
      'eigen_centrality',
      'eigen_centrality_in',
      'eigen_centrality_out',
      'cross_category_eigen_centrality',
      'cross_category_eigen_centrality_in',
      'cross_category_eigen_centrality_out',
    ];
    const headerNames = headers.map(h => columnNames[h]);

    const csvRows = [
      headerNames.join(','), // Header row
      ...sortedNodes.map(node => {
        const rowValues = headers.map(header => {
          let value: string | number | null | undefined;
          switch (header) {
            case 'label': value = node.label; break;
            case 'nr_docs': value = node.nr_docs; break;
            case 'nr_citations': value = node.nr_citations; break;
            default: value = getCentralityValue(node, header); break;
          }
          // Format numbers, handle null/undefined, escape commas in label
          if (typeof value === 'string') {
             return `"${value.replace(/"/g, '""')}"`; // Escape double quotes
          } else if (typeof value === 'number') {
            return ['nr_docs', 'nr_citations'].includes(header) ? value.toString() : formatScore(value);
          } else {
            return 'N/A';
          }
        });
        return rowValues.join(',');
      })
    ];

    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', 'threat_rankings.csv');
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  };

  const renderSortIcon = (column: SortableColumn) => {
    if (sortColumn !== column) {
      return <ArrowUpDown className="ml-2 h-3 w-3 opacity-30" />;
    }
    return sortDirection === 'desc'
      ? <ArrowUpDown className="ml-2 h-3 w-3" /> // Or specific down arrow
      : <ArrowUpDown className="ml-2 h-3 w-3 transform rotate-180" />; // Or specific up arrow
  };

  // Define the columns to display in the table
  const displayColumns: SortableColumn[] = [
    'label',
    'nr_docs', 
    'nr_citations',
    'eigen_centrality',
    'eigen_centrality_in',
    'eigen_centrality_out',
    'cross_category_eigen_centrality',
    'cross_category_eigen_centrality_in',
    'cross_category_eigen_centrality_out',
  ];

  return (
    <div className="p-4 h-full flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h4 className="text-lg font-semibold">Dreiging Ranglijst</h4>
        <Button variant="outline" size="sm" onClick={exportToCSV}>
          <Download className="mr-2 h-4 w-4" />
          Export CSV
        </Button>
      </div>
      <div className="flex-grow overflow-auto border rounded-md">
        <Table>
          <TableHeader className="sticky top-0 bg-background z-10">
            <TableRow>
              {displayColumns.map(colKey => (
                <TableHead key={colKey} className={colKey === 'label' ? "" : "text-right"}>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSort(colKey)}
                    className="-ml-3 h-8 data-[state=open]:bg-accent"
                  >
                    <span>{columnNames[colKey]}</span>
                    {renderSortIcon(colKey)}
                  </Button>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedNodes.length > 0 ? (
              sortedNodes.map((node) => (
                <TableRow key={node.id}>
                  <TableCell className="font-medium">{node.label}</TableCell>
                  <TableCell className="text-right">{node.nr_docs ?? 'N/A'}</TableCell>
                  <TableCell className="text-right">{node.nr_citations ?? 'N/A'}</TableCell>
                  <TableCell className="text-right font-mono">{formatScore(getCentralityValue(node, 'eigen_centrality'))}</TableCell>
                  <TableCell className="text-right font-mono">{formatScore(getCentralityValue(node, 'eigen_centrality_in'))}</TableCell>
                  <TableCell className="text-right font-mono">{formatScore(getCentralityValue(node, 'eigen_centrality_out'))}</TableCell>
                  <TableCell className="text-right font-mono">{formatScore(getCentralityValue(node, 'cross_category_eigen_centrality'))}</TableCell>
                  <TableCell className="text-right font-mono">{formatScore(getCentralityValue(node, 'cross_category_eigen_centrality_in'))}</TableCell>
                  <TableCell className="text-right font-mono">{formatScore(getCentralityValue(node, 'cross_category_eigen_centrality_out'))}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={displayColumns.length} className="h-24 text-center">
                  No data available.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default ThreatTable;