export default function DeveloperPage({ params }: { params: { slug: string } }) {
  return <main>Застройщик: {params.slug}</main>
}