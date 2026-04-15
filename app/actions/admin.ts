'use server';

import { z } from 'zod';
import sql from '@/lib/db'; // ✅ ИЗМЕНИЛИ: Теперь используем твой коннектор базы данных
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

const PropertySchema = z.object({
  id: z.string(),
  title: z.string(),
  type: z.enum(['apartment', 'house', 'office']),
  district: z.string(),
  price: z.coerce.number(),
  area_total: z.coerce.number(),
  address: z.string(),
  description: z.string(),
  developer_id: z.string(),
  photos: z.array(z.string()).optional(),
});

const CreateProperty = PropertySchema.omit({ id: true });
const UpdateProperty = PropertySchema.omit({ id: true });

export async function createProperty(formData: FormData) {
  const validatedFields = CreateProperty.safeParse({
    title: formData.get('title'),
    type: formData.get('type'),
    district: formData.get('district'),
    price: formData.get('price'),
    area_total: formData.get('area_total'),
    address: formData.get('address'),
    description: formData.get('description'),
    developer_id: formData.get('developer_id'),
    photos: formData.getAll('photos'),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Missing Fields. Failed to Create Property.',
    };
  }

  const { title, type, district, price, area_total, address, description, developer_id, photos } = validatedFields.data;
  const date = new Date().toISOString().split('T')[0];

  try {
    await sql`
      INSERT INTO properties (title, type, district, price, area_total, address, description, developer_id, photos, created_at)
      VALUES (${title}, ${type}, ${district}, ${price}, ${area_total}, ${address}, ${description}, ${developer_id}, ${photos as any}, ${date})
    `;
  } catch (error) {
    return {
      message: 'Database Error: Failed to Create Property.',
    };
  }

  revalidatePath('/admin');
  redirect('/admin');
}

export async function updateProperty(id: string, formData: FormData) {
  const validatedFields = UpdateProperty.safeParse({
    title: formData.get('title'),
    type: formData.get('type'),
    district: formData.get('district'),
    price: formData.get('price'),
    area_total: formData.get('area_total'),
    address: formData.get('address'),
    description: formData.get('description'),
    developer_id: formData.get('developer_id'),
    photos: formData.getAll('photos'),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Missing Fields. Failed to Update Property.',
    };
  }

  const { title, type, district, price, area_total, address, description, developer_id, photos } = validatedFields.data;

  try {
    await sql`
      UPDATE properties
      SET title = ${title}, type = ${type}, district = ${district}, price = ${price}, area_total = ${area_total}, address = ${address}, description = ${description}, developer_id = ${developer_id}, photos = ${photos as any}
      WHERE id = ${id}
    `;
  } catch (error) {
    return { message: 'Database Error: Failed to Update Property.' };
  }

  revalidatePath('/admin');
  redirect('/admin');
}

export async function deleteProperty(id: string) {
  try {
    await sql`DELETE FROM properties WHERE id = ${id}`;
    revalidatePath('/admin');
    return { message: 'Deleted Property.' };
  } catch (error) {
    return { message: 'Database Error: Failed to Delete Property.' };
  }
}

export async function getProperties(itemsPerPage: number, currentPage: number) {
  const offset = (currentPage - 1) * itemsPerPage;
  try {
    const properties = await sql`SELECT * FROM properties LIMIT ${itemsPerPage} OFFSET ${offset}`;
    return properties; // ✅ ИЗМЕНИЛИ: Возвращаем массив напрямую
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch properties.');
  }
}

export async function getProperty(id: string) {
  try {
    const property = await sql`SELECT * FROM properties WHERE id = ${id}`;
    return property[0]; // ✅ ИЗМЕНИЛИ: Берем первый элемент из массива
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch property.');
  }
}

export async function getDevelopers() {
  try {
    const developers = await sql`SELECT id, name FROM developers`;
    return developers; // ✅ ИЗМЕНИЛИ: Возвращаем массив напрямую
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch developers.');
  }
}

export async function getTotalPages(itemsPerPage: number) {
  try {
    const count = await sql`SELECT COUNT(*) FROM properties`;
    const totalPages = Math.ceil(Number(count[0].count) / itemsPerPage); // ✅ ИЗМЕНИЛИ: Берем count[0]
    return totalPages;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch total number of properties.');
  }
}