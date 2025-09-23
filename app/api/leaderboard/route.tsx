export const runtime = 'edge';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { ImageResponse } from 'next/og';

const WIDTH = 1200;
const HEIGHT = 800;
const PADDING = 64;
const CONTENT_WIDTH = WIDTH - PADDING * 2;

const DEFAULT_USERNAME = 'Athlete';
const DEFAULT_LEVEL = 1;
const DEFAULT_RANK = 999;
const DEFAULT_XP_CURRENT = 0;
const DEFAULT_XP_NEXT = 500;

const DEFAULT_PFP_URL = 'https://img.fitlocker.io/images/wc.png';
const DEFAULT_BG_URL = 'https://img.fitlocker.io/images/CheckInBKG.png';

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
    const bgParam = searchParams.get('background') || '';

    const barWidth = CONTENT_WIDTH;
    const barHeight = 28;
    const progress = Math.max(0, Math.min(1, xpNext > 0 ? xpCurrent / xpNext : 0));
    const fillWidth = Math.round(barWidth * progress);

    let pfpDataUrl: string | null = null;
    if (pfpParam) pfpDataUrl = await fetchAsDataUrlStrict(pfpParam);
    if (!pfpDataUrl) pfpDataUrl = await fetchAsDataUrlStrict(DEFAULT_PFP_URL);

    let bgDataUrl: string | null = null;
    if (bgParam) bgDataUrl = await fetchAsDataUrlStrict(bgParam);
    if (!bgDataUrl) bgDataUrl = await fetchAsDataUrlStrict(DEFAULT_BG_URL);

    const img = (
      <div style={{ width: WIDTH, height: HEIGHT, display: 'flex', flexDirection: 'column', position: 'relative' }}>
        {bgDataUrl ? (
          <img src={bgDataUrl} alt="" width={WIDTH} height={HEIGHT} style={{ position: 'absolute', top: 0, left: 0, objectFit: 'cover' }} />
        ) : (
          <div style={{ width: WIDTH, height: HEIGHT, background: '#0b0b10' }} />
        )}

        {/* Content */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 180, gap: 26, color: '#fff', position: 'relative', zIndex: 1 }}>
          {/* PFP + username + rank */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
            {pfpDataUrl ? (
              <img src={pfpDataUrl} alt="" width={170} height={170} style={{ borderRadius: 9999, border: '4px solid rgba(255,255,255,0.15)', background: '#111' }} />
            ) : (
              <div style={{ width: 170, height: 170, display: 'flex', borderRadius: 9999, background: '#222', border: '4px solid rgba(255,255,255,0.15)' }} />
            )}
            <div style={{ display: 'flex', fontSize: 52, fontWeight: 700 }}>@{username}</div>
            <div style={{ display: 'flex', fontSize: 26, opacity: 0.9 }}>Rank #{rank}</div>
          </div>

          {/* Stats block moved further down */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18, marginTop: 56, width: CONTENT_WIDTH }}>
            {/* Row: Level left, XP right */}
            <div style={{ display: 'flex', alignItems: 'center', width: CONTENT_WIDTH }}>
              <div
                style={{
                  display: 'flex',
                  paddingTop: 12,
                  paddingBottom: 12,
                  paddingLeft: 22,
                  paddingRight: 22,
                  borderRadius: 10,
                  background: '#1D4ED8',
                  color: '#fff',
                  fontWeight: 800,
                  fontSize: 26,
                }}
              >
                Level {level}
              </div>
              <div style={{ display: 'flex', marginLeft: 'auto' as any, fontSize: 28, opacity: 0.95 }}>
                {xpCurrent}/{xpNext} XP
              </div>
            </div>

            {/* Progress bar */}
            <div style={{ display: 'flex', width: barWidth, height: barHeight, borderRadius: 9999, background: 'rgba(255,255,255,0.12)', overflow: 'hidden' }}>
              <div style={{ display: 'flex', width: fillWidth, height: barHeight, background: 'linear-gradient(90deg, #60A5FA 0%, #22D3EE 50%, #3B82F6 100%)' }} />
            </div>
          </div>
        </div>
      </div>
    );

    return new ImageResponse(img, { width: WIDTH, height: HEIGHT, headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return safe('FitLocker');
  }
}
