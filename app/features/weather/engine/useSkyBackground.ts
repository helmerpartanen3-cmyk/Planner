// Taivaan taustagrafiikka. Hallinnoi värigradientin ja hiukkasten renderöintiä.

// useSkyBackground.ts
import { useEffect, useRef } from 'react';
import { SkyLayerColors, SkyStateInput } from './skyTypes';
import { computeSkyLayers } from './skyModel';
import { mixOklab } from './skyColor';
import { renderSkyGradient } from './skyRenderer';
import { PrecipitationSystem, Particle } from './precipitationSystem';

const blendLayers = (from: SkyLayerColors, to: SkyLayerColors, t: number): SkyLayerColors => ({
  upperSky: mixOklab(from.upperSky, to.upperSky, t),
  midSky: mixOklab(from.midSky, to.midSky, t),
  horizonBand: mixOklab(from.horizonBand, to.horizonBand, t),
  groundBounce: mixOklab(from.groundBounce, to.groundBounce, t)
});

/**
 * Sample the sky color at a normalized vertical position (0 = top, 1 = bottom)
 */
const sampleSkyColor = (layers: SkyLayerColors, normalizedY: number): [number, number, number] => {
  // Sky gradient stops: 0 (upperSky), 0.55 (midSky), 1 (horizonBand)
  if (normalizedY <= 0.55) {
    // Interpolate between upperSky and midSky
    const t = normalizedY / 0.55;
    return mixOklab(layers.upperSky, layers.midSky, t);
  } else {
    // Interpolate between midSky and horizonBand
    const t = (normalizedY - 0.55) / (1 - 0.55);
    return mixOklab(layers.midSky, layers.horizonBand, t);
  }
};

const getCanvasContext = (canvas: HTMLCanvasElement) => {
  const context = canvas.getContext(
    '2d',
    { colorSpace: 'display-p3' } as CanvasRenderingContext2DSettings
  );
  return context ?? canvas.getContext('2d');
};

/** Check if two layer sets are close enough to skip blending */
const layersClose = (a: SkyLayerColors, b: SkyLayerColors, eps = 0.001): boolean => {
  for (let i = 0; i < 3; i++) {
    if (Math.abs(a.upperSky[i] - b.upperSky[i]) > eps) return false;
    if (Math.abs(a.midSky[i] - b.midSky[i]) > eps) return false;
    if (Math.abs(a.horizonBand[i] - b.horizonBand[i]) > eps) return false;
    if (Math.abs(a.groundBounce[i] - b.groundBounce[i]) > eps) return false;
  }
  return true;
};

export const useSkyBackground = (state: SkyStateInput) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const cloudsCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const targetRef = useRef<SkyLayerColors>(computeSkyLayers(state));
  const currentRef = useRef<SkyLayerColors>(targetRef.current);
  const sizeRef = useRef({ width: 0, height: 0, dpr: 1 });
  const stateRef = useRef(state);
  const precipitationSystemRef = useRef<PrecipitationSystem | null>(null);

  useEffect(() => {
    targetRef.current = computeSkyLayers(state);
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = getCanvasContext(canvas);
    if (!ctx) return;

    const updateSize = () => {
      const dpr = window.devicePixelRatio || 1;
      const width = Math.max(1, Math.floor(window.innerWidth * dpr));
      const height = Math.max(1, Math.floor(window.innerHeight * dpr));
      if (width === sizeRef.current.width && height === sizeRef.current.height) return;
      sizeRef.current = { width, height, dpr };
      canvas.width = width;
      canvas.height = height;
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      
      // Resize precipitation system
      if (precipitationSystemRef.current) {
        precipitationSystemRef.current.resize(width, height);
      }
    };

    updateSize();
    window.addEventListener('resize', updateSize);

    let raf = 0;
    let last = performance.now();
    const animate = (now: number) => {
      const dt = Math.min(200, now - last);
      last = now;

      const smoothing = 1 - Math.exp(-dt / 400);
      // Skip expensive OKLab blending when layers are already converged
      if (!layersClose(currentRef.current, targetRef.current)) {
        currentRef.current = blendLayers(currentRef.current, targetRef.current, smoothing);
      }

      const { width, height } = sizeRef.current;
      
      // Pass the high-res timestamp 'now' into the renderer
      const skyResult = renderSkyGradient(ctx, width, height, currentRef.current, stateRef.current, now);

      // Render precipitation
      if (!precipitationSystemRef.current) {
        precipitationSystemRef.current = new PrecipitationSystem(width, height, stateRef.current.weather.windSpeed || 0, stateRef.current.weather.windDirection || 0);
      }

      const precipSystem = precipitationSystemRef.current;
      const precipitation = stateRef.current.weather.precipitation;
      const precipIntensity = mapPrecipitationToIntensity(stateRef.current.weather);

      // Update and render precipitation
      precipSystem.updateWind(stateRef.current.weather.windSpeed || 0, stateRef.current.weather.windDirection || 0);
      precipSystem.update(dt / 1000, precipitation, precipIntensity);
      renderPrecipitation(ctx, precipSystem, precipitation, precipIntensity, currentRef.current);

      raf = window.requestAnimationFrame(animate);
    };

    raf = window.requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('resize', updateSize);
      window.cancelAnimationFrame(raf);
      if (precipitationSystemRef.current) {
        precipitationSystemRef.current.clear();
      }
    };
  }, []);

  return { canvasRef, cloudsCanvasRef };
};

/**
 * Map weather code to realistic precipitation intensity
 * Based on WMO weather codes
 */
const mapWeatherCodeToIntensity = (code: number): 'light' | 'moderate' | 'heavy' => {
  // Drizzle: light but present (51-57)
  if (code >= 51 && code <= 57) {
    return code === 57 ? 'moderate' : 'light'; // 57 is freezing drizzle, slightly more intense
  }
  
  // Rain: varies by intensity code (61-67)
  if (code >= 61 && code <= 67) {
    if (code === 61) return 'light';      // Slight rain
    if (code === 62) return 'moderate';   // Moderate rain
    if (code === 63) return 'heavy';      // Heavy rain
    if (code === 64) return 'light';      // Light freezing rain
    if (code === 65) return 'moderate';   // Moderate/heavy freezing rain
    if (code === 66) return 'moderate';   // Light rain and snow
    if (code === 67) return 'heavy';      // Rain and snow/sleet
    return 'moderate';
  }
  
  // Showers: typically heavy and intermittent (80-82)
  if (code >= 80 && code <= 82) {
    if (code === 80) return 'moderate';   // Slight rain showers
    if (code === 81) return 'heavy';      // Moderate/heavy rain showers
    if (code === 82) return 'heavy';      // Violent rain showers
    return 'heavy';
  }
  
  // Snow showers: heavy (85-86)
  if (code >= 85 && code <= 86) {
    return 'heavy';
  }
  
  // Thunderstorm: heavy rain (95-99)
  if (code >= 95) {
    return code === 95 ? 'heavy' : 'heavy'; // Thunderstorm variants
  }
  
  return 'moderate';
};

/**
 * Map weather precipitation state to intensity level
 */
const mapPrecipitationToIntensity = (weather: SkyStateInput['weather']): 'light' | 'moderate' | 'heavy' => {
  // First, try to use weather code if available for precise mapping
  if (weather.weatherCode !== undefined && weather.weatherCode !== null) {
    return mapWeatherCodeToIntensity(weather.weatherCode);
  }
  
  const { precipitationAmount = 0, precipitationProbability = 0 } = weather;

  // Light: < 2.5mm/h or low probability
  if (precipitationAmount < 2.5 || precipitationProbability < 0.4) {
    return 'light';
  }

  // Heavy: > 10mm/h or high probability
  if (precipitationAmount > 10 || precipitationProbability > 0.8) {
    return 'heavy';
  }

  // Moderate: in between
  return 'moderate';
};

/* --------------------------------------------------
   Snowflake sprite cache — avoids creating a radial
   gradient per particle per frame. Keyed by bucketed
   size; tint is applied via globalAlpha + compositing.
-------------------------------------------------- */

const snowSpriteCache = new Map<number, HTMLCanvasElement>();

const getSnowSprite = (radius: number): HTMLCanvasElement => {
  // Bucket to nearest 0.5 px
  const bucket = Math.round(radius * 2) / 2;
  const cached = snowSpriteCache.get(bucket);
  if (cached) return cached;

  const pad = 2;
  const size = Math.ceil(bucket * 2 + pad);
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const sx = c.getContext('2d')!;
  const cx = size / 2;

  // Pure white snowflake — colour tinting is done externally
  const g = sx.createRadialGradient(cx, cx, 0, cx, cx, bucket);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.6, 'rgba(255,255,255,0.6)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  sx.fillStyle = g;
  sx.beginPath();
  sx.arc(cx, cx, bucket, 0, Math.PI * 2);
  sx.fill();

  // Keep cache bounded
  if (snowSpriteCache.size > 32) {
    const first = snowSpriteCache.keys().next().value;
    if (first !== undefined) snowSpriteCache.delete(first);
  }
  snowSpriteCache.set(bucket, c);
  return c;
};

/* --------------------------------------------------
   Rain colour strings — precomputed per intensity so
   we never build them inside the hot particle loop.
-------------------------------------------------- */

const RAIN_STYLES: Record<string, { color: string; opacityMul: number; lineWidthMul: number }> = {
  light:    { color: 'rgba(240,245,250,', opacityMul: 0.7,  lineWidthMul: 1.0 },
  moderate: { color: 'rgba(255,255,255,', opacityMul: 1.0,  lineWidthMul: 1.0 },
  heavy:    { color: 'rgba(220,240,255,', opacityMul: 1.2,  lineWidthMul: 1.0 },
};

const SNOW_OPACITY: Record<string, number> = { light: 0.8, moderate: 1.0, heavy: 1.1 };
const RAIN_LENGTH:  Record<string, number> = { light: 8, moderate: 9, heavy: 10 };

/**
 * Render precipitation particles to canvas.
 *
 * Performance notes vs. previous implementation:
 *  - Snow: cached sprites instead of per-particle createRadialGradient
 *  - Snow: sky-tint sampled once instead of per-particle OKLab round-trips
 *  - Snow: no save/translate/rotate (sprite is rotationally symmetric)
 *  - Rain: world-space line endpoints instead of per-particle save/translate/rotate
 *  - Rain: single beginPath per lineWidth bucket
 */
const renderPrecipitation = (
  ctx: CanvasRenderingContext2D,
  system: PrecipitationSystem,
  precipitationType: 'rain' | 'snow' | 'storm' | 'none',
  intensity: 'light' | 'moderate' | 'heavy' = 'moderate',
  skyLayers: SkyLayerColors
) => {
  const particles = system.getParticles();
  if (particles.length === 0) return;

  const prevComp = ctx.globalCompositeOperation;
  ctx.globalCompositeOperation = 'lighten';

  // --- Pre-compute snow tint ONCE (sample sky at mid-screen) ---
  // This replaces per-particle sampleSkyColor → 2× mixOklab calls
  const canvasH = ctx.canvas.height;
  const midSky = sampleSkyColor(skyLayers, 0.5);
  const snowTint: [number, number, number] = [
    1.0 - (1.0 - midSky[0]) * 0.3,
    1.0 - (1.0 - midSky[1]) * 0.3,
    1.0 - (1.0 - midSky[2]) * 0.3,
  ];
  const snowTintCss = `rgba(${(snowTint[0] * 255) | 0},${(snowTint[1] * 255) | 0},${(snowTint[2] * 255) | 0},`;

  // --- Rain setup ---
  const rainStyle = RAIN_STYLES[intensity] || RAIN_STYLES.moderate;
  const rainLen = RAIN_LENGTH[intensity] || 9;
  const snowOpMul = SNOW_OPACITY[intensity] || 1.0;

  // Separate rain particles by lineWidth bucket for batching
  // Most rain particles share very similar lineWidth so 1-2 buckets cover all
  const rainBuckets = new Map<number, { x1: number; y1: number; x2: number; y2: number; a: number }[]>();

  for (const p of particles) {
    if (p.type === 'rain') {
      const halfLen = p.size * rainLen * 0.5;
      const angle = Math.atan2(p.vy, p.vx);
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      const lw = Math.round(Math.max(1.0, p.size * 1.2) * 2) / 2; // bucket to 0.5px

      let bucket = rainBuckets.get(lw);
      if (!bucket) { bucket = []; rainBuckets.set(lw, bucket); }

      bucket.push({
        x1: p.x - halfLen * cos,
        y1: p.y - halfLen * sin,
        x2: p.x + halfLen * cos,
        y2: p.y + halfLen * sin,
        a: Math.max(0.4, p.opacity * 1.5) * rainStyle.opacityMul,
      });
    } else {
      // --- Snow: draw with cached sprite ---
      const radius = p.size * 2;
      const sprite = getSnowSprite(radius);
      const half = sprite.width / 2;
      const opacity = Math.max(0.5, p.opacity * 1.5) * snowOpMul;
      if (opacity < 0.01) continue;

      ctx.globalAlpha = opacity;
      ctx.drawImage(sprite, p.x - half, p.y - half);
    }
  }

  // --- Rain: batch-draw per lineWidth bucket ---
  ctx.lineCap = 'round';
  for (const [lw, lines] of rainBuckets) {
    ctx.lineWidth = lw;

    // Group by opacity bucket (round to 0.05) for fewer style changes
    const opBuckets = new Map<number, typeof lines>();
    for (const l of lines) {
      const ob = Math.round(l.a * 20) / 20;
      let arr = opBuckets.get(ob);
      if (!arr) { arr = []; opBuckets.set(ob, arr); }
      arr.push(l);
    }

    for (const [opVal, bucket] of opBuckets) {
      ctx.strokeStyle = `${rainStyle.color}${opVal})`;
      ctx.beginPath();
      for (const l of bucket) {
        ctx.moveTo(l.x1, l.y1);
        ctx.lineTo(l.x2, l.y2);
      }
      ctx.stroke();
    }
  }

  ctx.globalAlpha = 1.0;
  ctx.globalCompositeOperation = prevComp;
};
