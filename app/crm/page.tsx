
import { getDashboardStats } from "@/app/actions/crm";
import Link from "next/link";

export default async function CrmDashboard() {
  const stats = await getDashboardStats();

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">CRM Дашборд</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-2">Новых за сегодня</h2>
          <p className="text-3xl font-bold">{stats.today}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-2">Новых за неделю</h2>
          <p className="text-3xl font-bold">{stats.week}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-2">В статусе "Новый"</h2>
          <p className="text-3xl font-bold">{stats.new_count}</p>
        </div>
      </div>
      <div className="mt-8">
        <Link href="/crm/leads" className="bg-blue-500 text-white px-6 py-3 rounded-md font-semibold">
          Перейти к лидам
        </Link>
      </div>
    </div>
  );
}
