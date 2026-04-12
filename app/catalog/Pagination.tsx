'use client';

import { usePathname, useSearchParams } from 'next/navigation';
import Link from 'next/link';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
}

export default function Pagination({ currentPage, totalPages }: PaginationProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const createPageURL = (pageNumber: number) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', pageNumber.toString());
    return `${pathname}?${params.toString()}`;
  };

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  if (totalPages <= 1) {
    return null;
  }

  return (
    <nav className="flex justify-center mt-12">
      <ul className="flex items-center -space-x-px h-10 text-base">
        {/* Кнопка "Назад" */}
        <li>
          <Link
            href={createPageURL(currentPage - 1)}
            className={`flex items-center justify-center px-4 h-10 ms-0 leading-tight text-gray-500 bg-white border border-e-0 border-gray-300 rounded-s-lg hover:bg-gray-100 hover:text-gray-700 ${currentPage === 1 ? 'pointer-events-none opacity-50' : ''}`}>
            <span className="sr-only">Previous</span>
            &laquo;
          </Link>
        </li>

        {/* Номера страниц */}
        {pages.map(page => (
          <li key={page}>
            <Link
              href={createPageURL(page)}
              className={`flex items-center justify-center px-4 h-10 leading-tight ${currentPage === page ? 'text-blue-600 border border-blue-300 bg-blue-50' : 'text-gray-500 bg-white border border-gray-300'} hover:bg-gray-100 hover:text-gray-700`}>
              {page}
            </Link>
          </li>
        ))}

        {/* Кнопка "Вперед" */}
        <li>
            <Link
                href={createPageURL(currentPage + 1)}
                className={`flex items-center justify-center px-4 h-10 leading-tight text-gray-500 bg-white border border-gray-300 rounded-e-lg hover:bg-gray-100 hover:text-gray-700 ${currentPage === totalPages ? 'pointer-events-none opacity-50' : ''}`}>
                 <span className="sr-only">Next</span>
                 &raquo;
            </Link>
        </li>
      </ul>
    </nav>
  );
}
