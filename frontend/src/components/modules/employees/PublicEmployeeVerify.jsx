import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { gasRequest } from '@/services/gasClient';
import { useBrand } from '@/context/BrandContext';
import { BadgeCheck, BadgeX, Loader2 } from 'lucide-react';

const PublicEmployeeVerify = () => {
  const { code } = useParams();
  const { company, primary } = useBrand();
  const accent = primary || '#F26522';
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError('');
      try {
        const res = await gasRequest('GET', `/public/employee/${encodeURIComponent(code || '')}`);
        if (!cancelled) setData(res?.data || res);
      } catch (err) {
        if (!cancelled) {
          setData(null);
          setError(err?.response?.data?.message || err?.message || 'Verification failed');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [code]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{
      background: 'linear-gradient(165deg, #f7f4ef 0%, #ebe4d8 50%, #e2d9cc 100%)',
    }}>
      <div className="w-full max-w-md rounded-xl border border-stone-300 bg-white/95 shadow-lg overflow-hidden">
        <div className="h-1.5" style={{ backgroundColor: accent }} />
        <div className="p-6 space-y-4">
          <div className="flex items-center gap-3">
            {company?.logo ? (
              <img src={company.logo} alt="" className="h-12 w-auto object-contain" />
            ) : (
              <div className="text-lg font-bold" style={{ color: accent }}>{company?.name || 'AMZ Prints'}</div>
            )}
            <div>
              <p className="text-xs uppercase tracking-wider text-stone-500 font-semibold">Employment verification</p>
              <p className="text-sm text-stone-600">{company?.name || 'AMZ Prints'}</p>
            </div>
          </div>

          {loading && (
            <div className="py-10 text-center text-stone-500 text-sm flex flex-col items-center gap-2">
              <Loader2 className="h-6 w-6 animate-spin" />
              Checking record…
            </div>
          )}

          {!loading && error && (
            <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800 flex gap-2">
              <BadgeX className="h-5 w-5 shrink-0" />
              <div>
                <p className="font-semibold">Not verified</p>
                <p className="mt-1">{error}</p>
              </div>
            </div>
          )}

          {!loading && data && (
            <div className="space-y-3">
              <div className={`rounded-lg border p-3 flex gap-2 text-sm ${
                data.active ? 'border-emerald-200 bg-emerald-50 text-emerald-900' : 'border-amber-200 bg-amber-50 text-amber-900'
              }`}>
                <BadgeCheck className="h-5 w-5 shrink-0" />
                <div>
                  <p className="font-semibold">{data.active ? 'Verified — Active record' : data.expired ? 'Record found — Card expired' : 'Record found'}</p>
                  <p className="text-xs mt-0.5 opacity-80">{data.companyNote}</p>
                </div>
              </div>
              <dl className="grid grid-cols-2 gap-x-3 gap-y-2 text-sm">
                <dt className="text-stone-500">Name</dt>
                <dd className="font-semibold text-stone-900">{data.name}</dd>
                <dt className="text-stone-500">Code</dt>
                <dd className="font-medium">{data.employeeCode}</dd>
                <dt className="text-stone-500">Designation</dt>
                <dd>{data.designation || '—'}</dd>
                <dt className="text-stone-500">Department</dt>
                <dd>{data.department || '—'}</dd>
                <dt className="text-stone-500">Joined</dt>
                <dd>{data.joinDate || '—'}</dd>
                <dt className="text-stone-500">End date</dt>
                <dd>{data.endDate || '—'}</dd>
                <dt className="text-stone-500">Valid until</dt>
                <dd>{data.validUntil || '—'}</dd>
                <dt className="text-stone-500">Status</dt>
                <dd>{data.status || '—'}</dd>
              </dl>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PublicEmployeeVerify;
