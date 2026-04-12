import sql from './db';

/**
 * Получает список объектов недвижимости с учетом фильтров и пагинации.
 * @param searchParams Параметры из URL (type, district, price_max, page).
 * @returns Объект с массивом свойств и общим количеством.
 */
export async function getProperties(searchParams: { [key: string]: string | string[] | undefined }) {
  // Имитация задержки для демонстрации Suspense
  await new Promise(resolve => setTimeout(resolve, 1500));

  const { type, district, price_max, page = '1' } = searchParams;
  const limit = 12; // 12 объектов на странице
  const offset = (parseInt(page as string, 10) - 1) * limit;

  try {
    // Параллельно выполняем два запроса: один для получения данных, другой для подсчета
    const [properties, countResult] = await Promise.all([
      sql`
        SELECT id, title, slug, price, area, address, images, district, type
        FROM properties
        WHERE status = 'active'
          AND (${type}::text IS NULL OR type = ${type}::text)
          AND (${district}::text IS NULL OR district = ${district}::text)
          AND (${price_max}::int IS NULL OR price <= ${price_max}::int)
        ORDER BY created_at DESC
        LIMIT ${limit}
        OFFSET ${offset}
      `,
      sql`
        SELECT COUNT(*)::int as total
        FROM properties
        WHERE status = 'active'
          AND (${type}::text IS NULL OR type = ${type}::text)
          AND (${district}::text IS NULL OR district = ${district}::text)
          AND (${price_max}::int IS NULL OR price <= ${price_max}::int)
      `
    ]);

    const totalProperties = countResult[0].total;

    return { properties, totalProperties, totalPages: Math.ceil(totalProperties / limit) };

  } catch (error) {
    console.error('Database Error:', error);
    // В случае ошибки возвращаем пустой результат
    return { properties: [], totalProperties: 0, totalPages: 1 };
  }
}
