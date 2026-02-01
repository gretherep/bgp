"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/utils/apiClient";
import { TrendingUp, Users, Star, Film } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";

interface Stats {
  totalMedia: number;
  totalUsers: number;
  totalRatings: number;
  avgRating: number;
}

// ✨ Colores coherentes con tu tema
const COLORS = {
  primary: "#3b82f6", // blue-500
  secondary: "#f59e0b", // amber-500
  success: "#10b981", // emerald-500
  warning: "#f97316", // orange-500
};

export default function AdminDashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [weeklyRatings, setWeeklyRatings] = useState<any[]>([]);
  const [weeklyMedia, setWeeklyMedia] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await api.get("/api/admin/dashboard");
        setStats(data.stats);
        setWeeklyRatings(data.charts.weeklyRatings);
        setWeeklyMedia(data.charts.weeklyMedia);
      } catch (err: any) {
        console.error("Dashboard error:", err);
        if (err.message.includes("Unauthorized") || err.message.includes("Forbidden")) {
          router.replace("/");
        }
      }
    };

    fetchData();
  }, [router]);

  if (!stats) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950 text-white">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-amber-500 mb-4"></div>
          <p className="text-gray-400">Cargando dashboard administrativo...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 p-4 sm:p-6 md:p-8 ">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-2">
            <span className="bg-amber-500/10 p-2 rounded-lg text-amber-400">
              <TrendingUp className="w-5 h-5" />
            </span>
            Dashboard Administrativo
          </h1>
          <p className="text-gray-400 mt-1 text-sm">Resumen y métricas del sistema</p>
        </div>

        {/* RESUMEN */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          <StatCard
            title="Contenido"
            value={stats.totalMedia}
            icon={<Film className="w-6 h-6" />}
            color={COLORS.success}
          />
          <StatCard
            title="Usuarios"
            value={stats.totalUsers}
            icon={<Users className="w-6 h-6" />}
            color={COLORS.primary}
          />
          <StatCard
            title="Calificaciones"
            value={stats.totalRatings}
            icon={<Star className="w-6 h-6" />}
            color={COLORS.warning}
          />
          <StatCard
            title="Promedio"
            value={stats.avgRating}
            icon={<TrendingUp className="w-6 h-6" />}
            color={COLORS.secondary}
          />
        </div>

        {/* GRÁFICAS */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartCard title="Calificaciones por semana">
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={weeklyRatings}>
                <XAxis dataKey="day" stroke="#9CA3AF" fontSize={12} />
                <YAxis stroke="#9CA3AF" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1F2937",
                    borderColor: "#374151",
                    borderRadius: "0.5rem",
                    color: "#F9FAFB",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke={COLORS.warning}
                  strokeWidth={3}
                  dot={{ stroke: COLORS.warning, strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, stroke: "#111827" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Contenido agregado (últimos 7 días)">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={weeklyMedia}>
                <XAxis dataKey="day" stroke="#9CA3AF" fontSize={12} />
                <YAxis stroke="#9CA3AF" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1F2937",
                    borderColor: "#374151",
                    borderRadius: "0.5rem",
                    color: "#F9FAFB",
                  }}
                />
                <Bar dataKey="value" fill={COLORS.success} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      </div>
    </div>
  );
}

// ✨ Tarjeta de estadísticas mejorada
function StatCard({
  title,
  value,
  icon,
  color,
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
  color: string;
}) {
  return (
    <div className="bg-gray-800/60 backdrop-blur-sm rounded-xl p-5 border border-gray-700/50 hover:border-gray-600 transition-all duration-300 shadow-lg hover:shadow-xl">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-400 text-sm font-medium">{title}</p>
          <p className="text-2xl sm:text-3xl font-bold mt-1" style={{ color }}>
            {typeof value === "number" && title === "Promedio"
              ? value.toFixed(1)
              : value.toLocaleString()}
          </p>
        </div>
        <div
          className="p-3 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: `${color}10` }}
        >
          <span style={{ color }}>{icon}</span>
        </div>
      </div>
    </div>
  );
}

// ✨ Tarjeta para gráficos
function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-5 border border-gray-700/40 shadow-lg">
      <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
        <span className="w-2 h-2 bg-amber-500 rounded-full"></span>
        {title}
      </h2>
      {children}
    </div>
  );
}