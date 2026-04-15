import { getLeads, updateLeadStatus } from "@/app/actions/crm";
import Link from "next/link";

function StatusFilter({ currentStatus }: { currentStatus: string | null | undefined }) {
  const statuses = ['new', 'contacted', 'qualified', 'closed'];
  return (
    <div className="flex space-x-2 mb-4">
      <Link href="/crm/leads" className={`px-3 py-1 rounded-md text-sm ${!currentStatus ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}>Все</Link>
      {statuses.map(status => (
        <Link key={status} href={`/crm/leads?status=${status}`} className={`px-3 py-1 rounded-md text-sm ${currentStatus === status ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}>
          {status}
        </Link>
      ))}
    </div>
  );
}

function StatusChanger({ id, currentStatus }: { id: string, currentStatus: string }) {
  const statuses = ['new', 'contacted', 'qualified', 'closed'];
  
  return (
    // ✅ ИСПРАВЛЕНО: Обернули вызов в анонимную функцию, которая ничего не возвращает
    <form action={async (formData) => { await updateLeadStatus(id, formData); }} className="flex items-center">
      <select name="status" defaultValue={currentStatus} className="text-sm rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50">
        {statuses.map(s => <option key={s} value={s}>{s}</option>)}
      </select>
      <button type="submit" className="ml-2 px-2 py-1 text-xs bg-gray-200 rounded-md">Save</button>
    </form>
  )
}

// В новых версиях Next.js searchParams — это Promise, поэтому мы его ждем
export default async function LeadsPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const resolvedParams = await searchParams;
  const status = resolvedParams?.status;
  const leads = await getLeads(status);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Лиды</h1>
      <StatusFilter currentStatus={status} />
      <div className="bg-white shadow-md rounded my-6 overflow-x-auto">
        <table className="min-w-max w-full table-auto">
          <thead>
            <tr className="bg-gray-200 text-gray-600 uppercase text-sm leading-normal">
              <th className="py-3 px-6 text-left">Имя</th>
              <th className="py-3 px-6 text-left">Телефон</th>
              <th className="py-3 px-6 text-center">Объект</th>
              <th className="py-3 px-6 text-center">Статус</th>
              <th className="py-3 px-6 text-center">Создан</th>
              <th className="py-3 px-6 text-center">Действия</th>
            </tr>
          </thead>
          <tbody className="text-gray-600 text-sm font-light">
            {leads.map((lead) => (
              <tr key={lead.id} className="border-b border-gray-200 hover:bg-gray-100">
                <td className="py-3 px-6 text-left whitespace-nowrap">
                  <Link href={`/crm/leads/${lead.id}`} className="font-medium hover:text-blue-600">{lead.name}</Link>
                </td>
                <td className="py-3 px-6 text-left">
                  <a href={`tel:${lead.phone}`} className="hover:text-blue-600">{lead.phone}</a>
                </td>
                <td className="py-3 px-6 text-center">
                  <Link href={`/property/${lead.property_slug}`} className="hover:text-blue-600">{lead.property_title}</Link>
                </td>
                <td className="py-3 px-6 text-center">
                  <StatusChanger id={lead.id} currentStatus={lead.status} />
                </td>
                <td className="py-3 px-6 text-center">
                  {new Date(lead.created_at).toLocaleString('ru-RU')}
                </td>
                <td className="py-3 px-6 text-center">
                  <Link href={`/crm/leads/${lead.id}`} className="text-blue-500 hover:underline">Детали</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}