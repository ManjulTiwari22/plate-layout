"use client"

import { useEffect, useState, useMemo, useRef } from "react"
import { useRouter } from "next/navigation"
import useCanvas from "@/hooks/use-canvas"
import { materialDensities } from "@/lib/constants"

interface ResultsPageProps {
  inputs: {
    internalDia: number
    vesselLength: number
    plateThickness: number
    plateWidth: number
    plateLength: number
    material: string
    ratePerKg: number
  }
}

interface LayoutData {
  developedLength: number
  numPlatesWidth: number
  plateWidth: number
  plateLength: number
  lastPlateWidth: number
  lastPlateLength: number
}

interface Weights {
  totalWeight: number
  totalCost: number
  usedWeight: number
  usedCost: number
  offcutWeight: number
  offcutCost: number
}

const ResultsPage = ({ inputs }: ResultsPageProps) => {
  const router = useRouter()
  const [scale, setScale] = useState(0.05)
  const [tooltip, setTooltip] = useState({ visible: false, text: "", x: 0, y: 0 })
  const [weights, setWeights] = useState<Weights | null>(null)
  const [layoutData, setLayoutData] = useState<LayoutData | null>(null)
  const [numUsedPlates, setNumUsedPlates] = useState(0)
  const calculationsPerformed = useRef(false)

  const { canvasRef, handleMouseMove, handleMouseDown, handleMouseUp } = useCanvas(
    layoutData,
    scale,
    setTooltip,
    tooltip,
  )

  const calculations = useMemo(() => {
    if (!inputs) return null

    const { internalDia, vesselLength, plateThickness, plateWidth, plateLength, material, ratePerKg } = inputs

    // Calculate developed length (circumference + allowance)
    const developedLength = Math.round(
      (internalDia + plateThickness) * Math.PI + (plateThickness <= 35 ? plateThickness : 1.5 * plateThickness),
    )

    // Calculate number of plates needed
    const numPlatesWidth = Math.ceil(vesselLength / (plateWidth + 2))
    const lastPlateWidth = vesselLength - (numPlatesWidth - 1) * (plateWidth + 2)
    const numPlatesLength = Math.ceil(developedLength / plateLength)
    const lastPlateLength = developedLength - (numPlatesLength - 1) * plateLength

    // Get material density
    const density = materialDensities[material]

    // Calculate volumes
    const totalPlateVolume = numPlatesWidth * plateLength * plateWidth * plateThickness
    const usedVolume =
      (numPlatesWidth - 1) * developedLength * plateWidth * plateThickness +
      lastPlateWidth * developedLength * plateThickness
    const offcutVolume = totalPlateVolume - usedVolume

    // Calculate weights
    const totalWeight = totalPlateVolume * density
    const usedWeight = usedVolume * density
    const offcutWeight = offcutVolume * density

    // Calculate costs
    const totalCost = totalWeight * ratePerKg
    const usedCost = usedWeight * ratePerKg
    const offcutCost = offcutWeight * ratePerKg

    // Calculate total number of plates used
    const usedPlates = numPlatesWidth * numPlatesLength

    return {
      weights: { totalWeight, totalCost, usedWeight, usedCost, offcutWeight, offcutCost },
      layoutData: { developedLength, numPlatesWidth, plateWidth, plateLength, lastPlateWidth, lastPlateLength },
      numUsedPlates: usedPlates,
    }
  }, [inputs])

  useEffect(() => {
    if (calculations && !calculationsPerformed.current) {
      setWeights(calculations.weights)
      setLayoutData(calculations.layoutData)
      setNumUsedPlates(calculations.numUsedPlates)
      calculationsPerformed.current = true
    }
  }, [calculations])

  const handleZoomIn = () => {
    setScale((prevScale) => Math.min(prevScale + 0.01, 0.1))
  }

  const handleZoomOut = () => {
    setScale((prevScale) => Math.max(prevScale - 0.01, 0.01))
  }

  if (!weights || !layoutData) {
    return <div>Loading...</div>
  }

  return (
    <div className="container mx-auto">
      <div className="bg-white shadow-lg rounded-lg p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="results-output">
            <h1 className="text-2xl font-bold mb-6">Cutting Layout Results</h1>

            <div className="space-y-3">
              <p>
                <span className="font-semibold">Material:</span> {inputs.material}
              </p>
              <p>
                <span className="font-semibold">Number of Used Plates:</span> {numUsedPlates}
              </p>
              <p>
                <span className="font-semibold">Total Plate Weight:</span> {weights.totalWeight.toFixed(2)} kg | Cost: ₹
                {weights.totalCost.toFixed(2)}
              </p>
              <p>
                <span className="font-semibold">Used Plate Weight:</span> {weights.usedWeight.toFixed(2)} kg | Cost: ₹
                {weights.usedCost.toFixed(2)}
              </p>
              <p>
                <span className="font-semibold">Offcut Weight:</span> {weights.offcutWeight.toFixed(2)} kg | Cost: ₹
                {weights.offcutCost.toFixed(2)}
              </p>

              <div className="mt-6">
                <button
                  onClick={() => router.push("/")}
                  className="px-6 py-2 bg-gray-600 text-white font-medium rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                >
                  Back to Input
                </button>
              </div>
            </div>
          </div>

          <div className="canvas-container">
            <div className="border border-gray-300 rounded-lg overflow-hidden">
              <canvas
                ref={canvasRef}
                width="800"
                height="600"
                className="w-full h-[500px]"
                onMouseMove={handleMouseMove}
                onMouseDown={handleMouseDown}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
              ></canvas>
            </div>

            <div className="mt-4 flex justify-center space-x-4">
              <button
                onClick={handleZoomIn}
                className="px-4 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Zoom In
              </button>
              <button
                onClick={handleZoomOut}
                className="px-4 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Zoom Out
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ResultsPage

