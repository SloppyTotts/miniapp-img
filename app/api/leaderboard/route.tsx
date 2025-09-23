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

// ArrayBuffer -> base64 (Edge-safe)
function ab64(buf: ArrayBuffer): string {
  let s = '';
  const b = new Uint8Array(buf);
  for (let i = 0; i < b.length; i++) s += String.fromCharCode(b[i]);
  return btoa(s);
}

// Fetch image and inline as data URL with short timeout + strict checks
async function fetchAsDataUrl(u: string): Promise<string | null> {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 2000);
    const res = await fetch(u, { headers: { Accept: 'image/*' }, cache: 'no-store', signal: ctrl.signal });
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
    const pfpParam = searchParams.get('pfp');
    const noPfp = searchParams.get('noPfp') === '1';

    // Progress bar sizing (px, not %)
    const barWidth = 1000;
    const progress = Math.max(0, Math.min(1, xpNext > 0 ? xpCurrent / xpNext : 0));
    const fillWidth = Math.round(barWidth * progress);
    const progressPct = Math.round(progress * 100);

    // Inline avatar unless skipped
    let pfpDataUrl: string | null = null;
    if (!noPfp) {
      const src = pfpParam && pfpParam.trim() ? pfpParam : DEFAULT_PFP_URL;
      pfpDataUrl = await fetchAsDataUrl(src);
    }

    const img = (
      <div style={{ width: WIDTH, height: HEIGHT, display: 'flex', flexDirection: 'column', backgroundColor: '#0b0b10', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', background: 'linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.35) 100%)' }} />
        <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', padding: 48, gap: 28, color: '#fff' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
            {pfpDataUrl ? (
              <img
                src={pfpDataUrl}
                alt=""
                width={120}
                height={120}
                style={{ borderRadius: 9999, border: '4px solid rgba(255,255,255,0.15)', objectFit: 'cover', background: '#111' }}
              />
            ) : (
              <div style={{ width: 120, height: 120, display: 'flex', borderRadius: 9999, background: '#222', border: '4px solid rgba(255,255,255,0.15)' }} />
            )}

            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', fontSize: 48, fontWeight: 700 }}>{username}</div>
              <div style={{ display: 'flex', fontSize: 28, opacity: 0.9 }}>Level {level}</div>
            </div>

            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center' }}>
              <div style={{ display: 'flex', padding: '10px 18px', borderRadius: 9999, background: '#A78BFA', color: '#0b0b10', fontWeight: 800, fontSize: 28 }}>
                Rank #{rank}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 8 }}>
            <div style={{ display: 'flex', fontSize: 26, opacity: 0.9 }}>
              XP {xpCurrent} / {xpNext} ({progressPct}%)
            </div>
            <div style={{ display: 'flex', width: barWidth + 'px', height: '28px', borderRadius: 9999, background: 'rgba(255,255,255,0.12)', overflow: 'hidden' }}>
              <div style={{ display: 'flex', width: fillWidth + 'px', height: '100%', background: '#60A5FA' }} />
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
