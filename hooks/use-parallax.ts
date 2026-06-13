"use client"

import { useEffect, useRef, useState, useCallback } from "react"

export function useParallax() {
  const [scrollY, setScrollY] = useState(0)

  const handleScroll = useCallback(() => {
    setScrollY(window.scrollY)
  }, [])

  useEffect(() => {
    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [handleScroll])

  return scrollY
}

// Returns a parallax offset (in percent of the element's own height) based on
// how far the element is from the vertical center of the viewport. Drives a
// subtle depth shift on event banners as the page scrolls. The value is
// rAF-throttled and clamped so it never exceeds the image's overflow headroom.
export function useParallaxOffset(maxPercent = 8) {
  const ref = useRef<HTMLDivElement | null>(null)
  const [offset, setOffset] = useState(0)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (typeof window === "undefined") return
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return

    let raf = 0
    const update = () => {
      raf = 0
      const rect = el.getBoundingClientRect()
      const vh = window.innerHeight || 1
      const elementCenter = rect.top + rect.height / 2
      const distanceFromCenter = elementCenter - vh / 2
      const range = vh / 2 + rect.height / 2
      const progress = Math.max(-1, Math.min(1, distanceFromCenter / range))
      setOffset(progress * maxPercent)
    }
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update)
    }

    update()
    window.addEventListener("scroll", onScroll, { passive: true })
    window.addEventListener("resize", onScroll, { passive: true })
    return () => {
      window.removeEventListener("scroll", onScroll)
      window.removeEventListener("resize", onScroll)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [maxPercent])

  return { ref, offset }
}

export function useInView(threshold = 0.15) {
  const [ref, setRef] = useState<HTMLElement | null>(null)
  const [isInView, setIsInView] = useState(false)

  useEffect(() => {
    if (!ref) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true)
        }
      },
      { threshold }
    )
    observer.observe(ref)
    return () => observer.disconnect()
  }, [ref, threshold])

  return { ref: setRef, isInView }
}
