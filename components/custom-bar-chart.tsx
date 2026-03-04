'use client';

import React, { useMemo } from 'react';
import { BarGroup, Bar } from '@visx/shape';
import { Group } from '@visx/group';
import { AxisLeft, AxisBottom } from '@visx/axis';
import { scaleBand, scaleLinear } from '@visx/scales';
import { Tooltip, useTooltip } from '@visx/tooltip';

interface CustomBarChartProps {
  data: any[];
  columns: string[];
  labelKey: string;
  width: number;
  height: number;
  type: 'grouped' | 'stacked';
  colors?: string[];
}

const COLORS = [
  '#3b82f6', // blue
  '#10b981', // green
  '#f59e0b', // amber
  '#ef4444', // red
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#14b8a6', // teal
  '#f97316', // orange
];

export function CustomBarChart({
  data,
  columns,
  labelKey,
  width,
  height,
  type = 'grouped',
  colors = COLORS,
}: CustomBarChartProps) {
  const margin = { top: 20, right: 30, left: 80, bottom: 120 };
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  const { tooltipData, tooltipLeft, tooltipTop, showTooltip, hideTooltip } = useTooltip<{
    column: string;
    value: number;
    label: string;
  }>();

  // Scales
  const xScale = useMemo(
    () =>
      scaleBand<string>({
        domain: data.map((d) => String(d[labelKey])),
        range: [0, innerWidth],
        padding: 0.15,
      }),
    [data, labelKey, innerWidth]
  );

  const maxValue = useMemo(() => {
    let max = 0;
    data.forEach((d) => {
      columns.forEach((col) => {
        const val = parseFloat(d[col] || 0);
        if (type === 'stacked') {
          max = Math.max(max, (data as any[])
            .reduce((sum: number, row: any) => sum + parseFloat(row[col] || 0), 0));
        } else {
          max = Math.max(max, val);
        }
      });
    });
    return max * 1.1; // 10% padding
  }, [data, columns, type]);

  const yScale = useMemo(
    () =>
      scaleLinear<number>({
        domain: [0, maxValue],
        range: [innerHeight, 0],
      }),
    [innerHeight, maxValue]
  );

  const barWidth = xScale.bandwidth() / columns.length;

  return (
    <svg width={width} height={height}>
      <Group left={margin.left} top={margin.top}>
        {/* Grid lines */}
        {yScale.ticks(5).map((tick) => (
          <line
            key={`grid-${tick}`}
            x1={0}
            x2={innerWidth}
            y1={yScale(tick)}
            y2={yScale(tick)}
            stroke="#4b5563"
            strokeDasharray="3 3"
            opacity={0.5}
          />
        ))}

        {/* Bars */}
        {data.map((d, i) => {
          const xPos = xScale(String(d[labelKey])) || 0;
          let stackOffset = 0;

          return (
            <Group key={`bar-group-${i}`} left={xPos}>
              {columns.map((col, colIdx) => {
                const value = parseFloat(d[col] || 0);
                const barHeight = yScale(0) - yScale(value);
                const yPos = type === 'stacked' 
                  ? yScale(stackOffset + value) 
                  : yScale(value);

                if (type === 'stacked') {
                  stackOffset += value;
                }

                const barX = type === 'grouped' 
                  ? colIdx * barWidth + (barWidth * 0.1)
                  : 0;

                return (
                  <g key={`bar-${i}-${col}`}>
                    <Bar
                      x={barX}
                      y={yPos}
                      width={barWidth * 0.8}
                      height={barHeight}
                      fill={colors[colIdx % colors.length]}
                      onMouseEnter={() => {
                        if (xScale.bandwidth() > 0) {
                          showTooltip({
                            tooltipData: {
                              column: col,
                              value,
                              label: String(d[labelKey]),
                            },
                            tooltipLeft: barX + (barWidth * 0.4),
                            tooltipTop: yPos,
                          });
                        }
                      }}
                      onMouseLeave={hideTooltip}
                      style={{
                        cursor: 'pointer',
                        transition: 'opacity 0.2s',
                      }}
                    />
                  </g>
                );
              })}
            </Group>
          );
        })}

        {/* Axes */}
        <AxisLeft
          scale={yScale}
          tickFormat={(d) => `${(d as number).toLocaleString('es-ES')}`}
          stroke="#9CA3AF"
          tickStroke="#9CA3AF"
          tickLabelProps={() => ({
            fill: '#9CA3AF',
            fontSize: 12,
            textAnchor: 'end',
          })}
        />

        <AxisBottom
          top={innerHeight}
          scale={xScale}
          stroke="#9CA3AF"
          tickStroke="#9CA3AF"
          tickLabelProps={() => ({
            fill: '#9CA3AF',
            fontSize: 12,
            textAnchor: 'end',
            angle: -45,
          })}
        />
      </Group>

      {/* Tooltip */}
      {tooltipData && (
        <Tooltip
          top={tooltipTop! + margin.top}
          left={tooltipLeft! + margin.left}
          style={{
            backgroundColor: '#1F2937',
            color: '#fff',
            border: '1px solid #4B5563',
            borderRadius: '8px',
            padding: '8px 12px',
            fontSize: '12px',
            pointerEvents: 'none',
            zIndex: 1000,
          }}
        >
          <div>
            <strong>{tooltipData.label}</strong>
          </div>
          <div style={{ color: colors[columns.indexOf(tooltipData.column) % colors.length] }}>
            {tooltipData.column}: {tooltipData.value.toLocaleString('es-ES')}
          </div>
        </Tooltip>
      )}
    </svg>
  );
}
