export const runtime = 'edge';

import { ImageResponse } from 'next/og';

const WIDTH = 1200;
const HEIGHT = 630;

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

// Edge-safe base64 from ArrayBuffer (no Buffer)
function arrayBufferToBase64(buf: ArrayBuffer): string {
  let binary = '';
  const bytes = new Uint8Array(buf);
  for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

async function fetchAsDataUrl(url: string | null | undefined, fallbackUrl: string): Promise<string> {
  const target = url && url.trim().length > 0 ? url : fallbackUrl;

  const tryFetch = async (u: string) => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2500);
    const res = await fetch(u, {
      headers: { Accept: 'image/*' },
      cache: 'no-store',
      signal: controller.signal,
    }).catch(() => null as unknown as Response);
    clearTimeout(timeout);
    return res;
  };

  const res = await tryFetch(target);
  if (res && res.ok) {
    const ct = res.headers.get('content-type') || '';
    const buf = await res.arrayBuffer().catch(() => null);
    if (ct.startsWith('image/') && buf && buf.byteLength > 0) {
      const b64 = arrayBufferToBase64(buf);
      return `data:${ct};base64,${b64}`;
    }
  }

  const res2 = await tryFetch(fallbackUrl);
  if (res2 && res2.ok) {
    const ct2 = res2.headers.get('content-type') || 'image/png';
    const buf2 = await res2.arrayBuffer().catch(() => null);
    if (ct2.startsWith('image/') && buf2 && buf2.byteLength > 0) {
      const b642 = arrayBufferToBase64(buf2);
      return `data:${ct2};base64,${b642}`;
    }
  }

  // 1x1 transparent PNG
  return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNgYAAAAAMAASsJTYQAAAAASUVORK5CYII=';
}

export async function GET(req: Request) {
  // Safe fallback if streaming throws later: return a simple image
  const renderSafeFallback = () =>
    new ImageResponse(
      (
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
      ),
      {
        width: WIDTH,
        height: HEIGHT,
        headers: { 'Cache-Control': 'no-store' },
      }
    );

  try {
    const { searchParams } = new URL(req.url);

    const username = searchParams.get('username') || DEFAULT_USERNAME;
    const level = parseIntSafe(searchParams.get('level'), DEFAULT_LEVEL);
    const rank = parseIntSafe(searchParams.get('rank'), DEFAULT_RANK);
    const xpCurrent = parseIntSafe(searchParams.get('xpCurrent'), DEFAULT_XP_CURRENT);
    const xpNext = parseIntSafe(searchParams.get('xpNext'), DEFAULT_XP_NEXT);
    const pfpParam = searchParams.get('pfp');
    const bgParam = searchParams.get('background');
    const safeMode = searchParams.get('safe') === '1';

    // Precompute progress
    const progress = Math.max(0, Math.min(1, xpNext > 0 ? xpCurrent / xpNext : 0));
    const progressPct = Math.round(progress * 100);

    // In safe mode, skip all image fetches and <img> tags
    let pfpDataUrl: string | null = null;
    let bgDataUrl: string | null = null;

    if (!safeMode) {
      // PFP
      pfpDataUrl = await fetchAsDataUrl(pfpParam, DEFAULT_PFP_URL);

      // Background (optional)
      try {
        const bgTarget = bgParam && bgParam.trim().length > 0 ? bgParam : DEFAULT_BG_URL;
        const res = await fetch(bgTarget, { headers: { Accept: 'image/*' }, cache: 'no-store' });
        const isImage = (res.headers.get('content-type') || '').startsWith('image/');
        const buf = isImage ? await res.arrayBuffer() : null;
        if (res.ok && buf && buf.byteLength > 0) {
          const mime = res.headers.get('content-type') || 'image/png';
          bgDataUrl = `data:${mime};base64,${arrayBufferToBase64(buf)}`;
        }
      } catch {
        bgDataUrl = null;
      }
    }

    // Render with only Satori-safe styles
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
        {bgDataUrl ? (
          <img
            src={bgDataUrl}
            alt=""
            width={WIDTH}
            height={HEIGHT}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              objectFit: 'cover',
              opacity: 0.9,
            }}
          />
        ) : null}

        {/* Simple linear overlay (avoid radial-gradient) */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background:
              'linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.35) 100%)',
          }}
        />

        <div
          style={{
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            padding: 48,
            gap: 28,
            color: 'white',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
            {!safeMode && pfpDataUrl ? (
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
            ) : (
              // Minimal placeholder in safe mode
              <div
                style={{
                  width: 120,
                  height: 120,
                  borderRadius: 9999,
                  background: '#222',
                  border: '4px solid rgba(255,255,255,0.15)',
                }}
              />
            )}

            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ fontSize: 48, fontWeight: 700 }}>{username}</div>
              <div style={{ fontSize: 28, opacity: 0.9 }}>Level {level}</div>
            </div>

            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center' }}>
              <div
                style={{
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
                  background: '#60A5FA',
                }}
              />
            </div>
          </div>

          <div style={{ marginTop: 16, display: 'flex', justifyContent: 'space-between' }}>
            <div style={{ fontSize: 24, opacity: 0.85 }}>fitlocker.io</div>
            <div style={{ fontSize: 24, opacity: 0.85 }}>#FitLocker #Base #Fitness</div>
          </div>
        </div>
      </div>
    );

    // If streaming fails later due to Satori, caller will still see 200/0;
    // so also provide an explicit safe mode endpoint to validate rendering.
    return new ImageResponse(img, {
      width: WIDTH,
      height: HEIGHT,
      headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60' },
    });
  } catch {
    return renderSafeFallback();
  }
}
