"use client"

import type React from "react"

import { useRef, useState, useEffect, useCallback } from "react"

interface LayoutData {
  developedLength: number
  numPlatesWidth: number
  plateWidth: number
  plateLength: number
  lastPlateWidth: number
  lastPlateLength: number
}

interface Tooltip {
  visible: boolean
  text: string
  x: number
  y: number
}

const useCanvas = (
  layoutData: LayoutData | null,
  scale: number,
  setTooltip: React.Dispatch<React.SetStateAction<Tooltip>>,
  tooltip: Tooltip,
) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [clickPosition, setClickPosition] = useState({ x: 0, y: 0 })

  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas || !layoutData) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.save()
    ctx.translate(offset.x, offset.y)
    ctx.scale(scale, scale)

    const { developedLength, numPlatesWidth, plateWidth, plateLength, lastPlateWidth, lastPlateLength } = layoutData

    for (let i = 0; i < numPlatesWidth; i++) {
      const yOffset = i * (plateWidth + 2 + 20 / scale)
      const currentPlateWidth = i === numPlatesWidth - 1 ? lastPlateWidth : plateWidth

      // Draw plate outline
      ctx.strokeStyle = "black"
      ctx.lineWidth = 2 / scale
      ctx.strokeRect(100 / scale, yOffset + 50 / scale, plateLength, plateWidth)

      // Draw used area
      ctx.fillStyle = "gray"
      ctx.fillRect(100 / scale, yOffset + 50 / scale, developedLength, currentPlateWidth)

      // Draw offcut area with mesh pattern
      const meshSize = 4 / scale
      ctx.strokeStyle = "rgb(255, 5, 5)"
      ctx.lineWidth = 4

      // Vertical lines
      for (let x = 100 / scale + developedLength; x < 100 / scale + plateLength; x += meshSize) {
        ctx.beginPath()
        ctx.moveTo(x, yOffset + 50 / scale)
        ctx.lineTo(x, yOffset + 50 / scale + currentPlateWidth)
        ctx.stroke()
      }

      // Horizontal lines
      for (let y = yOffset + 50 / scale; y < yOffset + 50 / scale + currentPlateWidth; y += meshSize) {
        ctx.beginPath()
        ctx.moveTo(100 / scale + developedLength, y)
        ctx.lineTo(100 / scale + plateLength, y)
        ctx.stroke()
      }

      // Add labels
      ctx.fillStyle = "black"
      ctx.font = `bold ${12 / scale}px Arial`

      // Width label
      ctx.beginPath()
      ctx.moveTo(100 / scale, yOffset + currentPlateWidth / 2 + 5 / scale)
      ctx.lineTo(50 / scale, yOffset + currentPlateWidth / 2 + 5 / scale)
      ctx.stroke()
      ctx.fillText(
        `Width: ${Math.round(currentPlateWidth)} mm`,
        50 / scale,
        yOffset + currentPlateWidth / 2 + 5 / scale,
      )

      // Length label
      ctx.beginPath()
      ctx.moveTo(plateLength / 2 + 100 / scale, yOffset - 5 / scale)
      ctx.lineTo(plateLength / 2 + 100 / scale, yOffset - 20 / scale)
      ctx.stroke()
      ctx.fillText(`Length: ${Math.round(plateLength)} mm`, plateLength / 2 + 100 / scale, yOffset - 25 / scale)

      // Developed length label
      ctx.beginPath()
      ctx.moveTo(developedLength / 2 + 100 / scale, yOffset + 20 / scale)
      ctx.lineTo(developedLength / 2 + 100 / scale, yOffset + 35 / scale)
      ctx.stroke()
      ctx.fillText(
        `Developed Length: ${Math.round(developedLength)} mm`,
        developedLength / 2 + 100 / scale,
        yOffset + 40 / scale,
      )

      // Offcut label
      ctx.beginPath()
      ctx.moveTo(100 / scale + (developedLength + lastPlateLength) / 2, yOffset + currentPlateWidth / 1)
      ctx.lineTo(100 / scale + (developedLength + lastPlateLength) / 2 + 15 / scale, yOffset + currentPlateWidth / 2)
      ctx.stroke()
      ctx.fillStyle = "red"
      ctx.fillText(
        `Offcut: ${Math.round(plateLength - lastPlateLength)} mm`,
        100 / scale + (developedLength + lastPlateLength) / 2 + 20 / scale,
        yOffset + currentPlateWidth / 2,
      )
    }

    // Draw tooltip if visible
    if (tooltip.visible) {
      ctx.fillStyle = "rgb(255, 0, 0)"
      ctx.fillRect(tooltip.x / scale, tooltip.y / scale, 100 / scale, 30 / scale)
      ctx.fillStyle = "white"
      ctx.fillText(tooltip.text, tooltip.x / scale + 5 / scale, tooltip.y / scale + 20 / scale)
    }

    ctx.restore()
  }, [layoutData, scale, tooltip, offset])

  const handleMouseMove = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas || !layoutData) return

    const rect = canvas.getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top

    // Show tooltip when hovering over offcut area
    const { developedLength, lastPlateLength } = layoutData
    const offcutX = 100 + (developedLength + lastPlateLength) * scale
    if (x >= offcutX && x <= offcutX + 150 && y >= 50 && y <= canvas.height) {
      setTooltip({ visible: true, text: "Offcut Area", x: x + 10, y: y - 20 })
    } else {
      setTooltip({ visible: false, text: "", x: 0, y: 0 })
    }

    // Handle dragging for pan functionality
    if (isDragging) {
      setOffset({
        x: x - clickPosition.x,
        y: y - clickPosition.y,
      })
    }
  }

  const handleMouseDown = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    setClickPosition({
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    })
    setIsDragging(true)
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  useEffect(() => {
    drawCanvas()
  }, [drawCanvas])

  return {
    canvasRef,
    handleMouseMove,
    handleMouseDown,
    handleMouseUp,
  }
}

export default useCanvas

