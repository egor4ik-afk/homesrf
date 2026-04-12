type PageProps = {
  params: { slug: string };
};

export default function Page({ params }: PageProps) {
  return <div>Blog Post: {params.slug}</div>;
}