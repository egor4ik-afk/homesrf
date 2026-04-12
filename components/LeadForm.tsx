'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { createLead } from '@/app/actions/lead';
import { useEffect, useRef } from 'react';

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full bg-blue-500 text-white p-3 rounded-lg hover:bg-blue-600 disabled:bg-gray-400"
    >
      {pending ? 'Отправка...' : 'Отправить'}
    </button>
  );
}

export default function LeadForm({ property_id, source_url }: { property_id?: number, source_url: string }) {
  const initialState = { errors: {}, message: null };
  const [state, dispatch] = useFormState(createLead, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success) {
      formRef.current?.reset();
    }
  }, [state.success]);

  return (
    <form ref={formRef} action={dispatch} className="space-y-4">
      <input type="hidden" name="property_id" value={property_id} />
      <input type="hidden" name="source_url" value={source_url} />
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700">Имя</label>
        <input
          type="text"
          id="name"
          name="name"
          className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm"
          required
        />
        {state.errors?.name && <p className="text-red-500 text-xs mt-1">{state.errors.name}</p>}
      </div>
      <div>
        <label htmlFor="phone" className="block text-sm font-medium text-gray-700">Телефон</label>
        <input
          type="tel"
          id="phone"
          name="phone"
          className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm"
          required
          pattern="\+7[0-9]{10}"
          title="Номер телефона в формате +7XXXXXXXXXX"
        />
        {state.errors?.phone && <p className="text-red-500 text-xs mt-1">{state.errors.phone}</p>}
      </div>
      <div>
        <label htmlFor="message" className="block text-sm font-medium text-gray-700">Сообщение (необязательно)</label>
        <textarea
          id="message"
          name="message"
          rows={4}
          className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm"
        ></textarea>
      </div>
      <SubmitButton />
      {state.success && <p className="text-green-500 mt-4">Спасибо! Мы свяжемся с вами.</p>}
      {state.error && <p className="text-red-500 mt-4">{state.error}</p>}
    </form>
  );
}
