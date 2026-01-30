import { NextResponse } from 'next/server';
import { searchAirports } from '@/data/airports';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q') || '';

  const results = searchAirports(query, 10);

  return NextResponse.json(results);
}
