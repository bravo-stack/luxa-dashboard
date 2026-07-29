'use client';

import { Bar, BarChart, CartesianGrid, Tooltip, XAxis, YAxis } from 'recharts';

import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart';
import type { TeamMemberOverview } from '@/lib/auth/team';

function compactName(name: string) {
  const parts = name.trim().split(/\s+/);
  return parts.length > 1 ? `${parts[0]} ${parts.at(-1)?.[0]}.` : name;
}

export function TeamPerformanceChart({ members }: { members: TeamMemberOverview[] }) {
  const data = members.map((member) => ({
    name: compactName(member.displayName),
    open: member.performance.open,
    qualified: member.performance.qualified,
    won: member.performance.won,
  }));

  if (!data.length) {
    return (
      <div className="flex h-72 items-center justify-center border-t border-dashed border-border text-center">
        <div>
          <p className="text-sm font-semibold text-foreground">No sales team data yet</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Invite the first sales executive to start a team readout.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <ul className="sr-only">
        {members.map((member) => (
          <li key={member.id}>
            {member.displayName}: {member.performance.open} open,{' '}
            {member.performance.qualified} qualified, {member.performance.won} won
          </li>
        ))}
      </ul>
      <ChartContainer
        className="h-80 w-full"
        role="img"
        aria-label="Sales executive pipeline comparison"
        config={{
          open: { label: 'Open', color: 'var(--chart-3)' },
          qualified: { label: 'Qualified', color: 'var(--chart-2)' },
          won: { label: 'Won', color: 'var(--chart-1)' },
        }}
      >
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 8, right: 18, bottom: 0, left: 8 }}
        >
          <CartesianGrid horizontal={false} strokeDasharray="3 5" />
          <XAxis type="number" allowDecimals={false} axisLine={false} tickLine={false} />
          <YAxis
            type="category"
            dataKey="name"
            width={92}
            axisLine={false}
            tickLine={false}
            tickMargin={8}
          />
          <Tooltip
            cursor={{ fill: 'var(--muted)', fillOpacity: 0.55 }}
            content={<ChartTooltipContent />}
          />
          <Bar
            dataKey="open"
            fill="var(--color-open)"
            radius={[0, 4, 4, 0]}
            maxBarSize={18}
            isAnimationActive={false}
          />
          <Bar
            dataKey="qualified"
            fill="var(--color-qualified)"
            radius={[0, 4, 4, 0]}
            maxBarSize={18}
            isAnimationActive={false}
          />
          <Bar
            dataKey="won"
            fill="var(--color-won)"
            radius={[0, 4, 4, 0]}
            maxBarSize={18}
            isAnimationActive={false}
          />
        </BarChart>
      </ChartContainer>
    </>
  );
}
