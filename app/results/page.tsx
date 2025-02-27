"use client"

import { useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"
import ResultsPage from "@/components/results-page"

export default function Results() {
  const searchParams = useSearchParams()
  const [inputData, setInputData] = useState(null)

  useEffect(() => {
    // Get data from URL params
    if (searchParams) {
      try {
        const inputsParam = searchParams.get("inputs")
        if (inputsParam) {
          const decodedInputs = JSON.parse(decodeURIComponent(inputsParam))
          setInputData(decodedInputs)
        }
      } catch (error) {
        console.error("Error parsing input data:", error)
      }
    }
  }, [searchParams])

  if (!inputData) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }

  return (
    <main className="min-h-screen p-4">
      <ResultsPage inputs={inputData} />
    </main>
  )
}

