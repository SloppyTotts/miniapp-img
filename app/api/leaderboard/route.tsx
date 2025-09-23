export const runtime = 'edge';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { ImageResponse } from 'next/og';

const WIDTH = 1200;
const HEIGHT = 630;

const DEFAULT_USERNAME = 'Athlete';
const DEFAULT_LEVEL = 1;
const DEFAULT_RANK = 999;
const DEFAULT_XP_CURRENT = 0;
const DEFAULT_XP_NEXT = 500;

const DEFAULT_PFP_URL = 'https://img.fitlocker.io/images/wc.png';

function parseIntSafe(v: string | null, dflt: number): number {
  const n = v ? parseInt(v, 10) : NaN;
  return Number.isFinite(n) && n >= 0 ? n : dflt;
}

function ab64(buf: ArrayBuffer): string {
  let s = '';
  const b = new Uint8Array(buf);
  for (let i = 0; i < b.length; i++) s += String.fromCharCode(b[i]);
  return btoa(s);
}

async function fetchAsDataUrlStrict(srcUrl: string): Promise<string | null> {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 2200);
    const res = await fetch(srcUrl, {
      headers: {
        Accept: 'image/*',
        'User-Agent': 'FitLocker-OG/1.0',
        Referer: 'https://img.fitlocker.io/',
      },
      cache: 'no-store',
      signal: ctrl.signal,
    });
    clearTimeout(t);
    if (!res.ok) return null;
    const ct = res.headers.get('content-type') || '';
    if (!ct.startsWith('image/')) return null;
    const buf = await res.arrayBuffer();
    if (!buf || buf.byteLength === 0) return null;
    return `data:${ct};base64,${ab64(buf)}`;
  } catch {
    return null;
  }
}

export async function GET(req: Request) {
  const safe = (txt: string) =>
    new ImageResponse(
      <div style={{ width: WIDTH, height: HEIGHT, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0b0b10', color: '#fff', fontSize: 48, fontWeight: 700 }}>{txt}</div>,
      { width: WIDTH, height: HEIGHT, headers: { 'Cache-Control': 'no-store' } }
    );

  try {
    const { searchParams } = new URL(req.url);
    if (searchParams.get('safe') === '1') return safe('FitLocker');

    const username = searchParams.get('username') || DEFAULT_USERNAME;
    const level = parseIntSafe(searchParams.get('level'), DEFAULT_LEVEL);
    const rank = parseIntSafe(searchParams.get('rank'), DEFAULT_RANK);
    const xpCurrent = parseIntSafe(searchParams.get('xpCurrent'), DEFAULT_XP_CURRENT);
    const xpNext = parseIntSafe(searchParams.get('xpNext'), DEFAULT_XP_NEXT);
    const pfpParam = searchParams.get('pfp') || '';

    const barWidth = 1000;
    const barHeight = 28;
    const progress = Math.max(0, Math.min(1, xpNext > 0 ? xpCurrent / xpNext : 0));
    const fillWidth = Math.round(barWidth * progress);
    const progressPct = Math.round(progress * 100);

    // Try provided PFP, then default; otherwise null (placeholder)
    let pfpDataUrl: string | null = null;
    if (pfpParam) pfpDataUrl = await fetchAsDataUrlStrict(pfpParam);
    if (!pfpDataUrl) pfpDataUrl = await fetchAsDataUrlStrict(DEFAULT_PFP_URL);

    const img = (
      <div style={{ width: WIDTH, height: HEIGHT, display: 'flex', flexDirection: 'column', backgroundColor: '#0b0b10' }}>
        <div style={{ display: 'flex', paddingLeft: 48, paddingRight: 48, paddingTop: 48, paddingBottom: 0, color: '#fff', flexDirection: 'column', gap: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
            {pfpDataUrl ? (
              <img
                src={pfpDataUrl}
                alt=""
                width={120}
                height={120}
                style={{
                  borderRadius: 9999,
                  border: '4px solid rgba(255,255,255,0.15)',
                  background: '#111',
                }}
              />
            ) : (
              <div style={{ width: 120, height: 120, display: 'flex', borderRadius: 9999, background: '#222', border: '4px solid rgba(255,255,255,0.15)' }} />
            )}

            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', fontSize: 48, fontWeight: 700 }}>{username}</div>
              <div style={{ display: 'flex', fontSize: 28, opacity: 0.9 }}>Level {level}</div>
            </div>

            <div style={{ display: 'flex', marginLeft: 'auto' as any }}>
              <div
                style={{
                  display: 'flex',
                  paddingTop: 10,
                  paddingBottom: 10,
                  paddingLeft: 18,
                  paddingRight: 18,
                  borderRadius: 9999,
                  background: '#A78BFA',
                  color: '#0b0b10',
                  fontWeight: 800,
                  fontSize: 28,
                }}
              >
                Rank #{rank}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', fontSize: 26, opacity: 0.9 }}>
              XP {xpCurrent} / {xpNext} ({progressPct}%)
            </div>
            <div style={{ display: 'flex', width: barWidth, height: barHeight, borderRadius: 9999, background: 'rgba(255,255,255,0.12)', overflow: 'hidden' }}>
              <div style={{ display: 'flex', width: fillWidth, height: barHeight, background: '#60A5FA' }} />
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', marginTop: 16 }}>
            <div style={{ display: 'flex', fontSize: 24, opacity: 0.85 }}>fitlocker.io</div>
            <div style={{ display: 'flex', fontSize: 24, opacity: 0.85 }}>#FitLocker #Base #Fitness</div>
          </div>
        </div>
      </div>
    );

    return new ImageResponse(img, { width: WIDTH, height: HEIGHT, headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return safe('FitLocker');
  }
}
