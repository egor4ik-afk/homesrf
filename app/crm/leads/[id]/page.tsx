
import { getLead, updateLeadStatus } from "@/app/actions/crm";
import { notFound } from "next/navigation";
import Link from "next/link";

async function StatusChanger({ id, currentStatus }: { id: string, currentStatus: string }) {
  const statuses = ['new', 'contacted', 'qualified', 'closed'];
  return (
    <form action={updateLeadStatus.bind(null, id)} className="flex items-center mt-4">
      <select name="status" defaultValue={currentStatus} className="text-lg rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50">
        {statuses.map(s => <option key={s} value={s}>{s}</option>)}
      </select>
      <button type="submit" className="ml-4 px-4 py-2 text-base bg-blue-500 text-white rounded-md">Сохранить статус</button>
    </form>
  )
}

export default async function LeadPage({ params }: { params: { id: string } }) {
  const id = params.id;
  const lead = await getLead(id);

  if (!lead) {
    notFound();
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Link href="/crm/leads" className="text-blue-500 hover:underline mb-6 block">&larr; Назад к списку</Link>
      <div className="bg-white p-8 rounded-lg shadow-md">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-4xl font-bold mb-2">{lead.name}</h1>
            <a href={`tel:${lead.phone}`} className="text-2xl text-blue-600 hover:underline">{lead.phone}</a>
          </div>
          <div className="text-right">
            <p className="text-gray-500">Создан</p>
            <p className="text-lg">{new Date(lead.created_at).toLocaleString()}</p>
          </div>
        </div>

        <hr className="my-6" />

        <div>
          <h2 className="text-2xl font-semibold mb-4">Детали</h2>
          <p className="text-lg"><strong>Статус:</strong> <span className="font-mono px-2 py-1 bg-gray-200 rounded-md">{lead.status}</span></p>
          {lead.property_title && (
            <p className="text-lg mt-2"><strong>Интересующий объект:</strong> <Link href={`/property/${lead.property_slug}`} className="text-blue-500 hover:underline">{lead.property_title}</Link></p>
          )}
          {lead.message && (
            <div className="mt-4">
              <h3 className="text-xl font-semibold">Сообщение от клиента:</h3>
              <p className="text-gray-700 mt-2 p-4 bg-gray-50 rounded-md">{lead.message}</p>
            </div>
          )}
        </div>

        <div className="mt-8">
          <h2 className="text-2xl font-semibold">Изменить статус</h2>
          <StatusChanger id={lead.id} currentStatus={lead.status} />
        </div>
      </div>
    </div>
  );
}
