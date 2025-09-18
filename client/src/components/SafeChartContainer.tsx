import React, { useLayoutEffect, useState, useRef } from 'react'
import { sanitizeRechartsData, buildQuadraticPath } from '../utils/path-utils'

interface SafeChartContainerProps {
  children: React.ReactNode
  title?: string
  minWidth?: number
  minHeight?: number
}

export function SafeChartContainer({
  children,
  title = "Chart",
  minWidth = 200,
  minHeight = 100
}: SafeChartContainerProps) {
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 })
  const containerRef = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    const container = containerRef.current
    if (container) {
      const { width, height } = container.getBoundingClientRect()
      setDimensions({ width, height })
    }
  }, [])

  const hasValidDimensions = dimensions.width > minWidth && dimensions.height > minHeight

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: '100%',
        minWidth,
        minHeight
      }}
      title={`${title} - Dimensions: ${dimensions.width}x${dimensions.height}`}
    >
      {hasValidDimensions ? (
        children
      ) : (
        <div className="flex items-center justify-center h-full text-gray-500">
          <div className="text-center">
            <p>{title} - Waiting for valid dimensions...</p>
            <p className="text-sm">
              Current: {dimensions.width}x{dimensions.height} |
              Required: {minWidth}x{minHeight}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

interface SafeSmoothingProps {
  data: Array<{ x: number; y: number }>
  fallback?: React.ReactNode
}

/**
 * Safe wrapper for smoothed chart paths that prevents Q grouping errors
 */
export function SafeSmoothing({ data, fallback }: SafeSmoothingProps) {
  const pts = data.filter(p => Number.isFinite(p.x) && Number.isFinite(p.y))

  // Guard: don't smooth with fewer than 2 points
  if (pts.length < 2) {
    return fallback || (
      <div className="flex items-center justify-center h-full text-gray-400">
        <p className="text-sm">Insufficient data for smooth curve (need ≥2 points)</p>
      </div>
    )
  }

  try {
    const d = buildQuadraticPath(pts)
    return <path d={d} {...{ fill: 'none', stroke: 'currentColor', strokeWidth: 2 }} />
  } catch (error) {
    console.error('SafeSmoothing rendering failed:', error)
    return fallback || (
      <div className="flex items-center justify-center h-full text-red-400">
        <p className="text-sm">Path rendering error</p>
      </div>
    )
  }
}

interface SafeRechartsWrapperProps<T extends Record<string, unknown>> {
  Component: React.ComponentType<{ data?: T[]; [key: string]: unknown }>
  data: T[]
  dataKeys: (keyof T)[]
  componentProps?: Record<string, unknown>
  emptyState?: React.ReactNode
}

/**
 * Safe wrapper for Recharts components with automatic data sanitization
 */
export function SafeRechartsWrapper<T extends Record<string, unknown>>({
  Component,
  data,
  dataKeys,
  componentProps = {},
  emptyState
}: SafeRechartsWrapperProps<T>) {
  const sanitizedData = sanitizeRechartsData(data, dataKeys as string[])

  if (sanitizedData.length === 0) {
    return emptyState || (
      <div className="flex items-center justify-center h-full text-gray-400">
        <p className="text-sm">No valid data to display</p>
      </div>
    )
  }

  const props: Record<string, unknown> = {
    ...componentProps,
    data: sanitizedData,
    type: 'linear', // Disable default smoothing
    isAnimationActive: import.meta.env.DEV ? false : componentProps.isAnimationActive,
    connectNulls: false, // Don't connect missing data
  }

  return (
    <SafeChartContainer>
      <Component {...props} />
    </SafeChartContainer>
  )
}

/**
 * Hook for container dimension validation
 */
export function useContainerValidation(minWidth = 200, minHeight = 100) {
  const [isValid, setIsValid] = useState(false)
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 })

  const ref = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    const container = ref.current
    if (container) {
      const updateDimensions = () => {
        const { width, height } = container.getBoundingClientRect()
        setDimensions({ width, height })
        setIsValid(width >= minWidth && height >= minHeight)
      }

      updateDimensions()

      const resizeObserver = new ResizeObserver(updateDimensions)
      resizeObserver.observe(container)

      return () => resizeObserver.disconnect()
    }
  }, [minWidth, minHeight])

  return { ref, isValid, dimensions }
}

export default SafeChartContainer
