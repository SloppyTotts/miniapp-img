/* eslint-disable @next/next/no-img-element */
export const runtime = 'edge';

import { ImageResponse } from 'next/og';

const WIDTH = 1200;
const HEIGHT = 630;

const DEFAULT_USERNAME = 'Athlete';
const DEFAULT_LEVEL = 1;
const DEFAULT_RANK = 999;
const DEFAULT_XP_CURRENT = 0;
const DEFAULT_XP_NEXT = 500;

// Small, always-available fallbacks hosted on same domain
const DEFAULT_PFP_URL = 'https://img.fitlocker.io/CheckInPFP.png';
const DEFAULT_BG_URL = 'https://img.fitlocker.io/CheckInBKG.png';

async function fetchAsDataUrl(
  url: string | null | undefined,
  fallbackUrl: string
): Promise<string> {
  try {
    const target = (url && url.trim().length > 0) ? url : fallbackUrl;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2500);

    const res = await fetch(target, {
      headers: { Accept: 'image/*' },
      cache: 'no-store',
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!res.ok) {
      // fallback fetch
      const res2 = await fetch(fallbackUrl, {
        headers: { Accept: 'image/*' },
        cache: 'no-store',
      });
      if (!res2.ok) throw new Error('fallback fetch failed');
      const buf2 = await res2.arrayBuffer();
      if (!buf2 || buf2.byteLength === 0) throw new Error('fallback empty');
      const mime2 = res2.headers.get('content-type') || 'image/png';
      const b64_2 = Buffer.from(buf2).toString('base64');
      return `data:${mime2};base64,${b64_2}`;
    }

    const buf = await res.arrayBuffer();
    if (!buf || buf.byteLength === 0) {
      // fallback path if provider responds with 0 bytes
      const res2 = await fetch(fallbackUrl, {
        headers: { Accept: 'image/*' },
        cache: 'no-store',
      });
      if (!res2.ok) throw new Error('fallback fetch failed (empty primary)');
      const buf2 = await res2.arrayBuffer();
      if (!buf2 || buf2.byteLength === 0) throw new Error('fallback empty 2');
      const mime2 = res2.headers.get('content-type') || 'image/png';
      const b64_2 = Buffer.from(buf2).toString('base64');
      return `data:${mime2};base64,${b64_2}`;
    }

    const mime = res.headers.get('content-type') || 'image/png';
    const b64 = Buffer.from(buf).toString('base64');
    return `data:${mime};base64,${b64}`;
  } catch {
    // final hard fallback
    const res = await fetch(fallbackUrl, {
      headers: { Accept: 'image/*' },
      cache: 'no-store',
    });
    const buf = await res.arrayBuffer();
    const mime = res.headers.get('content-type') || 'image/png';
    const b64 = Buffer.from(buf).toString('base64');
    return `data:${mime};base64,${b64}`;
  }
}

function parseIntSafe(v: string | null, dflt: number): number {
  const n = v ? parseInt(v, 10) : NaN;
  return Number.isFinite(n) && n > 0 ? n : dflt;
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const username = searchParams.get('username') || DEFAULT_USERNAME;

    const level = parseIntSafe(searchParams.get('level'), DEFAULT_LEVEL);
    const rank = parseIntSafe(searchParams.get('rank'), DEFAULT_RANK);
    const xpCurrent = parseIntSafe(searchParams.get('xpCurrent'), DEFAULT_XP_CURRENT);
    const xpNext = parseIntSafe(searchParams.get('xpNext'), DEFAULT_XP_NEXT);

    const pfpParam = searchParams.get('pfp');
    const bgParam = searchParams.get('background');

    // Make sure external images never break rendering
    const pfpDataUrl = await fetchAsDataUrl(pfpParam, DEFAULT_PFP_URL);
    const bgDataUrl = await fetchAsDataUrl(bgParam, DEFAULT_BG_URL);

    const progress = Math.max(0, Math.min(1, xpNext > 0 ? xpCurrent / xpNext : 0));
    const progressPct = Math.round(progress * 100);

    const img = (
      <div
        style={{
          width: WIDTH,
          height: HEIGHT,
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#0b0b10',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Background */}
        <img
          src={bgDataUrl}
          alt=""
          width={WIDTH}
          height={HEIGHT}
          style={{
            position: 'absolute',
            inset: 0,
            objectFit: 'cover',
            opacity: 0.9,
          }}
        />

        {/* Overlay */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'radial-gradient(60% 60% at 50% 50%, rgba(0,0,0,0) 0%, rgba(0,0,0,0.35) 100%)',
          }}
        />

        {/* Content */}
        <div
          style={{
            position: 'relative',
            zIndex: 1,
            display: 'flex',
            flexDirection: 'column',
            padding: 48,
            gap: 28,
            color: 'white',
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
            <img
              src={pfpDataUrl}
              alt=""
              width={120}
              height={120}
              style={{
                borderRadius: 9999,
                border: '4px solid rgba(255,255,255,0.15)',
                objectFit: 'cover',
                background: '#111',
              }}
            />
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ fontSize: 48, fontWeight: 700 }}>{username}</div>
              <div style={{ fontSize: 28, opacity: 0.9 }}>Level {level}</div>
            </div>

            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 12 }}>
              <div
                style={{
                  padding: '10px 18px',
                  borderRadius: 9999,
                  background:
                    'linear-gradient(90deg, #6EE7F9 0%, #A78BFA 50%, #34D399 100%)',
                  color: '#0b0b10',
                  fontWeight: 800,
                  fontSize: 28,
                }}
              >
                Rank #{rank}
              </div>
            </div>
          </div>

          {/* Progress */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 8 }}>
            <div style={{ fontSize: 26, opacity: 0.9 }}>
              XP {xpCurrent} / {xpNext} ({progressPct}%)
            </div>
            <div
              style={{
                width: '100%',
                height: 28,
                borderRadius: 9999,
                background: 'rgba(255,255,255,0.12)',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  width: `${progressPct}%`,
                  height: '100%',
                  background:
                    'linear-gradient(90deg, #60A5FA 0%, #A78BFA 50%, #34D399 100%)',
                }}
              />
            </div>
          </div>

          {/* Footer */}
          <div style={{ marginTop: 16, display: 'flex', justifyContent: 'space-between' }}>
            <div style={{ fontSize: 24, opacity: 0.85 }}>fitlocker.io</div>
            <div style={{ fontSize: 24, opacity: 0.85 }}>#FitLocker #Base #Fitness</div>
          </div>
        </div>
      </div>
    );

    return new ImageResponse(img, {
      width: WIDTH,
      height: HEIGHT,
      headers: {
        // Keep this simple to avoid duplicate directives
        // Edge caches via Vercel CDN for 5 minutes, then revalidates
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60',
      },
    });
  } catch (err) {
    // Fallback image with text if something unexpected happens
    const fallback = (
      <div
        style={{
          width: WIDTH,
          height: HEIGHT,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0b0b10',
          color: 'white',
          fontSize: 48,
          fontWeight: 700,
        }}
      >
        Unable to generate image
      </div>
    );
    return new ImageResponse(fallback, {
      width: WIDTH,
      height: HEIGHT,
      headers: { 'Cache-Control': 'no-store' },
    });
  }
}
