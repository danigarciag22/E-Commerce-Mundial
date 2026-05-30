'use client'

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'

const COLORS: Record<string, string> = {
  paid: '#16a34a',
  pending: '#f59e0b',
  shipped: '#3b82f6',
  cancelled: '#ef4444',
}
const LABELS: Record<string, string> = {
  paid: 'Pagado',
  pending: 'Pendiente',
  shipped: 'Enviado',
  cancelled: 'Cancelado',
}

export function StatusDonut({ data }: { data: { status: string; count: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <PieChart>
        <Pie data={data} dataKey="count" nameKey="status" innerRadius={60} outerRadius={100} paddingAngle={2}>
          {data.map((d) => (
            <Cell key={d.status} fill={COLORS[d.status] ?? '#a1a1aa'} />
          ))}
        </Pie>
        <Tooltip formatter={(value, name) => [value, LABELS[String(name)] ?? String(name)]} />
        <Legend formatter={(value: string) => LABELS[value] ?? value} />
      </PieChart>
    </ResponsiveContainer>
  )
}
