'use server';

import { z } from 'zod';
import sql from '@/lib/db';

const LeadSchema = z.object({
  name: z.string().min(2, { message: 'Имя должно содержать не менее 2 символов' }),
  phone: z.string().regex(/\+7\d{10}/, { message: 'Неверный формат номера телефона' }),
  email: z.string().email().optional(),
  message: z.string().optional(),
  property_id: z.number().optional(),
  source_url: z.string().url(),
});

export async function createLead(prevState: any, formData: FormData) {
  const validatedFields = LeadSchema.safeParse({
    name: formData.get('name'),
    phone: formData.get('phone'),
    email: formData.get('email'),
    message: formData.get('message'),
    property_id: formData.get('property_id') ? parseInt(formData.get('property_id') as string) : undefined,
    source_url: formData.get('source_url'),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  const { name, phone, email, message, property_id, source_url } = validatedFields.data;

  try {
    const [lead] = await sql`
      INSERT INTO leads (name, phone, email, message, property_id, source_url)
      VALUES (${name}, ${phone}, ${email || null}, ${message || null}, ${property_id || null}, ${source_url})
      RETURNING id
    `;

    const futymsResponse = await fetch(process.env.FUTYMS_API_URL!, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.FUTYMS_API_KEY}`,
      },
      body: JSON.stringify({ name, phone, source_url, property_id }),
    });

    if (!futymsResponse.ok) {
      throw new Error('Failed to send lead to Futyms');
    }

    const futymsData = await futymsResponse.json();

    await sql`
      UPDATE leads
      SET futyms_id = ${futymsData.id}
      WHERE id = ${lead.id}
    `;

    return { success: true };
  } catch (error) {
    return { error: 'Произошла ошибка при создании заявки' };
  }
}
