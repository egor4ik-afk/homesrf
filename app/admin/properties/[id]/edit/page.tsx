
'use client';

import { getProperty, updateProperty, getDevelopers } from "@/app/actions/admin";
import { useFormState } from "react-dom";
import { useDropzone } from 'react-dropzone';
import { useState, useEffect, useCallback } from 'react';
import { notFound } from "next/navigation";

export default function EditPropertyPage({ params }: { params: { id: string } }) {
  const id = params.id;
  const initialState = { message: null, errors: {} };
  const updatePropertyWithId = updateProperty.bind(null, id);
  const [state, dispatch] = useFormState(updatePropertyWithId, initialState);
  const [property, setProperty] = useState<any>(null);
  const [developers, setDevelopers] = useState<any[]>([]);
  const [files, setFiles] = useState<any[]>([]);

  useEffect(() => {
    async function fetchProperty() {
      const prop = await getProperty(id);
      if (!prop) {
        notFound();
      }
      setProperty(prop);
      setFiles(prop.photos?.map((url: string) => ({ name: url, preview: url, url })) || []);
    }
    async function fetchDevelopers() {
      const dev = await getDevelopers();
      setDevelopers(dev);
    }
    fetchProperty();
    fetchDevelopers();
  }, [id]);

  const onDrop = useCallback(async (acceptedFiles: any[]) => {
    const uploadedFiles = await Promise.all(
      acceptedFiles.map(async (file) => {
        const formData = new FormData();
        formData.append('file', file);
        const res = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });
        const { url } = await res.json();
        return { ...file, preview: url, url };
      })
    );
    setFiles((prevFiles) => [...prevFiles, ...uploadedFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

  const thumbs = files.map(file => (
    <div className="inline-flex border-2 border-gray-200 rounded-md p-1 mr-2 mb-2" key={file.name}>
      <div className="flex min-w-0 overflow-hidden">
        <img
          src={file.preview}
          className="block w-auto h-full"
        />
      </div>
    </div>
  ));

  if (!property) {
    return <div>Loading...</div>
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Редактировать объект</h1>
      <form action={dispatch}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="mb-4">
            <label htmlFor="title" className="block text-gray-700 font-bold mb-2">Заголовок</label>
            <input type="text" id="title" name="title" defaultValue={property.title} className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" />
          </div>
          <div className="mb-4">
            <label htmlFor="type" className="block text-gray-700 font-bold mb-2">Тип</label>
            <select id="type" name="type" defaultValue={property.type} className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline">
              <option value="apartment">Квартира</option>
              <option value="house">Дом</option>
              <option value="office">Офис</option>
            </select>
          </div>
          <div className="mb-4">
            <label htmlFor="district" className="block text-gray-700 font-bold mb-2">Район</label>
            <input type="text" id="district" name="district" defaultValue={property.district} className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" />
          </div>
          <div className="mb-4">
            <label htmlFor="price" className="block text-gray-700 font-bold mb-2">Цена</label>
            <input type="number" id="price" name="price" defaultValue={property.price} className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" />
          </div>
          <div className="mb-4">
            <label htmlFor="area_total" className="block text-gray-700 font-bold mb-2">Общая площадь</label>
            <input type="number" id="area_total" name="area_total" defaultValue={property.area_total} className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" />
          </div>
          <div className="mb-4">
            <label htmlFor="address" className="block text-gray-700 font-bold mb-2">Адрес</label>
            <input type="text" id="address" name="address" defaultValue={property.address} className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" />
          </div>
          <div className="mb-4">
            <label htmlFor="developer_id" className="block text-gray-700 font-bold mb-2">Застройщик</label>
            <select id="developer_id" name="developer_id" defaultValue={property.developer_id} className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline">
              {developers.map(dev => (
                <option key={dev.id} value={dev.id}>{dev.name}</option>
              ))}
            </select>
          </div>
          <div className="mb-4 col-span-2">
            <label htmlFor="description" className="block text-gray-700 font-bold mb-2">Описание</label>
            <textarea id="description" name="description" rows={4} defaultValue={property.description} className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"></textarea>
          </div>
          <div className="mb-4 col-span-2">
            <label className="block text-gray-700 font-bold mb-2">Фотографии</label>
            <div {...getRootProps({ className: `dropzone ${isDragActive ? 'border-blue-500' : 'border-gray-300'} border-2 border-dashed rounded-md p-6 text-center cursor-pointer` })}>
              <input {...getInputProps()} />
              {isDragActive ?
                <p>Перетащите файлы сюда ...</p> :
                <p>Перетащите файлы сюда или нажмите, чтобы выбрать файлы</p>}
            </div>
            <aside className="flex flex-wrap mt-4">
              {thumbs}
            </aside>
            {files.map(file => (
              <input type="hidden" name="photos" key={file.url} value={file.url} />
            ))}
          </div>
        </div>
        <div className="flex items-center justify-between">
          <button type="submit" className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline">Сохранить</button>
        </div>
        {state.message && <p className="text-red-500 text-xs italic">{state.message}</p>}
      </form>
    </div>
  );
}
