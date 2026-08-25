// Small self-contained paired-bar chart (total vs. successful projects per
// year) built with inline SVG — no charting library dependency exists in
// this app yet, and this is the only chart needed so far.
export default function YearlyProjectTrendChart({ data }) {
  const width = 640;
  const height = 260;
  const padding = { top: 20, right: 20, bottom: 40, left: 36 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const maxValue = Math.max(1, ...data.map((d) => d.total));
  const groupWidth = chartWidth / data.length;
  const barWidth = Math.min(28, groupWidth / 3);

  const scaleY = (value) => chartHeight - (value / maxValue) * chartHeight;

  return (
    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-bold text-[var(--ann-text-dark)]">
          Yearly Mentoring Trend
        </h3>
        <div className="flex items-center gap-4 text-xs text-gray-500">
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-[var(--ann-purple)] inline-block" />
            Total Projects
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-[var(--ann-pink)] inline-block" />
            Successfully Completed
          </span>
        </div>
      </div>

      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-auto"
        role="img"
        aria-label="Yearly mentoring trend: total vs successful projects"
      >
        <g transform={`translate(${padding.left},${padding.top})`}>
          <line
            x1={0}
            y1={chartHeight}
            x2={chartWidth}
            y2={chartHeight}
            stroke="#E5E7EB"
          />

          {data.map((d, i) => {
            const groupX = i * groupWidth;
            const totalHeight = chartHeight - scaleY(d.total);
            const successHeight = chartHeight - scaleY(d.successful);
            const centerX = groupX + groupWidth / 2;

            return (
              <g key={d.year}>
                <rect
                  x={centerX - barWidth - 2}
                  y={scaleY(d.total)}
                  width={barWidth}
                  height={totalHeight}
                  rx={3}
                  fill="var(--ann-purple)"
                />
                <text
                  x={centerX - barWidth - 2 + barWidth / 2}
                  y={scaleY(d.total) - 6}
                  textAnchor="middle"
                  fontSize="11"
                  fill="#6B7280"
                >
                  {d.total}
                </text>

                <rect
                  x={centerX + 2}
                  y={scaleY(d.successful)}
                  width={barWidth}
                  height={successHeight}
                  rx={3}
                  fill="var(--ann-pink)"
                />
                <text
                  x={centerX + 2 + barWidth / 2}
                  y={scaleY(d.successful) - 6}
                  textAnchor="middle"
                  fontSize="11"
                  fill="#6B7280"
                >
                  {d.successful}
                </text>

                <text
                  x={centerX}
                  y={chartHeight + 20}
                  textAnchor="middle"
                  fontSize="12"
                  fontWeight="600"
                  fill="#374151"
                >
                  {d.year}
                </text>
              </g>
            );
          })}
        </g>
      </svg>
    </div>
  );
}
