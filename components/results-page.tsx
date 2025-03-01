"use client";

import { useEffect, useState, useMemo, useRef, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation"; // Ensure useSearchParams is imported
import { materialDensities } from "@/lib/constants";

interface LayoutData {
  developedLength: number;
  numPlates: number;
  numberOfCut: number;
  plateWidth: number;
  plateLength: number;
  numDevelopedLengthsPerPlate: number;
}

interface Weights {
  totalWeight: number;
  totalCost: number;
  usedWeight: number;
  usedCost: number;
  offcutWeight: number;
  offcutCost: number;
}

interface Tooltip {
  visible: boolean;
  text: string;
  x: number;
  y: number;
}

const useCanvas = (
  layoutData: LayoutData | null,
  scale: number,
  setTooltip: React.Dispatch<React.SetStateAction<Tooltip>>,
  tooltip: Tooltip
) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [clickPosition, setClickPosition] = useState({ x: 0, y: 0 });

  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !layoutData) return;
  
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
  
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.translate(offset.x, offset.y);
    ctx.scale(scale, scale);
  
    const { developedLength, numPlates, plateWidth, plateLength, numDevelopedLengthsPerPlate, numberOfCut } = layoutData;
  
    let numberOfCutUsed = 0;
    for (let i = 0; i < numPlates; i++) {
      const yOffset = i * (plateWidth + 20);
  
      // Draw plate outline
      ctx.strokeStyle = "black";
      ctx.lineWidth = 2 / scale;
      ctx.strokeRect(100 / scale, yOffset + 50 / scale, plateLength, plateWidth);
  
      // Draw developed lengths
      for (let j = 0; j < numDevelopedLengthsPerPlate; j++) {
        numberOfCutUsed++;
        if (numberOfCutUsed > numberOfCut) {
          break;
        }
        const xOffset = 100 / scale + j * developedLength;
        ctx.fillStyle = "gray";
        ctx.fillRect(xOffset, yOffset + 50 / scale, developedLength, plateWidth);
      }
  
      // Draw offcut area in white
      const remainingLength = plateLength - numDevelopedLengthsPerPlate * developedLength;
      if (remainingLength > 0) {
        ctx.fillStyle = "white"; // Set fill style to white
        ctx.fillRect(100 / scale + numDevelopedLengthsPerPlate * developedLength, yOffset + 50 / scale, remainingLength, plateWidth);
  
        // Offcut label
        ctx.fillStyle = "red";
        ctx.fillText(`Offcut: ${Math.round(remainingLength)} mm`, 100 / scale + (numDevelopedLengthsPerPlate * developedLength + plateLength) / 2 + 20 / scale, yOffset + plateWidth / 2);
      }
  
      // Add labels
      ctx.fillStyle = "black";
      ctx.font = `bold ${12 / scale}px Arial`;
  
      // Width label
      ctx.beginPath();
      ctx.moveTo(100 / scale, yOffset + plateWidth / 2 + 5 / scale);
      ctx.lineTo(50 / scale, yOffset + plateWidth / 2 + 5 / scale);
      ctx.stroke();
      ctx.fillText(`Width: ${Math.round(plateWidth)} mm`, 50 / scale, yOffset + plateWidth / 2 + 5 / scale);
  
      // Length label
      ctx.beginPath();
      ctx.moveTo(plateLength / 2 + 100 / scale, yOffset - 5 / scale);
      ctx.lineTo(plateLength / 2 + 100 / scale, yOffset - 20 / scale);
      ctx.stroke();
      ctx.fillText(`Length: ${Math.round(plateLength)} mm`, plateLength / 2 + 100 / scale, yOffset - 25 / scale);
  
      // Developed length label
      ctx.beginPath();
      ctx.moveTo(developedLength / 2 + 100 / scale, yOffset + 20 / scale);
      ctx.lineTo(developedLength / 2 + 100 / scale, yOffset + 35 / scale);
      ctx.stroke();
      ctx.fillText(`Developed Length: ${Math.round(developedLength)} mm`, developedLength / 2 + 100 / scale, yOffset + 40 / scale);
    }
  
    // Draw tooltip if visible
    if (tooltip.visible) {
      ctx.fillStyle = "rgb(255, 0, 0)";
      ctx.fillRect(tooltip.x / scale, tooltip.y / scale, 100 / scale, 30 / scale);
      ctx.fillStyle = "white";
      ctx.fillText(tooltip.text, tooltip.x / scale + 5 / scale, tooltip.y / scale + 20 / scale);
    }
  
    ctx.restore();
  }, [layoutData, scale, tooltip, offset]);
  

  const handleMouseMove = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || !layoutData) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // Show tooltip when hovering over offcut area
    const { developedLength, numDevelopedLengthsPerPlate } = layoutData;
    const offcutX = 100 + (numDevelopedLengthsPerPlate * developedLength) * scale;
    if (x >= offcutX && x <= offcutX + 150 && y >= 50 && y <= canvas.height) {
      setTooltip({ visible: true, text: "Offcut Area", x: x + 10, y: y - 20 });
    } else {
      setTooltip({ visible: false, text: "", x: 0, y: 0 });
    }

    // Handle dragging for pan functionality
    if (isDragging) {
      setOffset({
        x: x - clickPosition.x,
        y: y - clickPosition.y,
      });
    }
  };

  const handleMouseDown = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    setClickPosition({
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    });
    setIsDragging(true);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    drawCanvas();
  }, [drawCanvas]);

  return {
    canvasRef,
    handleMouseMove,
    handleMouseDown,
    handleMouseUp,
  };
};

const ResultsPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams(); // Use useSearchParams to get search parameters
  const [scale, setScale] = useState(0.05);
  const [tooltip, setTooltip] = useState({ visible: false, text: "", x: 0, y: 0 });
  const [weights, setWeights] = useState<Weights | null>(null);
  const [layoutData, setLayoutData] = useState<LayoutData | null>(null);
  const [numUsedPlates, setNumUsedPlates] = useState(0);
  const calculationsPerformed = useRef(false);

  const { canvasRef, handleMouseMove, handleMouseDown, handleMouseUp } = useCanvas(layoutData, scale, setTooltip, tooltip);

  const inputs = useMemo(() => {
    if (searchParams.get('inputs')) { // Use searchParams.get to safely access 'inputs'
      return JSON.parse(decodeURIComponent(searchParams.get('inputs')!));
    }
    return null;
  }, [searchParams]);

  const calculations = useMemo(() => {
    if (!inputs) return null;

    const { internalDia, vesselLength, plateThickness, plateWidth, plateLength, material, ratePerKg } = inputs;

    // Calculate developed length (circumference + allowance)
    const developedLength = Math.round(
      (internalDia + plateThickness) * Math.PI + (plateThickness <= 35 ? plateThickness : 1.5 * plateThickness)
    );

    // Calculate number of developed lengths per plate
    const numDevelopedLengthsPerPlate = Math.floor(plateLength / developedLength);
    const totalDevelopedLengths = Math.ceil(vesselLength / plateWidth) * numDevelopedLengthsPerPlate;

    // Calculate number of plates needed
    const numberOfCut = Math.ceil(vesselLength / plateWidth);
    const numPlatesbottom = Math.floor(plateLength / developedLength);
    const numPlates = Math.ceil(numberOfCut / numPlatesbottom);

    // Get material density
    const density = materialDensities[material];

    // Calculate volumes
    const totalPlateVolume = numPlates * plateLength * plateWidth * plateThickness;
    const usedVolume = numberOfCut * (developedLength * plateWidth * plateThickness);
    const offcutVolume = totalPlateVolume - usedVolume;

    // Calculate weights
    const totalWeight = totalPlateVolume * density;
    const usedWeight = usedVolume * density;
    const offcutWeight = offcutVolume * density;

    // Calculate costs
    const totalCost = totalWeight * ratePerKg;
    const usedCost = usedWeight * ratePerKg;
    const offcutCost = offcutWeight * ratePerKg;

    return {
      weights: { totalWeight, totalCost, usedWeight, usedCost, offcutWeight, offcutCost },
      layoutData: { developedLength, numPlates, plateWidth, plateLength, numDevelopedLengthsPerPlate, numberOfCut },
      numUsedPlates: numPlates,
    };
  }, [inputs]);

  useEffect(() => {
    if (calculations && !calculationsPerformed.current) {
      setWeights(calculations.weights);
      setLayoutData(calculations.layoutData);
      setNumUsedPlates(calculations.numUsedPlates);
      calculationsPerformed.current = true;
    }
  }, [calculations]);

  const handleZoomIn = () => {
    setScale((prevScale) => Math.min(prevScale + 0.01, 0.1));
  };

  const handleZoomOut = () => {
    setScale((prevScale) => Math.max(prevScale - 0.01, 0.01));
  };

  if (!weights || !layoutData) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto">
      <div className="bg-white shadow-lg rounded-lg p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="results-output">
            <h1 className="text-2xl font-bold mb-6">Cutting Layout Results</h1>

            <div className="space-y-3">
              <p>
                <span className="font-semibold">Material:</span> {inputs?.material}
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
  );
};

export default ResultsPage;
