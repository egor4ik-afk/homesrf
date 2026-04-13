
import { getProperties, getTotalPages } from "@/app/actions/admin";
import Pagination from "@/app/catalog/Pagination";
import Link from "next/link";

export default async function AdminPage({ searchParams }: { searchParams?: { page?: string; } }) {
  const currentPage = Number(searchParams?.page) || 1;
  const itemsPerPage = 10;
  const properties = await getProperties(itemsPerPage, currentPage);
  const totalPages = await getTotalPages(itemsPerPage);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Объекты недвижимости</h1>
        <Link href="/admin/properties/new" className="bg-blue-500 text-white px-4 py-2 rounded-md">Добавить объект</Link>
      </div>
      <div className="bg-white shadow-md rounded my-6">
        <table className="min-w-max w-full table-auto">
          <thead>
            <tr className="bg-gray-200 text-gray-600 uppercase text-sm leading-normal">
              <th className="py-3 px-6 text-left">Заголовок</th>
              <th className="py-3 px-6 text-left">Тип</th>
              <th className="py-3 px-6 text-center">Цена</th>
              <th className="py-3 px-6 text-center">Действия</th>
            </tr>
          </thead>
          <tbody className="text-gray-600 text-sm font-light">
            {properties.map((property: any) => (
              <tr key={property.id} className="border-b border-gray-200 hover:bg-gray-100">
                <td className="py-3 px-6 text-left whitespace-nowrap">
                  <div className="flex items-center">
                    <span className="font-medium">{property.title}</span>
                  </div>
                </td>
                <td className="py-3 px-6 text-left">
                  <div className="flex items-center">
                    <span>{property.type}</span>
                  </div>
                </td>
                <td className="py-3 px-6 text-center">
                  <span>{property.price}</span>
                </td>
                <td className="py-3 px-6 text-center">
                  <div className="flex item-center justify-center">
                    <Link href={`/admin/properties/${property.id}/edit`} className="w-4 mr-2 transform hover:text-purple-500 hover:scale-110">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.536L16.732 3.732z" />
                      </svg>
                    </Link>
                    {/* Add delete button here */}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pagination currentPage={currentPage} totalPages={totalPages} />
    </div>
  );
}
