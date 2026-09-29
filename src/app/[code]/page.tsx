import { notFound } from 'next/navigation'
import Home from '../page'

export default async function Room({ params }: { params: Promise<{ code: string }> }) {
  if (!/^\d{6}$/u.test((await params).code)) notFound()
  return <Home params={params} />
}