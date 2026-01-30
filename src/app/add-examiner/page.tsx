'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AirportAutocomplete from '@/components/AirportAutocomplete';

interface Airport {
  icao: string;
  name: string;
  city: string;
  state: string;
  lat: number;
  lng: number;
}

const CERTIFICATES = ['PPL', 'IR', 'CPL', 'CFI', 'CFII', 'MEI', 'ATP'];

export default function AddExaminerPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [airport, setAirport] = useState<Airport | null>(null);
  const [form, setForm] = useState({
    name: '',
    certificates: [] as string[],
    phone: '',
    email: '',
    website: '',
  });

  if (status === 'loading') {
    return <div className="text-center py-12">Loading...</div>;
  }

  if (!session) {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold mb-4">Login Required</h1>
        <p className="text-gray-500 mb-4">You need to be logged in to add an examiner.</p>
        <Link href="/login" className="text-blue-500 hover:underline">
          Login here
        </Link>
      </div>
    );
  }

  const handleCertificateChange = (cert: string) => {
    setForm(prev => ({
      ...prev,
      certificates: prev.certificates.includes(cert)
        ? prev.certificates.filter(c => c !== cert)
        : [...prev.certificates, cert],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (form.certificates.length === 0) {
      setError('Please select at least one certificate type');
      return;
    }

    if (!airport) {
      setError('Please select an airport');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/examiners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          airport_id: airport.icao,
          location: airport.city,
          state: airport.state,
          lat: airport.lat,
          lng: airport.lng,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        router.push(`/examiner/${data.id}`);
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to add examiner');
      }
    } catch {
      setError('Failed to add examiner');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Add a DPE</h1>

      <form onSubmit={handleSubmit} className="card p-6 space-y-4">
        {error && <div className="p-3 bg-red-100 text-red-700 rounded">{error}</div>}

        <div>
          <label className="block text-sm font-medium mb-1">Examiner Name *</label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="John Smith"
            className="w-full p-2 border rounded dark:bg-slate-800 dark:border-slate-600"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Airport *</label>
          <AirportAutocomplete
            value={airport}
            onChange={setAirport}
            placeholder="Search by airport code, name, or city..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Certificates They Can Examine *</label>
          <div className="flex flex-wrap gap-3">
            {CERTIFICATES.map((cert) => (
              <label key={cert} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.certificates.includes(cert)}
                  onChange={() => handleCertificateChange(cert)}
                  className="rounded"
                />
                {cert}
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Phone (optional)</label>
          <input
            type="tel"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            placeholder="(555) 123-4567"
            className="w-full p-2 border rounded dark:bg-slate-800 dark:border-slate-600"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Email (optional)</label>
          <input
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="dpe@example.com"
            className="w-full p-2 border rounded dark:bg-slate-800 dark:border-slate-600"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Website (optional)</label>
          <input
            type="url"
            value={form.website}
            onChange={(e) => setForm({ ...form, website: e.target.value })}
            placeholder="https://example.com"
            className="w-full p-2 border rounded dark:bg-slate-800 dark:border-slate-600"
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full py-3 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {submitting ? 'Adding...' : 'Add Examiner'}
        </button>
      </form>
    </div>
  );
}
