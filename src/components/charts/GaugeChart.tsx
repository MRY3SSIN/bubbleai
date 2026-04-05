import Svg, { Path, Text as SvgText } from 'react-native-svg';

import { colors } from '@/src/theme';

type GaugeChartProps = {
  value: number;
  max: number;
  centerLabel: string;
  accent?: string;
  size?: number;
};

const polarToCartesian = (cx: number, cy: number, radius: number, angle: number) => {
  const radians = ((angle - 180) * Math.PI) / 180;
  return {
    x: cx + radius * Math.cos(radians),
    y: cy + radius * Math.sin(radians),
  };
};

const arcPath = (startAngle: number, endAngle: number, radius: number, strokeWidth: number) => {
  const start = polarToCartesian(100, 100, radius, endAngle);
  const end = polarToCartesian(100, 100, radius, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? 0 : 1;

  return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`;
};

export const GaugeChart = ({
  value,
  max,
  centerLabel,
  accent = colors.mint,
  size = 220,
}: GaugeChartProps) => {
  const ratio = Math.max(0, Math.min(value / max, 1));

  return (
    <Svg width={size} height={size * 0.68} viewBox="0 0 200 140">
      {[0, 1, 2, 3, 4].map((segment) => {
        const start = 180 - segment * 36;
        const end = start - 28;
        const filled = ratio * 5 > segment;
        return (
          <Path
            key={segment}
            d={arcPath(end, start, 72, 14)}
            fill="none"
            stroke={filled ? accent : colors.border}
            strokeLinecap="round"
            strokeWidth={16}
          />
        );
      })}
      <SvgText
        fill={colors.ink}
        fontFamily="Manrope_700Bold"
        fontSize={28}
        x="100"
        y="86"
        textAnchor="middle"
      >
        {centerLabel}
      </SvgText>
    </Svg>
  );
};

