import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  const username = searchParams.get('username') || 'Athlete';
  const level = searchParams.get('level') || '1';
  const xpCurrent = Number(searchParams.get('xpCurrent') || '0');
  const xpNext = Number(searchParams.get('xpNext') || '500');
  const rank = searchParams.get('rank') || '—';
  const background = searchParams.get('background') || '';

  // Default PFP if none provided
  const pfp =
    searchParams.get('pfp') ||
    'https://img.fitlocker.io/images/default-pfp.png';

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
            background: background
              ? `url(${background}) center/cover no-repeat`
              : 'linear-gradient(135deg,#0e0f12,#0b0c0f)',
            color: '#e5e7eb',
            fontFamily: 'Inter, system-ui, Arial',
          }}
        >
          <div style={{ width: 1, height: 140, display: 'flex' }} />

          {/* Avatar */}
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
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={pfp}
              width={204}
              height={204}
              style={{ borderRadius: 999, objectFit: 'cover' }}
            />
          </div>

          {/* Rank */}
          <div
            style={{
              marginTop: 28,
              fontSize: 80,
              fontWeight: 800,
              background: 'linear-gradient(90deg,#00E0FF,#8B5CF6,#00FF88)',
              WebkitBackgroundClip: 'text',
              color: 'transparent',
              display: 'flex',
            }}
          >
            {`Rank #${rank}`}
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
                    Math.max(0, Math.min(1, xpCurrent / Math.max(1, xpNext))) *
                    100
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
