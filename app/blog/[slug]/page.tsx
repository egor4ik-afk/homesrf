export default function ArticlePage({ params }: { params: { slug: string } }) {
  return <main>Статья: {params.slug}</main>
}