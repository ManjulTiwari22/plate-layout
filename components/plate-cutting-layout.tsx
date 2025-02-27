"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { materialDensities } from "@/lib/constants"

const PlateCuttingLayout = () => {
  const [inputs, setInputs] = useState({
    internalDia: "",
    vesselLength: "",
    plateThickness: "",
    plateWidth: "",
    plateLength: "",
    material: "IS 2062 GR.B",
    ratePerKg: "",
  })

  const [error, setError] = useState("")
  const router = useRouter()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setInputs({
      ...inputs,
      [name]: name === "material" ? value : value === "" ? "" : Number.parseFloat(value) || 0,
    })
  }

  const generateLayout = () => {
    const { internalDia, vesselLength, plateThickness, plateWidth, plateLength, material, ratePerKg } = inputs

    // Check for empty fields
    if (!internalDia || !vesselLength || !plateThickness || !plateWidth || !plateLength || !ratePerKg) {
      setError("All fields must be filled out.")
      return
    }

    setError("") // Clear any previous errors

    // Encode the inputs as URL parameters
    const encodedInputs = encodeURIComponent(JSON.stringify(inputs))
    router.push(`/results?inputs=${encodedInputs}`)
  }

  return (
    <div className="w-full max-w-2xl bg-white shadow-lg rounded-lg p-6">
      <div className="form-container">
        <h1 className="text-2xl font-bold mb-6 text-center">Plate Cutting Layout</h1>

        {error && <p className="text-red-500 mb-4">{error}</p>}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="form-group">
            <label className="block mb-2 font-medium">
              Internal Diameter (mm):
              <input
                type="number"
                name="internalDia"
                value={inputs.internalDia}
                onChange={handleChange}
                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </label>
          </div>

          <div className="form-group">
            <label className="block mb-2 font-medium">
              Vessel Length (mm):
              <input
                type="number"
                name="vesselLength"
                value={inputs.vesselLength}
                onChange={handleChange}
                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </label>
          </div>

          <div className="form-group">
            <label className="block mb-2 font-medium">
              Plate Thickness (mm):
              <input
                type="number"
                name="plateThickness"
                value={inputs.plateThickness}
                onChange={handleChange}
                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </label>
          </div>

          <div className="form-group">
            <label className="block mb-2 font-medium">
              Plate Width (mm):
              <input
                type="number"
                name="plateWidth"
                value={inputs.plateWidth}
                onChange={handleChange}
                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </label>
          </div>

          <div className="form-group">
            <label className="block mb-2 font-medium">
              Plate Length (mm):
              <input
                type="number"
                name="plateLength"
                value={inputs.plateLength}
                onChange={handleChange}
                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </label>
          </div>

          <div className="form-group">
            <label className="block mb-2 font-medium">
              Material:
              <select
                name="material"
                value={inputs.material}
                onChange={handleChange}
                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {Object.keys(materialDensities).map((mat) => (
                  <option key={mat} value={mat}>
                    {mat}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="form-group">
            <label className="block mb-2 font-medium">
              Rate Per Kg:
              <input
                type="number"
                name="ratePerKg"
                value={inputs.ratePerKg}
                onChange={handleChange}
                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </label>
          </div>
        </div>

        <div className="mt-6 text-center">
          <button
            onClick={generateLayout}
            className="px-6 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Generate Layout
          </button>
        </div>
      </div>
    </div>
  )
}

export default PlateCuttingLayout

