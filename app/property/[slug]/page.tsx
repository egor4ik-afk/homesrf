
import { sql } from '@vercel/postgres';
import { notFound } from 'next/navigation';
import Gallery from '@/components/property/Gallery';
import YandexMap from '@/components/property/YandexMap';
import LeadForm from '@/components/LeadForm';
import { Metadata } from 'next';

export const revalidate = 3600;

export async function generateStaticParams() {
  const { rows } = await sql`SELECT slug FROM properties WHERE status = 'active'`;
  return rows.map((row) => ({
    slug: row.slug,
  }));
}

async function getPropertyData(slug: string) {
  const { rows } = await sql`
    SELECT p.*, d.name as developer_name, d.rating as developer_rating,
    d.logo_url as developer_logo
    FROM properties p
    LEFT JOIN developers d ON p.developer_id = d.id
    WHERE p.slug = ${slug} AND p.status != 'sold'
    LIMIT 1
  `;
  return rows[0];
}

async function getSimilarProperties(property: any) {
  const { rows } = await sql`
    SELECT id, slug, title, price, area_total, media_urls
    FROM properties
    WHERE type = ${property.type}
    AND district = ${property.district}
    AND id != ${property.id}
    AND status = 'active'
    LIMIT 3
  `;
  return rows;
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const property = await getPropertyData(params.slug);

  if (!property) {
    return {};
  }

  const title = `${property.title} | HOMESRF`;
  const description = property.description.substring(0, 160);
  const ogImage = property.media_urls?.[0];

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: ogImage ? [ogImage] : [],
    },
  };
}

export default async function PropertyPage({ params }: { params: { slug: string } }) {
  const property = await getPropertyData(params.slug);

  if (!property) {
    notFound();
  }

  const similarProperties = await getSimilarProperties(property);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <Gallery images={property.media_urls || []} />
          <div className="mt-8">
            <h1 className="text-3xl font-bold mb-4">{property.title}</h1>
            <p className="text-gray-600 mb-4">{property.address}</p>
            <div className="flex items-center mb-4">
              <span className="text-2xl font-bold text-blue-600">{new Intl.NumberFormat('ru-RU').format(property.price)} ₽</span>
              <span className="ml-4 text-gray-500">{property.area_total} м²</span>
            </div>
            <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: property.description }}></div>
          </div>
        </div>
        <div>
          <div className="bg-white p-6 rounded-lg shadow-md mb-8">
            <h3 className="text-xl font-bold mb-4">Застройщик</h3>
            <div className="flex items-center">
              <img src={property.developer_logo} alt={property.developer_name} className="w-16 h-16 rounded-full mr-4" />
              <div>
                <p className="font-bold">{property.developer_name}</p>
                <p className="text-gray-500">Рейтинг: {property.developer_rating}</p>
              </div>
            </div>
          </div>
          <LeadForm />
        </div>
      </div>

      <div className="mt-12">
        <h2 className="text-2xl font-bold mb-6">Карта</h2>
        <YandexMap coordinates={property.coordinates} />
      </div>

      <div className="mt-12">
        <h2 className="text-2xl font-bold mb-6">Похожие объекты</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {similarProperties.map((similar: any) => (
            <div key={similar.id} className="bg-white rounded-lg shadow-md overflow-hidden">
              <img src={similar.media_urls?.[0]} alt={similar.title} className="w-full h-48 object-cover" />
              <div className="p-4">
                <h3 className="font-bold">{similar.title}</h3>
                <p className="text-gray-600">{new Intl.NumberFormat('ru-RU').format(similar.price)} ₽</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
