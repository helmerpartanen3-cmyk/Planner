// skyRenderer.ts
import { SkyLayerColors, SkyStateInput } from './skyTypes';
import { toCssRgb } from './skyColor';
import { clamp01 } from './skyUtils';
import { drawAtmosphere } from './skyAtmosphere';
import { overlayNoise } from './skyNoise';
import { drawStars } from './skyStarRenderer';
import { drawSun } from './skySun';
import { drawThunderstormWithEffect } from './skyLightning';
import { getSunScreenPosition } from './skyView';

// ----------------------------
// Gradient cache — skip recreating gradient + CSS strings
// every frame when the sky layers haven't changed.
// ----------------------------
let cachedGradientLayers: SkyLayerColors | null = null;
let cachedGradientH = 0;
let cachedStops: [string, string, string] = ['', '', ''];

// ----------------------------
// Main render
// ----------------------------
export const renderSkyGradient = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  layers: SkyLayerColors,
  state: SkyStateInput,
  time: number
): { lightningEffect: any } => {
  ctx.clearRect(0, 0, width, height);

  const { sunElevation } = state.astronomy;
  const cloudCover = clamp01(state.weather.cloudCover);
  const fogDensity = clamp01(state.weather.fogDensity);

  // 1) Base sky gradient — re-use CSS stop strings when layers are unchanged
  const layersChanged =
    !cachedGradientLayers ||
    cachedGradientH !== height ||
    cachedGradientLayers.upperSky !== layers.upperSky ||
    cachedGradientLayers.midSky !== layers.midSky ||
    cachedGradientLayers.horizonBand !== layers.horizonBand;

  if (layersChanged) {
    cachedStops = [
      toCssRgb(layers.upperSky),
      toCssRgb(layers.midSky),
      toCssRgb(layers.horizonBand),
    ];
    cachedGradientLayers = layers;
    cachedGradientH = height;
  }

  const gradient = ctx.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, cachedStops[0]);
  gradient.addColorStop(0.55, cachedStops[1]);
  gradient.addColorStop(1, cachedStops[2]);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  // 2) Stars (before atmosphere so stars glow through clouds realistically)
  drawStars(ctx, width, height, sunElevation, cloudCover, time);

  // 2.5) Sun — after stars, before lightning/atmosphere so fog can occlude it
  const sunPos = getSunScreenPosition(width, height, state.astronomy.sunAzimuth, sunElevation);
  drawSun(ctx, width, height, sunElevation, state.astronomy.sunAzimuth, cloudCover, fogDensity, sunPos);

  // 3) Lightning (only during explicit storms)
  const isStorm = state.weather.precipitation === 'storm';
  const stormIntensity = isStorm ? 1 : 0;
  let lightningEffect: { intensity: number; centers: { x: number; y: number; intensity: number }[]; radius: number; color?: string } | undefined = undefined;
  if (isStorm) {
    const result = drawThunderstormWithEffect(ctx, width, height, stormIntensity, layers.midSky, time);
    if (result) lightningEffect = result;
  }

  // 4) Atmosphere over sky/stars/lightning
  drawAtmosphere(ctx, width, height, layers, fogDensity, cloudCover, sunElevation, undefined, undefined, lightningEffect);

  // 6) Ground bounce
  const groundVisibility = Math.max(0, 1 - fogDensity);
  if (groundVisibility > 0.05) {
    const groundGrad = ctx.createLinearGradient(0, height * 1, 0, height);
    groundGrad.addColorStop(0, toCssRgb(layers.groundBounce, 0));
    groundGrad.addColorStop(1, toCssRgb(layers.groundBounce, 1 * groundVisibility));
    ctx.fillStyle = groundGrad;
    ctx.fillRect(0, height * 0.85, width, height * 0.15);
  }

  return { lightningEffect };
};
