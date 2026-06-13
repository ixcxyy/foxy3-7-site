// image_pos_x / image_pos_y store the focal point of the event image in
// percent (50/50 = centered), image_scale is the zoom in percent (100-300).
// The admin preview and the public events section share this so the crop
// shown while editing matches the website exactly.

type EventImageFields = {
  image_scale: number | null
  image_pos_x: number | null
  image_pos_y: number | null
}

function clampPercent(value: number | null, fallback: number) {
  const num = Number(value)
  if (!Number.isFinite(num)) return fallback
  return Math.max(0, Math.min(100, num))
}

export function eventImageStyle(event: EventImageFields) {
  const focalX = clampPercent(event.image_pos_x, 50)
  const focalY = clampPercent(event.image_pos_y, 50)
  const zoom = Math.max(100, Math.min(300, Number(event.image_scale) || 100))
  return {
    objectPosition: `${focalX}% ${focalY}%`,
    transform: `scale(${zoom / 100})`,
    transformOrigin: `${focalX}% ${focalY}%`,
  } as const
}
