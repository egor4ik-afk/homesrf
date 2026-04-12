
'use server';

import { sql } from '@vercel/postgres';
import { revalidatePath } from 'next/cache';

// Получение статистики для дашборда
export async function getDashboardStats() {
  try {
    const { rows } = await sql`
      SELECT
        COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '1 day') as today,
        COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '7 days') as week,
        COUNT(*) FILTER (WHERE status = 'new') as new_count
      FROM leads
    `;
    return rows[0];
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch dashboard stats.');
  }
}

// Получение списка лидов с фильтрацией
export async function getLeads(status: string | null | undefined) {
  try {
    const { rows } = await sql`
      SELECT l.id, l.name, l.phone, l.status, l.created_at, p.title as property_title, p.slug as property_slug
      FROM leads l
      LEFT JOIN properties p ON l.property_id = p.id
      WHERE (${status}::text IS NULL OR l.status = ${status})
      ORDER BY l.created_at DESC
      LIMIT 50
    `;
    return rows;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch leads.');
  }
}

// Получение одного лида по ID
export async function getLead(id: string) {
  try {
    const { rows } = await sql`
      SELECT l.*, p.title as property_title, p.slug as property_slug
      FROM leads l
      LEFT JOIN properties p ON l.property_id = p.id
      WHERE l.id = ${id}
    `;
    return rows[0];
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch lead.');
  }
}

// Обновление статуса лида
export async function updateLeadStatus(id: string, formData: FormData) {
  const status = formData.get('status') as string;

  try {
    await sql`UPDATE leads SET status = ${status} WHERE id = ${id}`;
    revalidatePath('/crm/leads');
    revalidatePath(`/crm/leads/${id}`);
  } catch (error) {
    return { message: 'Database Error: Failed to Update Lead Status.' };
  }
}
