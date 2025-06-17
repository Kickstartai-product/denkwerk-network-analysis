import React from 'react';

// Define the category color mapping
export const categoryColors: Record<string, string> = {
  'Sociaal & Maatschappelijk': '#0699a9',
  'Economisch': '#702f8e',
  'Ecologisch': '#84b440',
  'Geopolitiek & militair': '#a8aaad',
  'Technologisch & digitaal': '#abccd5',
  'Gezondheid': '#e42259'
};

interface ColorLegendProps {
  className?: string;
}

const ColorLegend: React.FC<ColorLegendProps> = ({ className = '' }) => {
  return (
    <div className={`bg-background/70 backdrop-blur-md p-3 rounded-lg shadow-lg ${className}`}>
      <h4 className="text-xs font-medium mb-2">Categorieën</h4>
      <div className="space-y-1.5">
        {Object.entries(categoryColors).map(([category, color]) => (
          // Skip unknown category in the legend
          category !== 'unknown' && (
            <div key={category} className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: color }}
              />
              <span className="text-xs">{category}</span>
            </div>
          )
        ))}
      </div>
    </div>
  );
};

export default ColorLegend;