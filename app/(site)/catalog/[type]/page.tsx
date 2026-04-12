type PageProps = {
  params: { type: string };
};

export default function Page({ params }: PageProps) {
  return <div>Catalog: {params.type}</div>;
}