export const runtime = 'edge';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { ImageResponse } from 'next/og';

const WIDTH = 1200;
const HEIGHT = 800; // 1.5 aspect ratio for Farcaster
const PADDING = 48;
const CONTENT_WIDTH = WIDTH - PADDING * 2;

const DEFAULT_USERNAME = 'Athlete';
const DEFAULT_LEVEL = 1;
const DEFAULT_MEMBER_NUMBER = 1;
const DEFAULT_TIER = 'blue';
const DEFAULT_IDENTITY_STREAK = 0;

const DEFAULT_PFP_URL = 'https://img.fitlocker.io/images/wc.png';

// Tier color configurations
const TIER_COLORS = {
  blue: {
    primary: '#0052FF',
    accent: '#60A5FA',
    gradient: 'linear-gradient(135deg, #0052FF 0%, #3B82F6 50%, #1E40AF 100%)',
    border: '#0052FF',
  },
  gold: {
    primary: '#FFD700',
    accent: '#FFE55C',
    gradient: 'linear-gradient(135deg, #FFD700 0%, #FFA500 50%, #FF8C00 100%)',
    border: '#FFD700',
  },
  platinum: {
    primary: '#E5E4E2',
    accent: '#F5F5F5',
    gradient: 'linear-gradient(135deg, #E5E4E2 0%, #BCC6CC 50%, #8E8E93 100%)',
    border: '#E5E4E2',
  },
};

// Member band configurations
const MEMBER_BAND_COLORS = {
  genesis: { bg: 'rgba(255, 215, 0, 0.2)', text: '#FFD700', label: 'GENESIS' },
  wave1: { bg: 'rgba(0, 255, 136, 0.2)', text: '#00FF88', label: 'WAVE 1' },
  founders: { bg: 'rgba(139, 92, 246, 0.2)', text: '#8B5CF6', label: 'FOUNDERS' },
  standard: null,
};

function parseIntSafe(v: string | null, dflt: number): number {
  const n = v ? parseInt(v, 10) : NaN;
  return Number.isFinite(n) && n >= 0 ? n : dflt;
}

// Helper functions for customization values
function getBackgroundIntensityValue(intensity: string): number {
  const map: Record<string, number> = { subtle: 0.5, normal: 1.0, vivid: 1.5, intense: 2.0 };
  return map[intensity] || 1.0;
}

function getBackgroundOpacityValue(opacity: string): number {
  const map: Record<string, number> = { light: 0.7, medium: 0.85, full: 1.0, dark: 0.5 };
  return map[opacity] || 1.0;
}

function getBackgroundOverlayValue(overlay: string): number {
  const map: Record<string, number> = { none: 0, subtle: 0.1, medium: 0.2, strong: 0.4 };
  return map[overlay] || 0;
}

function getBorderThicknessValue(thickness: string): number {
  const map: Record<string, number> = { thin: 1, normal: 2, thick: 4, bold: 6 };
  return map[thickness] || 2;
}

function getBorderGlowValue(glow: string): number {
  const map: Record<string, number> = { none: 0, subtle: 15, medium: 30, intense: 50 };
  return map[glow] || 15;
}

function getBorderColorValue(color: string, tierColors: typeof TIER_COLORS.blue): string {
  if (color === 'tier') return tierColors.border;
  const map: Record<string, string> = { white: '#FFFFFF', gold: '#FFD700', neon: '#00FFFF' };
  return map[color] || tierColors.border;
}

function getPfpSizeValue(size: string): number {
  const map: Record<string, number> = { small: 160, medium: 240, large: 320 };
  return map[size] || 240;
}

function getPfpBorderSizeValue(size: string): number {
  const map: Record<string, number> = { thin: 2, medium: 4, thick: 6 };
  return map[size] || 2;
}

function getPfpBorderColorValue(color: string, tierColors: typeof TIER_COLORS.blue): string | null {
  if (color === 'none') return null;
  const map: Record<string, string> = { 
    white: '#FFFFFF', 
    blue: '#0052FF', 
    gold: '#FFD700', 
    platinum: '#E5E4E2', 
    neon: '#00FFFF' 
  };
  return map[color] || tierColors.border;
}

function getPfpGlowValue(glow: string): number {
  const map: Record<string, number> = { none: 0, subtle: 10, medium: 20, intense: 30 };
  return map[glow] || 0;
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
      { width: WIDTH, height: HEIGHT, headers: { 'Cache-Control': 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400' } }
    );

  try {
    const { searchParams } = new URL(req.url);
    if (searchParams.get('safe') === '1') return safe('FitLocker');
    
    const selectedStatsParam = searchParams.get('selectedStats');
    console.log('[MEMBERSHIP-IMAGE] Starting image generation with params:', {
      username: searchParams.get('username'),
      memberNumber: searchParams.get('memberNumber'),
      tier: searchParams.get('tier'),
      level: searchParams.get('level'),
      selectedStats: selectedStatsParam,
      rank: searchParams.get('rank'),
      identityStreak: searchParams.get('identityStreak')
    });

    // Test with minimal version first - if this works, we know the issue is in the complex JSX
    const testMinimal = searchParams.get('minimal') === '1';
    if (testMinimal) {
      console.log('[MEMBERSHIP-IMAGE] Using minimal test version');
      const minimalImg = (
        <div style={{ width: WIDTH, height: HEIGHT, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0052FF', color: '#fff', fontSize: 48, fontWeight: 700 }}>
          Test Membership ID
        </div>
      );
      return new ImageResponse(minimalImg, {
        width: WIDTH,
        height: HEIGHT,
        headers: { 'Cache-Control': 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400' }
      });
    }

    // Required parameters
    const username = searchParams.get('username') || DEFAULT_USERNAME;
    const memberNumber = parseIntSafe(searchParams.get('memberNumber'), DEFAULT_MEMBER_NUMBER);
    const tier = (searchParams.get('tier') || DEFAULT_TIER) as 'blue' | 'gold' | 'platinum';
    const level = parseIntSafe(searchParams.get('level'), DEFAULT_LEVEL);

    // Optional parameters
    const memberBand = searchParams.get('memberBand') || 'standard';
    const identityStreak = parseIntSafe(searchParams.get('identityStreak'), DEFAULT_IDENTITY_STREAK);
    const rank = parseIntSafe(searchParams.get('rank'), 0); // Leaderboard rank
    const backgroundStyle = searchParams.get('backgroundStyle') || 'classic_gradient';
    const backgroundPattern = searchParams.get('backgroundPattern') || 'none';
    const templateBackground = searchParams.get('templateBackground') || '';
    const backgroundColors = searchParams.get('backgroundColors')?.split(',') || null; // Custom colors (comma-separated hex)
    const backgroundIntensity = searchParams.get('backgroundIntensity') || 'normal';
    const backgroundOpacity = searchParams.get('backgroundOpacity') || 'full';
    const backgroundOverlay = searchParams.get('backgroundOverlay') || 'none';
    const borderStyle = searchParams.get('borderStyle') || 'standard';
    const borderThickness = searchParams.get('borderThickness') || 'normal';
    const borderGlow = searchParams.get('borderGlow') || 'subtle';
    const borderColor = searchParams.get('borderColor') || 'tier';
    // Parse selectedStats, filtering out empty strings
    const selectedStatsRaw = searchParams.get('selectedStats') || '';
    const selectedStats = selectedStatsRaw ? selectedStatsRaw.split(',').filter(s => s.trim().length > 0) : [];
    
    // For default card, if no stats selected, default to rank and streak
    const useDefaultStats = selectedStats.length === 0;
    const statsToShow = useDefaultStats ? ['rank', 'streak'] : selectedStats;
    
    console.log('[MEMBERSHIP-IMAGE] Stats configuration:', {
      selectedStatsParam: selectedStatsRaw,
      selectedStats,
      useDefaultStats,
      statsToShow,
      rank,
      identityStreak
    });
    const pfpParam = searchParams.get('pfp') || '';
    const pfpSize = searchParams.get('pfpSize') || 'medium';
    const pfpShape = searchParams.get('pfpShape') || 'circle';
    const pfpBorderColor = searchParams.get('pfpBorderColor') || 'none';
    const pfpBorderSize = searchParams.get('pfpBorderSize') || 'thin';
    const pfpGlow = searchParams.get('pfpGlow') || 'none';
    const ref = searchParams.get('ref') || '';
    const chainId = searchParams.get('chain') || '';
    const accentElements = searchParams.get('accentElements')?.split(',') || [];
    const cardStyle = searchParams.get('cardStyle') || 'cyberpunk';
    const cardLayout = searchParams.get('cardLayout') || 'showcase';
    const leftStatLabelSize = parseIntSafe(searchParams.get('leftStatLabelSize'), 20);
    const rightStatLabelSize = parseIntSafe(searchParams.get('rightStatLabelSize'), 20);

    // Get tier colors
    const tierColors = TIER_COLORS[tier] || TIER_COLORS.blue;
    const bandColors = MEMBER_BAND_COLORS[memberBand as keyof typeof MEMBER_BAND_COLORS];

    // Calculate customization values
    const bgIntensity = getBackgroundIntensityValue(backgroundIntensity);
    const bgOpacity = getBackgroundOpacityValue(backgroundOpacity);
    const bgOverlay = getBackgroundOverlayValue(backgroundOverlay);
    const borderThick = getBorderThicknessValue(borderThickness);
    const borderGlowVal = getBorderGlowValue(borderGlow);
    const borderColorVal = getBorderColorValue(borderColor, tierColors);
    const pfpSizeVal = getPfpSizeValue(pfpSize);
    const pfpBorderSizeVal = getPfpBorderSizeValue(pfpBorderSize);
    const pfpBorderColorVal = getPfpBorderColorValue(pfpBorderColor, tierColors);
    const pfpGlowVal = getPfpGlowValue(pfpGlow);

    // Fetch profile picture
    let pfpDataUrl: string | null = null;
    if (pfpParam) pfpDataUrl = await fetchAsDataUrlStrict(pfpParam);
    if (!pfpDataUrl) pfpDataUrl = await fetchAsDataUrlStrict(DEFAULT_PFP_URL);

    // Fetch template background if provided
    let templateBgDataUrl: string | null = null;
    if (templateBackground) {
      templateBgDataUrl = await fetchAsDataUrlStrict(templateBackground);
    }

    // Build the card image
    const img = (
      <div style={{ width: WIDTH, height: HEIGHT, display: 'flex', flexDirection: 'column', position: 'relative', background: '#0b0b10' }}>
        {/* Background layers container - all absolutely positioned */}
        <div style={{ position: 'absolute', top: 0, left: 0, width: WIDTH, height: HEIGHT, display: 'flex' }}>
          {/* Template Background (if provided) */}
          {templateBgDataUrl && (
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: WIDTH,
                height: HEIGHT,
                backgroundImage: `url(${templateBgDataUrl})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                opacity: bgOpacity,
                display: 'flex',
              }}
            />
          )}
          
          {/* Background gradient with custom colors or tier colors (if no template) */}
          {!templateBgDataUrl && (
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: WIDTH,
                height: HEIGHT,
                background: backgroundColors && backgroundColors.length >= 2
                  ? `linear-gradient(135deg, ${backgroundColors[0]} 0%, ${backgroundColors[1]} ${backgroundColors.length === 2 ? '100%' : '50%'}${backgroundColors.length >= 3 ? `, ${backgroundColors[2]} 100%` : ''})`
                  : tierColors.gradient,
                opacity: 0.9 * bgIntensity * bgOpacity,
                display: 'flex',
              }}
            />
          )}
        
          {/* Background style overlay */}
          {backgroundStyle === 'mesh_gradient' && (
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: WIDTH,
                height: HEIGHT,
                background: 'radial-gradient(circle at 20% 30%, rgba(255,255,255,0.1) 0%, transparent 50%), radial-gradient(circle at 80% 70%, rgba(255,255,255,0.1) 0%, transparent 50%)',
                opacity: 0.3 * bgIntensity,
                display: 'flex',
              }}
            />
          )}
          {backgroundStyle === 'neon' && (
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: WIDTH,
                height: HEIGHT,
                background: `radial-gradient(circle at center, ${tierColors.primary}40 0%, transparent 70%)`,
                opacity: 0.5 * bgIntensity,
                display: 'flex',
              }}
            />
          )}

          {/* Background Pattern Overlays */}
          {backgroundPattern === 'geometric' && (
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: WIDTH,
                height: HEIGHT,
                background: 'repeating-linear-gradient(45deg, transparent, transparent 20px, rgba(255,255,255,0.05) 20px, rgba(255,255,255,0.05) 40px)',
                display: 'flex',
              }}
            />
          )}
          {backgroundPattern === 'grid' && (
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: WIDTH,
                height: HEIGHT,
                background: 'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)',
                backgroundSize: '40px 40px',
                display: 'flex',
              }}
            />
          )}
          {backgroundPattern === 'dots' && (
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: WIDTH,
                height: HEIGHT,
                background: 'radial-gradient(circle, rgba(255,255,255,0.1) 1px, transparent 1px)',
                backgroundSize: '30px 30px',
                display: 'flex',
              }}
            />
          )}
          {backgroundPattern === 'waves' && (
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: WIDTH,
                height: HEIGHT,
                background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.05) 2px, rgba(255,255,255,0.05) 4px)',
                display: 'flex',
              }}
            />
          )}
          {backgroundPattern === 'circuit' && (
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: WIDTH,
                height: HEIGHT,
                background: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(0,255,255,0.1) 10px, rgba(0,255,255,0.1) 11px, transparent 11px, transparent 20px)',
                display: 'flex',
              }}
            />
          )}
          {backgroundPattern === 'hexagon' && (
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: WIDTH,
                height: HEIGHT,
                background: 'repeating-linear-gradient(60deg, transparent, transparent 25px, rgba(255,255,255,0.05) 25px, rgba(255,255,255,0.05) 26px, transparent 26px, transparent 50px)',
                display: 'flex',
              }}
            />
          )}
          {backgroundPattern === 'holographic' && (
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: WIDTH,
                height: HEIGHT,
                background: 'linear-gradient(135deg, rgba(255,0,150,0.1) 0%, rgba(0,255,255,0.1) 50%, rgba(255,200,0,0.1) 100%)',
                display: 'flex',
              }}
            />
          )}
          {backgroundPattern === 'carbon_fiber' && (
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: WIDTH,
                height: HEIGHT,
                background: 'repeating-linear-gradient(0deg, rgba(0,0,0,0.1) 0px, transparent 1px, transparent 2px, rgba(0,0,0,0.1) 2px)',
                display: 'flex',
              }}
            />
          )}
          {backgroundPattern === 'vignette' && (
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: WIDTH,
                height: HEIGHT,
                background: 'radial-gradient(ellipse at center, transparent 0%, rgba(0,0,0,0.4) 100%)',
                display: 'flex',
              }}
            />
          )}

          {/* Background Overlay (darkening layer) */}
          {bgOverlay > 0 && (
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: WIDTH,
                height: HEIGHT,
                background: 'rgba(0,0,0,' + bgOverlay + ')',
                display: 'flex',
              }}
            />
          )}
        </div>

        {/* Content */}
        <div style={{ display: 'flex', flexDirection: 'column', padding: PADDING, position: 'relative', zIndex: 1, height: '100%' }}>
          {/* Header Section - Centered Member ID */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}>
            {/* Member Number Badge - Centered and larger */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <div style={{ display: 'flex', fontSize: 20, fontWeight: 600, color: 'rgba(255,255,255,0.9)', letterSpacing: '0.15em' }}>
                MEMBER
              </div>
              <div
                style={{
                  display: 'flex',
                  padding: '12px 24px',
                  borderRadius: 12,
                  background: `${tierColors.primary}4D`,
                  color: tierColors.accent,
                  fontSize: 80,
                  fontWeight: 900,
                  letterSpacing: '0.1em',
                  textShadow: '0 2px 8px rgba(0,0,0,0.5)',
                }}
              >
                {String(memberNumber).padStart(3, '0')}
              </div>
            </div>
              
              {/* Member Band Badge */}
              {bandColors && (
                <div
                  style={{
                    display: 'flex',
                    padding: '6px 12px',
                    borderRadius: 8,
                    background: bandColors.bg,
                    color: bandColors.text,
                    fontSize: 12,
                    fontWeight: 800,
                    letterSpacing: '0.05em',
                  }}
                >
                  {bandColors.label}
                </div>
              )}
              
              {/* Chain Badge */}
              {chainId && (
                <div
                  style={{
                    display: 'flex',
                    padding: '6px 12px',
                    borderRadius: 8,
                    background: 'rgba(139, 92, 246, 0.2)',
                    color: '#8B5CF6',
                    fontSize: 12,
                    fontWeight: 800,
                    letterSpacing: '0.05em',
                  }}
                >
                  CHAIN
                </div>
              )}
            </div>
          </div>

          {/* Main Content Area */}
          <div style={{ display: 'flex', flex: 1, gap: 48, alignItems: 'center', justifyContent: 'center' }}>
            {/* Left: Profile Picture */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
              {pfpDataUrl ? (
                <div
                  style={{
                    width: pfpSizeVal,
                    height: pfpSizeVal,
                    borderRadius: pfpShape === 'circle' ? 9999 : pfpShape === 'square' ? 0 : pfpShape === 'rounded' ? 16 : pfpShape === 'hexagon' ? 0 : pfpShape === 'diamond' ? 0 : 9999,
                    border: pfpBorderColorVal ? `${pfpBorderSizeVal}px solid ${pfpBorderColorVal}` : 'none',
                    overflow: 'hidden',
                    boxShadow: pfpGlowVal > 0 ? `0 0 ${pfpGlowVal}px ${pfpBorderColorVal || tierColors.primary}40` : 'none',
                    clipPath: pfpShape === 'hexagon' ? 'polygon(30% 0%, 70% 0%, 100% 50%, 70% 100%, 30% 100%, 0% 50%)' : pfpShape === 'diamond' ? 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)' : 'none',
                    display: 'flex',
                  }}
                >
                  <img src={pfpDataUrl} alt="" width={pfpSizeVal} height={pfpSizeVal} style={{ objectFit: 'cover' }} />
                </div>
              ) : (
                <div
                  style={{
                    width: pfpSizeVal,
                    height: pfpSizeVal,
                    borderRadius: pfpShape === 'circle' ? 9999 : pfpShape === 'square' ? 0 : pfpShape === 'rounded' ? 16 : pfpShape === 'hexagon' ? 0 : pfpShape === 'diamond' ? 0 : 9999,
                    border: pfpBorderColorVal ? `${pfpBorderSizeVal}px solid ${pfpBorderColorVal}` : 'none',
                    background: '#222',
                    boxShadow: pfpGlowVal > 0 ? `0 0 ${pfpGlowVal}px ${pfpBorderColorVal || tierColors.primary}40` : 'none',
                    clipPath: pfpShape === 'hexagon' ? 'polygon(30% 0%, 70% 0%, 100% 50%, 70% 100%, 30% 100%, 0% 50%)' : pfpShape === 'diamond' ? 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)' : 'none',
                    display: 'flex',
                  }}
                />
              )}
              
              {/* Username */}
              <div style={{ display: 'flex', fontSize: 52, fontWeight: 900, color: '#fff', letterSpacing: '0.02em', textShadow: '0 2px 8px rgba(0,0,0,0.5)' }}>
                {username}
              </div>
              
              {/* Tier Badge */}
              <div
                style={{
                  display: 'flex',
                  padding: '8px 16px',
                  borderRadius: 12,
                  background: `${tierColors.primary}33`,
                  color: tierColors.accent,
                  fontSize: 26,
                  fontWeight: 800,
                  letterSpacing: '0.05em',
                }}
              >
                {tier.toUpperCase()} TIER
              </div>
            </div>

            {/* Right: Stats Section */}
            <div style={{ display: 'flex', flex: 1, flexDirection: 'column', gap: 32, justifyContent: 'center', alignItems: 'flex-start' }}>
              {/* Selected Stats - Always show rank and streak for default card */}
              {statsToShow.length > 0 ? (
                <>
                  {statsToShow.includes('rank') && (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 8 }}>
                      <div style={{ display: 'flex', fontSize: 84, fontWeight: 900, color: '#fff', textShadow: '0 2px 12px rgba(0,0,0,0.6), 0 0 20px rgba(96,165,250,0.3)' }}>
                        {rank || 0}
                      </div>
                      <div style={{ display: 'flex', fontSize: 20, fontWeight: 600, color: 'rgba(255,255,255,0.9)', letterSpacing: '0.15em' }}>
                        RANK
                      </div>
                    </div>
                  )}
                  {statsToShow.includes('streak') && (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 8 }}>
                      <div style={{ display: 'flex', fontSize: 84, fontWeight: 900, color: '#fff', textShadow: '0 2px 12px rgba(0,0,0,0.6), 0 0 20px rgba(255,69,0,0.3)' }}>
                        {identityStreak || 0}
                      </div>
                      <div style={{ display: 'flex', fontSize: 20, fontWeight: 600, color: 'rgba(255,255,255,0.9)', letterSpacing: '0.15em' }}>
                        STREAK
                      </div>
                    </div>
                  )}
                  {statsToShow.includes('level') && (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 8 }}>
                      <div style={{ display: 'flex', fontSize: 84, fontWeight: 900, color: '#fff', textShadow: '0 2px 12px rgba(0,0,0,0.6), 0 0 20px rgba(255,215,0,0.3)' }}>
                        {level}
                      </div>
                      <div style={{ display: 'flex', fontSize: 20, fontWeight: 600, color: 'rgba(255,255,255,0.9)', letterSpacing: '0.15em' }}>
                        LEVEL
                      </div>
                    </div>
                  )}
                  {statsToShow.includes('weeklyXP') && (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 8 }}>
                      <div style={{ display: 'flex', fontSize: 84, fontWeight: 900, color: '#fff', textShadow: '0 2px 12px rgba(0,0,0,0.6)' }}>
                        XP
                      </div>
                      <div style={{ display: 'flex', fontSize: 20, fontWeight: 600, color: 'rgba(255,255,255,0.9)', letterSpacing: '0.15em' }}>
                        WEEKLY XP
                      </div>
                    </div>
                  )}
                  {statsToShow.includes('workouts') && (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 8 }}>
                      <div style={{ display: 'flex', fontSize: 84, fontWeight: 900, color: '#fff', textShadow: '0 2px 12px rgba(0,0,0,0.6)' }}>
                        💪
                      </div>
                      <div style={{ display: 'flex', fontSize: 20, fontWeight: 600, color: 'rgba(255,255,255,0.9)', letterSpacing: '0.15em' }}>
                        WORKOUTS
                      </div>
                    </div>
                  )}
                </>
              ) : (
                /* Fallback: Show rank and streak even if statsToShow is empty */
                <>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 8 }}>
                    <div style={{ display: 'flex', fontSize: 84, fontWeight: 900, color: '#fff', textShadow: '0 2px 12px rgba(0,0,0,0.6), 0 0 20px rgba(96,165,250,0.3)' }}>
                      {rank || 0}
                    </div>
                    <div style={{ display: 'flex', fontSize: 20, fontWeight: 600, color: 'rgba(255,255,255,0.9)', letterSpacing: '0.15em' }}>
                      RANK
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 8 }}>
                    <div style={{ display: 'flex', fontSize: 84, fontWeight: 900, color: '#fff', textShadow: '0 2px 12px rgba(0,0,0,0.6), 0 0 20px rgba(255,69,0,0.3)' }}>
                      {identityStreak || 0}
                    </div>
                    <div style={{ display: 'flex', fontSize: 20, fontWeight: 600, color: 'rgba(255,255,255,0.9)', letterSpacing: '0.15em' }}>
                      STREAK
                    </div>
                  </div>
                </>
              )}

              {/* Identity Streak (if accent element) */}
              {identityStreak > 0 && accentElements.includes('identity_streak') && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ display: 'flex', fontSize: 20, color: '#fff', fontWeight: 600 }}>
                    🔥 Identity Streak: {identityStreak} days
                  </div>
                </div>
              )}

              {/* Recruiter Badge */}
              {accentElements.includes('recruiter_badge') && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ display: 'flex', fontSize: 20, color: '#fff', fontWeight: 600 }}>
                    👥 Top Recruiter
                  </div>
                </div>
              )}

              {/* Referral Code (if present) */}
              {ref && (
                <div
                  style={{
                    display: 'flex',
                    padding: '12px 20px',
                    borderRadius: 12,
                    background: 'rgba(0,0,0,0.3)',
                    border: `2px solid ${tierColors.accent}`,
                    fontSize: 18,
                    fontWeight: 700,
                    color: tierColors.accent,
                    letterSpacing: '0.1em',
                  }}
                >
                  REF: {ref}
                </div>
              )}
            </div>
          </div>

          {/* Border Style - at root level, not inside content */}
          {borderStyle === 'standard' && (
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: WIDTH,
              height: HEIGHT,
              border: `${borderThick}px solid ${borderColorVal}`,
              borderRadius: 16,
              boxShadow: borderGlowVal > 0 ? `0 0 ${borderGlowVal}px ${borderColorVal}40` : 'none',
              pointerEvents: 'none',
              display: 'flex',
            }}
          />
        )}
        {borderStyle === 'double' && (
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: WIDTH,
              height: HEIGHT,
              border: `${borderThick}px solid ${borderColorVal}`,
              borderRadius: 16,
              boxShadow: borderGlowVal > 0 ? `0 0 ${borderGlowVal}px ${borderColorVal}40` : 'none',
              pointerEvents: 'none',
              display: 'flex',
            }}
          />
        )}
        {borderStyle === 'dashed' && (
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: WIDTH,
              height: HEIGHT,
              border: `${borderThick}px dashed ${borderColorVal}`,
              borderRadius: 16,
              boxShadow: borderGlowVal > 0 ? `0 0 ${borderGlowVal}px ${borderColorVal}40` : 'none',
              pointerEvents: 'none',
              display: 'flex',
            }}
          />
        )}
        {borderStyle === 'neon' && (
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: WIDTH,
              height: HEIGHT,
              border: `${borderThick}px solid ${borderColorVal}`,
              borderRadius: 16,
              boxShadow: `0 0 ${Math.max(borderGlowVal, 20)}px ${borderColorVal}, inset 0 0 ${Math.max(borderGlowVal, 20)}px ${borderColorVal}40`,
              pointerEvents: 'none',
              display: 'flex',
            }}
          />
        )}
        {borderStyle === 'ornamental' && (
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: WIDTH,
              height: HEIGHT,
              border: `${borderThick}px solid ${borderColorVal}`,
              borderRadius: 16,
              boxShadow: borderGlowVal > 0 ? `0 0 ${borderGlowVal}px ${borderColorVal}40` : 'none',
              pointerEvents: 'none',
              display: 'flex',
            }}
          />
        )}
      </div>
    );

    console.log('[MEMBERSHIP-IMAGE] JSX built successfully, creating ImageResponse');
    const response = new ImageResponse(img, {
      width: WIDTH,
      height: HEIGHT,
      headers: {
        'Cache-Control': 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400',
      },
    });
    console.log('[MEMBERSHIP-IMAGE] ImageResponse created successfully');
    return response;
  } catch (error) {
    console.error('[MEMBERSHIP-IMAGE] Error generating membership ID image:', error);
    console.error('[MEMBERSHIP-IMAGE] Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    console.error('[MEMBERSHIP-IMAGE] Error details:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
    return safe('FitLocker');
  }
}





