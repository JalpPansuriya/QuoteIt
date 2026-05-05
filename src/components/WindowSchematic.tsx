import React from 'react';

interface WindowSchematicProps {
  width: number;
  height: number;
  sections?: number;
  type?: string;
  className?: string;
}

export const WindowSchematic: React.FC<WindowSchematicProps> = ({ 
  width = 3, 
  height = 2, 
  sections = 2,
  type = 'Sliding',
  className = ""
}) => {
  // SVG proportions
  const svgWidth = 260;
  const svgHeight = 180;
  const paddingX = 60;
  const paddingY = 45;
  
  // Box dimensions
  const boxWidth = svgWidth - (paddingX * 2);
  const boxHeight = svgHeight - (paddingY * 2.2);
  
  const panelWidth = boxWidth / sections;
  
  return (
    <div className={`flex flex-col items-center ${className}`}>
      <svg 
        width={svgWidth} 
        height={svgHeight} 
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        className="text-slate-800"
      >
        {/* Frame Outer */}
        <rect 
          x={paddingX} 
          y={paddingY} 
          width={boxWidth} 
          height={boxHeight} 
          fill="none" 
          stroke="#1e293b" 
          strokeWidth={type === 'Fixed Glass' ? "2" : "3"} 
          strokeLinejoin="round"
        />

        {/* Panels Loop */}
        {[...Array(sections)].map((_, i) => {
          const x = paddingX + (i * panelWidth);
          const isLastPanel = i === sections - 1;
          const isRightHalf = i >= Math.ceil(sections / 2);
          const isFixed = type === 'Fixed Glass';
          
          return (
            <React.Fragment key={i}>
              {/* Glass Panel */}
              <rect 
                x={x + 1} 
                y={paddingY + 2} 
                width={panelWidth - 1} 
                height={boxHeight - 4} 
                fill="#e0fbfc" 
                stroke="#1e293b" 
                strokeWidth="1.5" 
              />
              
              {/* Glass Glare */}
              <path 
                d={`M ${x + panelWidth - 10} ${paddingY + 10} L ${x + panelWidth - 5} ${paddingY + 5}`}
                stroke="white"
                strokeWidth="1"
                strokeOpacity="0.6"
              />
              <path 
                d={`M ${x + panelWidth - 15} ${paddingY + 15} L ${x + panelWidth - 5} ${paddingY + 5}`}
                stroke="white"
                strokeWidth="0.5"
                strokeOpacity="0.4"
              />
              
              {/* Overlap Shade (on the sliding side) */}
              {i > 0 && !isFixed && (
                <rect 
                  x={x} 
                  y={paddingY + 2.5} 
                  width={6} 
                  height={boxHeight - 5} 
                  fill="#b9eaf0" 
                />
              )}
 
              {/* Handle */}
              {(i === 0 || i === sections - 1) && !isFixed && (
                <rect 
                  x={i === 0 ? x + 6 : x + panelWidth - 10} 
                  y={paddingY + (boxHeight / 2) - 8} 
                  width={4} 
                  height={16} 
                  rx="2" 
                  fill="#94a3b8" 
                />
              )}
 
              {/* Sliding Arrow */}
              {!isFixed && (
                <g stroke="#94a3b8" strokeWidth="1" fill="none">
                  {isRightHalf ? (
                    // Arrow pointing Left <-
                    <>
                      <line x1={x + 10} y1={paddingY + (boxHeight / 2)} x2={x + panelWidth - 10} y2={paddingY + (boxHeight / 2)} strokeOpacity="0.5" />
                      <path d={`M ${x + 15} ${paddingY + (boxHeight / 2) - 3} L ${x + 10} ${paddingY + (boxHeight / 2)} L ${x + 15} ${paddingY + (boxHeight / 2) + 3}`} strokeOpacity="0.5" />
                    </>
                  ) : (
                    // Arrow pointing Right ->
                    <>
                      <line x1={x + 10} y1={paddingY + (boxHeight / 2)} x2={x + panelWidth - 10} y2={paddingY + (boxHeight / 2)} strokeOpacity="0.5" />
                      <path d={`M ${x + panelWidth - 15} ${paddingY + (boxHeight / 2) - 3} L ${x + panelWidth - 10} ${paddingY + (boxHeight / 2)} L ${x + panelWidth - 15} ${paddingY + (boxHeight / 2) + 3}`} strokeOpacity="0.5" />
                    </>
                  )}
                </g>
              )}
 
              {/* Vertical Separator */}
              {!isLastPanel && (
                <line 
                  x1={x + panelWidth} 
                  y1={paddingY} 
                  x2={x + panelWidth} 
                  y2={paddingY + boxHeight} 
                  stroke="#1e293b" 
                  strokeWidth={isFixed ? "1.5" : "2.5"} 
                />
              )}
            </React.Fragment>
          );
        })}

        {/* Dimension Lines - Horizontal (Top) */}
        <g stroke="#94a3b8" strokeWidth="1">
          <line x1={paddingX - 10} y1={paddingY - 20} x2={paddingX + boxWidth + 10} y2={paddingY - 20} strokeOpacity="0.5" />
          <line x1={paddingX - 10} y1={paddingY - 25} x2={paddingX - 10} y2={paddingY - 15} />
          <line x1={paddingX + boxWidth + 10} y1={paddingY - 25} x2={paddingX + boxWidth + 10} y2={paddingY - 15} />
        </g>
        <rect x={paddingX + (boxWidth / 2) - 15} y={paddingY - 32} width={30} height={20} fill="white" />
        <text x={svgWidth / 2} y={paddingY - 18} textAnchor="middle" fontSize="14" fontWeight="900" fill="#1e293b">{width}</text>

        {/* Dimension Lines - Vertical (Right) */}
        <g stroke="#94a3b8" strokeWidth="1">
          <line x1={paddingX + boxWidth + 25} y1={paddingY} x2={paddingX + boxWidth + 25} y2={paddingY + boxHeight} strokeOpacity="0.5" />
          <line x1={paddingX + boxWidth + 20} y1={paddingY} x2={paddingX + boxWidth + 30} y2={paddingY} />
          <line x1={paddingX + boxWidth + 20} y1={paddingY + boxHeight} x2={paddingX + boxWidth + 30} y2={paddingY + boxHeight} />
        </g>
        <rect x={paddingX + boxWidth + 20} y={paddingY + (boxHeight / 2) - 10} width={30} height={20} fill="white" />
        <text x={paddingX + boxWidth + 35} y={paddingY + (boxHeight / 2) + 5} textAnchor="start" fontSize="14" fontWeight="900" fill="#1e293b">{height}</text>

        {/* Labels */}
        <text x={svgWidth / 2} y={svgHeight - 40} textAnchor="middle" fontSize="9" fontWeight="900" fill="#cbd5e1" letterSpacing="0.1em" className="uppercase">Exterior View • SQ FT</text>
      </svg>
      
      <div className="mt-[-10px] text-[18px] font-black text-slate-500 uppercase tracking-tight text-center">
        AREA: {(width * height).toFixed(0)} SQ FT²
      </div>
    </div>
  );
};
