import { Metadata, ResolvingMetadata } from 'next';

type PageProps = {
  params: { slug: string };
};

export async function generateMetadata(
  { params }: PageProps,
  parent: ResolvingMetadata
): Promise<Metadata> {
  // read route params
  const slug = params.slug;

  // fetch data

  // optionally access and extend (rather than replace) parent metadata
  const previousImages = (await parent).openGraph?.images || [];

  return {
    title: `Property ${slug}`,
    openGraph: {
      images: ['/some-specific-page-image.jpg', ...previousImages],
    },
  };
}

export default function Page({ params }: PageProps) {
  return <div>Property: {params.slug}</div>;
}