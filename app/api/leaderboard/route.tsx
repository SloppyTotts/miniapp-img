import { ImageResponse } from 'next/og';

export const runtime = 'edge';

async function fetchAsDataUrl(url: string, timeoutMs = 2000): Promise<string | null> {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), timeoutMs);
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: {
        'User-Agent': 'FitLocker-OG/1.0 (+https://fitlocker.io)',
        'Accept': 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
        'Referer': 'https://fitlocker.io/',
      },
      cache: 'no-store',
    });
    clearTimeout(t);
    if (!res.ok) return null;
    const ct = res.headers.get('content-type') || 'image/png';
    const ab = await res.arrayBuffer();
    const b64 = Buffer.from(ab).toString('base64');
    return `data:${ct};base64,${b64}`;
  } catch {
    return null;
  }
}

function resolveBackground(param?: string) {
  const defaultBg = 'https://fitlocker-backend.onrender.com/api/embed/public/templates/CheckInBKG.png';
  if (!param) return defaultBg;
  if (param.startsWith('template:')) {
    const key = param.split(':')[1];
    if (key === 'checkin') return defaultBg;
  }
  return param; // treat as absolute URL
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  const username = searchParams.get('username') || 'Athlete';
  const level = searchParams.get('level') || '1';
  const xpCurrent = Number(searchParams.get('xpCurrent') || '0');
  const xpNext = Number(searchParams.get('xpNext') || '500');
  const rank = searchParams.get('rank') || '—';

  const bgSrc = resolveBackground(searchParams.get('background') || undefined);

  const pfpParam = searchParams.get('pfp') || '';
  const defaultPfp = 'https://img.fitlocker.io/images/default-pfp.png';

  // Inline the PFP to avoid hotlink issues
  let pfpSrc = defaultPfp;
  if (pfpParam) {
    const inlined = await fetchAsDataUrl(pfpParam, 2000);
    pfpSrc = inlined || pfpParam || defaultPfp;
  }

  try {
    return new ImageResponse(
      (
        <div
          style={{
            width: 1200,
            height: 800,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'flex-start',
            background: `url(${bgSrc}) center/cover no-repeat`,
            color: '#e5e7eb',
            fontFamily: 'Inter, system-ui, Arial',
          }}
        >
          {/* Spacer */}
          <div style={{ width: 1, height: 140, display: 'flex' }} />

          {/* Avatar with ring */}
          <div
            style={{
              width: 220,
              height: 220,
              borderRadius: 999,
              padding: 8,
              background: 'linear-gradient(90deg,#00E0FF,#8B5CF6,#00FF88)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 18px 40px rgba(0,0,0,0.35)',
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={pfpSrc}
              width={204}
              height={204}
              style={{ borderRadius: 999, objectFit: 'cover' }}
            />
          </div>

          {/* Rank badge */}
          <div
            style={{
              marginTop: 28,
              width: 220,
              height: 120,
              borderRadius: 16,
              background: 'linear-gradient(90deg,#00E0FF,#8B5CF6,#00FF88)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 12px 30px rgba(0,0,0,0.25)',
            }}
          >
            <div
              style={{
                padding: '10px 20px',
                borderRadius: 999,
                background: 'rgba(0,0,0,0.55)',
                color: '#e5e7eb',
                fontWeight: 800,
                fontSize: 40,
                letterSpacing: 0.5,
                display: 'flex',
              }}
            >
              {`Rank #${rank}`}
            </div>
          </div>

          {/* Username */}
          <div
            style={{
              marginTop: 12,
              fontSize: 36,
              fontWeight: 700,
              color: '#e5e7eb',
              display: 'flex',
            }}
          >
            {username}
          </div>

          {/* Stats + progress */}
          <div
            style={{
              marginTop: 90,
              width: 1080,
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {/* Top row */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: 10,
                fontSize: 26,
                fontWeight: 700,
              }}
            >
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <span>{`Level ${level}`}</span>
                <span
                  style={{
                    padding: '6px 10px',
                    borderRadius: 12,
                    background: 'rgba(34,197,94,0.18)',
                    color: '#22c55e',
                    fontSize: 18,
                    fontWeight: 700,
                    display: 'flex',
                  }}
                >
                  Early Access
                </span>
              </div>
              <div style={{ display: 'flex' }}>
                {`${xpCurrent.toLocaleString()} / ${xpNext.toLocaleString()} XP`}
              </div>
            </div>

            {/* Progress bar */}
            <div
              style={{
                width: '100%',
                height: 28,
                background: '#1f2937',
                borderRadius: 14,
                overflow: 'hidden',
                display: 'flex',
              }}
            >
              <div
                style={{
                  width: `${
                    Math.max(0, Math.min(1, xpCurrent / Math.max(1, xpNext))) * 100
                  }%`,
                  height: '100%',
                  background: 'linear-gradient(90deg,#00E0FF,#8B5CF6,#00FF88)',
                  display: 'flex',
                }}
              />
            </div>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 800,
        headers: {
          'Cache-Control': 'public, immutable, no-transform, max-age=300',
        },
      }
    );
  } catch {
    return new ImageResponse(
      (
        <div
          style={{
            width: 1200,
            height: 800,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#0b0c0f',
            color: '#e5e7eb',
            fontSize: 36,
          }}
        >
          Unable to generate image
        </div>
      ),
      {
        width: 1200,
        height: 800,
        headers: {
          'Cache-Control': 'public, no-cache, no-store, must-revalidate, max-age=0',
        },
      }
    );
  }
}
