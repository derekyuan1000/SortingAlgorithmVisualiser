"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Play, Pause, RotateCcw, Settings } from "lucide-react"

interface ArrayElement {
  value: number
  isComparing?: boolean
  isSwapping?: boolean
  isSorted?: boolean
}

export default function Component() {
  const MAX_ARRAY_SIZE = 200
  const [minValue, setMinValue] = useState(1)
  const [maxValue, setMaxValue] = useState(100)
  const [arraySize, setArraySize] = useState(20)
  const [algorithm, setAlgorithm] = useState("bubble")
  const [array, setArray] = useState<ArrayElement[]>([])
  const [isPlaying, setIsPlaying] = useState(false)
  const [speed, setSpeed] = useState(100)
  const [currentStep, setCurrentStep] = useState(0)
  const [sortingSteps, setSortingSteps] = useState<ArrayElement[][]>([])
  const [isMuted, setIsMuted] = useState(false)
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null)
  const [darkMode, setDarkMode] = useState(false)

  const initAudio = () => {
    if (!audioContext) {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
      setAudioContext(ctx)
      return ctx
    }
    return audioContext
  }

  const playTone = (value: number, duration = 100, type: "compare" | "swap" = "compare") => {
    if (isMuted) return

    const ctx = initAudio()
    if (!ctx) return

    const minFreq = 200
    const maxFreq = 800
    const normalizedValue = (value - minValue) / (maxValue - minValue)
    const frequency = minFreq + normalizedValue * (maxFreq - minFreq)

    const oscillator = ctx.createOscillator()
    const gainNode = ctx.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(ctx.destination)

    oscillator.frequency.setValueAtTime(frequency, ctx.currentTime)
    oscillator.type = type === "swap" ? "triangle" : "sine"

    gainNode.gain.setValueAtTime(0, ctx.currentTime)
    gainNode.gain.linearRampToValueAtTime(0.1, ctx.currentTime + 0.01)
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration / 1000)

    oscillator.start(ctx.currentTime)
    oscillator.stop(ctx.currentTime + duration / 1000)
  }

  const playStepSounds = (currentArray: ArrayElement[]) => {
    if (isMuted) return

    const comparingElements = currentArray.filter((el) => el.isComparing)
    const swappingElements = currentArray.filter((el) => el.isSwapping)

    if (swappingElements.length > 0) {
      swappingElements.forEach((el, index) => {
        setTimeout(() => playTone(el.value, 150, "swap"), index * 50)
      })
    } else if (comparingElements.length > 0) {
      comparingElements.forEach((el, index) => {
        setTimeout(() => playTone(el.value, 100, "compare"), index * 25)
      })
    }
  }

  const generateArray = useCallback(() => {
    const safeSize = Math.min(arraySize, MAX_ARRAY_SIZE)
    const newArray: ArrayElement[] = []
    for (let i = 0; i < safeSize; i++) {
      newArray.push({
        value: Math.floor(Math.random() * (maxValue - minValue + 1)) + minValue,
      })
    }
    setArray(newArray)
    setCurrentStep(0)
    setSortingSteps([])
    setIsPlaying(false)
  }, [minValue, maxValue, arraySize])

  // -------------------- Quadratic Sorts --------------------
  const bubbleSort = (arr: ArrayElement[]): ArrayElement[][] => {
    const steps: ArrayElement[][] = []
    const sortedArray = [...arr]
    const n = sortedArray.length

    for (let i = 0; i < n - 1; i++) {
      for (let j = 0; j < n - i - 1; j++) {
        const stepArray = sortedArray.map((el, idx) => ({
          ...el,
          isComparing: idx === j || idx === j + 1,
          isSwapping: false,
          isSorted: idx >= n - i,
        }))
        steps.push([...stepArray])

        if (sortedArray[j].value > sortedArray[j + 1].value) {
          const swapArray = sortedArray.map((el, idx) => ({
            ...el,
            isComparing: false,
            isSwapping: idx === j || idx === j + 1,
            isSorted: idx >= n - i,
          }))
          steps.push([...swapArray])

          const temp = sortedArray[j]
          sortedArray[j] = sortedArray[j + 1]
          sortedArray[j + 1] = temp
        }
      }
    }

    const finalArray = sortedArray.map((el) => ({ ...el, isSorted: true, isComparing: false, isSwapping: false }))
    steps.push(finalArray)
    return steps
  }

  const selectionSort = (arr: ArrayElement[]): ArrayElement[][] => {
    const steps: ArrayElement[][] = []
    const sortedArray = [...arr]
    const n = sortedArray.length

    for (let i = 0; i < n - 1; i++) {
      let minIdx = i

      for (let j = i + 1; j < n; j++) {
        const stepArray = sortedArray.map((el, idx) => ({
          ...el,
          isComparing: idx === minIdx || idx === j,
          isSwapping: false,
          isSorted: idx < i,
        }))
        steps.push([...stepArray])

        if (sortedArray[j].value < sortedArray[minIdx].value) {
          minIdx = j
        }
      }

      if (minIdx !== i) {
        const swapArray = sortedArray.map((el, idx) => ({
          ...el,
          isComparing: false,
          isSwapping: idx === i || idx === minIdx,
          isSorted: idx < i,
        }))
        steps.push([...swapArray])

        const temp = sortedArray[i]
        sortedArray[i] = sortedArray[minIdx]
        sortedArray[minIdx] = temp
      }
    }

    const finalArray = sortedArray.map((el) => ({ ...el, isSorted: true, isComparing: false, isSwapping: false }))
    steps.push(finalArray)
    return steps
  }

  // Insertion Sort
  const insertionSort = (arr: ArrayElement[]): ArrayElement[][] => {
    const steps: ArrayElement[][] = []
    const sortedArray = [...arr]
    const n = sortedArray.length
    for (let i = 1; i < n; i++) {
      let key = sortedArray[i]
      let j = i - 1
      while (j >= 0 && sortedArray[j].value > key.value) {
        const stepArray = sortedArray.map((el, idx) => ({
          ...el,
          isComparing: idx === j || idx === j + 1,
          isSwapping: idx === j + 1,
          isSorted: idx < i,
        }))
        steps.push([...stepArray])
        sortedArray[j + 1] = sortedArray[j]
        j--
      }
      sortedArray[j + 1] = key
      const stepArray = sortedArray.map((el, idx) => ({
        ...el,
        isComparing: idx === j + 1,
        isSwapping: false,
        isSorted: idx <= i,
      }))
      steps.push([...stepArray])
    }
    const finalArray = sortedArray.map((el) => ({ ...el, isSorted: true, isComparing: false, isSwapping: false }))
    steps.push(finalArray)
    return steps
  }

  // Gnome Sort
  const gnomeSort = (arr: ArrayElement[]): ArrayElement[][] => {
    const steps: ArrayElement[][] = []
    const sortedArray = [...arr]
    let n = sortedArray.length
    let index = 0
    while (index < n) {
      if (index === 0) index++
      if (sortedArray[index].value >= sortedArray[index - 1].value) {
        index++
      } else {
        const stepArray = sortedArray.map((el, idx) => ({
          ...el,
          isComparing: idx === index || idx === index - 1,
          isSwapping: false,
          isSorted: false,
        }))
        steps.push([...stepArray])
        ;[sortedArray[index], sortedArray[index - 1]] = [sortedArray[index - 1], sortedArray[index]]
        const swapArray = sortedArray.map((el, idx) => ({
          ...el,
          isComparing: false,
          isSwapping: idx === index || idx === index - 1,
          isSorted: false,
        }))
        steps.push([...swapArray])
        index--
      }
    }
    const finalArray = sortedArray.map((el) => ({ ...el, isSorted: true, isComparing: false, isSwapping: false }))
    steps.push(finalArray)
    return steps
  }

  // Cocktail Shaker Sort
  const cocktailShakerSort = (arr: ArrayElement[]): ArrayElement[][] => {
    const steps: ArrayElement[][] = []
    const sortedArray = [...arr]
    let n = sortedArray.length
    let start = 0
    let end = n - 1
    let swapped = true
    while (swapped) {
      swapped = false
      for (let i = start; i < end; i++) {
        const stepArray = sortedArray.map((el, idx) => ({
          ...el,
          isComparing: idx === i || idx === i + 1,
          isSwapping: false,
          isSorted: false,
        }))
        steps.push([...stepArray])
        if (sortedArray[i].value > sortedArray[i + 1].value) {
          ;[sortedArray[i], sortedArray[i + 1]] = [sortedArray[i + 1], sortedArray[i]]
          swapped = true
          const swapArray = sortedArray.map((el, idx) => ({
            ...el,
            isComparing: false,
            isSwapping: idx === i || idx === i + 1,
            isSorted: false,
          }))
          steps.push([...swapArray])
        }
      }
      if (!swapped) break
      swapped = false
      end--
      for (let i = end - 1; i >= start; i--) {
        const stepArray = sortedArray.map((el, idx) => ({
          ...el,
          isComparing: idx === i || idx === i + 1,
          isSwapping: false,
          isSorted: false,
        }))
        steps.push([...stepArray])
        if (sortedArray[i].value > sortedArray[i + 1].value) {
          ;[sortedArray[i], sortedArray[i + 1]] = [sortedArray[i + 1], sortedArray[i]]
          swapped = true
          const swapArray = sortedArray.map((el, idx) => ({
            ...el,
            isComparing: false,
            isSwapping: idx === i || idx === i + 1,
            isSorted: false,
          }))
          steps.push([...swapArray])
        }
      }
      start++
    }
    const finalArray = sortedArray.map((el) => ({ ...el, isSorted: true, isComparing: false, isSwapping: false }))
    steps.push(finalArray)
    return steps
  }

  // -------------------- Logarithmic/Linearithmic Sorts --------------------
  const mergeSort = (arr: ArrayElement[]): ArrayElement[][] => {
    const steps: ArrayElement[][] = []
    const sortedArray = [...arr]

    const merge = (left: number, mid: number, right: number) => {
      const leftArr = sortedArray.slice(left, mid + 1)
      const rightArr = sortedArray.slice(mid + 1, right + 1)

      let i = 0,
        j = 0,
        k = left

      const stepArray = sortedArray.map((el, idx) => ({
        ...el,
        isComparing: idx >= left && idx <= right,
        isSwapping: false,
        isSorted: false,
      }))
      steps.push([...stepArray])

      while (i < leftArr.length && j < rightArr.length) {
        if (leftArr[i].value <= rightArr[j].value) {
          sortedArray[k] = leftArr[i]
          i++
        } else {
          sortedArray[k] = rightArr[j]
          j++
        }
        k++
      }

      while (i < leftArr.length) {
        sortedArray[k] = leftArr[i]
        i++
        k++
      }

      while (j < rightArr.length) {
        sortedArray[k] = rightArr[j]
        j++
        k++
      }

      const mergedArray = sortedArray.map((el, idx) => ({
        ...el,
        isComparing: false,
        isSwapping: idx >= left && idx <= right,
        isSorted: false,
      }))
      steps.push([...mergedArray])
    }

    const mergeSortHelper = (left: number, right: number) => {
      if (left < right) {
        const mid = Math.floor((left + right) / 2)
        mergeSortHelper(left, mid)
        mergeSortHelper(mid + 1, right)
        merge(left, mid, right)
      }
    }

    mergeSortHelper(0, sortedArray.length - 1)

    const finalArray = sortedArray.map((el) => ({ ...el, isSorted: true, isComparing: false, isSwapping: false }))
    steps.push(finalArray)
    return steps
  }

  // Quick Sort
  const quickSort = (arr: ArrayElement[]): ArrayElement[][] => {
    const steps: ArrayElement[][] = []
    const sortedArray = [...arr]
    const n = sortedArray.length

    const quickSortHelper = (low: number, high: number) => {
      if (low < high) {
        const pi = partition(low, high)
        quickSortHelper(low, pi - 1)
        quickSortHelper(pi + 1, high)
      }
    }

    const partition = (low: number, high: number): number => {
      const pivot = sortedArray[high]
      let i = low - 1
      for (let j = low; j < high; j++) {
        const stepArray = sortedArray.map((el, idx) => ({
          ...el,
          isComparing: idx === j || idx === high,
          isSwapping: false,
          isSorted: false,
        }))
        steps.push([...stepArray])
        if (sortedArray[j].value < pivot.value) {
          i++
          ;[sortedArray[i], sortedArray[j]] = [sortedArray[j], sortedArray[i]]
          const swapArray = sortedArray.map((el, idx) => ({
            ...el,
            isComparing: false,
            isSwapping: idx === i || idx === j,
            isSorted: false,
          }))
          steps.push([...swapArray])
        }
      }
      ;[sortedArray[i + 1], sortedArray[high]] = [sortedArray[high], sortedArray[i + 1]]
      const swapArray = sortedArray.map((el, idx) => ({
        ...el,
        isComparing: false,
        isSwapping: idx === i + 1 || idx === high,
        isSorted: false,
      }))
      steps.push([...swapArray])
      return i + 1
    }

    quickSortHelper(0, n - 1)
    const finalArray = sortedArray.map((el) => ({ ...el, isSorted: true, isComparing: false, isSwapping: false }))
    steps.push(finalArray)
    return steps
  }

  // Heap Sort
  const heapSort = (arr: ArrayElement[]): ArrayElement[][] => {
    const steps: ArrayElement[][] = []
    const sortedArray = [...arr]
    const n = sortedArray.length

    const heapify = (n: number, i: number) => {
      let largest = i
      const l = 2 * i + 1
      const r = 2 * i + 2

      if (l < n && sortedArray[l].value > sortedArray[largest].value) largest = l
      if (r < n && sortedArray[r].value > sortedArray[largest].value) largest = r

      if (largest !== i) {
        const stepArray = sortedArray.map((el, idx) => ({
          ...el,
          isComparing: idx === i || idx === largest,
          isSwapping: false,
          isSorted: false,
        }))
        steps.push([...stepArray])
        ;[sortedArray[i], sortedArray[largest]] = [sortedArray[largest], sortedArray[i]]
        const swapArray = sortedArray.map((el, idx) => ({
          ...el,
          isComparing: false,
          isSwapping: idx === i || idx === largest,
          isSorted: false,
        }))
        steps.push([...swapArray])
        heapify(n, largest)
      }
    }

    for (let i = Math.floor(n / 2) - 1; i >= 0; i--) heapify(n, i)
    for (let i = n - 1; i > 0; i--) {
      ;[sortedArray[0], sortedArray[i]] = [sortedArray[i], sortedArray[0]]
      const swapArray = sortedArray.map((el, idx) => ({
        ...el,
        isComparing: false,
        isSwapping: idx === 0 || idx === i,
        isSorted: idx > i,
      }))
      steps.push([...swapArray])
      heapify(i, 0)
    }
    const finalArray = sortedArray.map((el) => ({ ...el, isSorted: true, isComparing: false, isSwapping: false }))
    steps.push(finalArray)
    return steps
  }

  // Shell Sort
  const shellSort = (arr: ArrayElement[]): ArrayElement[][] => {
    const steps: ArrayElement[][] = []
    const sortedArray = [...arr]
    const n = sortedArray.length
    for (let gap = Math.floor(n / 2); gap > 0; gap = Math.floor(gap / 2)) {
      for (let i = gap; i < n; i++) {
        let temp = sortedArray[i]
        let j
        for (j = i; j >= gap && sortedArray[j - gap].value > temp.value; j -= gap) {
          const stepArray = sortedArray.map((el, idx) => ({
            ...el,
            isComparing: idx === j || idx === j - gap,
            isSwapping: false,
            isSorted: false,
          }))
          steps.push([...stepArray])
          sortedArray[j] = sortedArray[j - gap]
        }
        sortedArray[j] = temp
        const stepArray = sortedArray.map((el, idx) => ({
          ...el,
          isComparing: idx === j,
          isSwapping: false,
          isSorted: false,
        }))
        steps.push([...stepArray])
      }
    }
    const finalArray = sortedArray.map((el) => ({ ...el, isSorted: true, isComparing: false, isSwapping: false }))
    steps.push(finalArray)
    return steps
  }

  // -------------------- Miscellaneous Sorts --------------------
  // Comb Sort
  const combSort = (arr: ArrayElement[]): ArrayElement[][] => {
    const steps: ArrayElement[][] = []
    const sortedArray = [...arr]
    const n = sortedArray.length
    let gap = n
    let swapped = true
    const getNextGap = (gap: number) => Math.floor((gap * 10) / 13) || 1
    while (gap !== 1 || swapped) {
      gap = getNextGap(gap)
      swapped = false
      for (let i = 0; i < n - gap; i++) {
        const stepArray = sortedArray.map((el, idx) => ({
          ...el,
          isComparing: idx === i || idx === i + gap,
          isSwapping: false,
          isSorted: false,
        }))
        steps.push([...stepArray])
        if (sortedArray[i].value > sortedArray[i + gap].value) {
          ;[sortedArray[i], sortedArray[i + gap]] = [sortedArray[i + gap], sortedArray[i]]
          swapped = true
          const swapArray = sortedArray.map((el, idx) => ({
            ...el,
            isComparing: false,
            isSwapping: idx === i || idx === i + gap,
            isSorted: false,
          }))
          steps.push([...swapArray])
        }
      }
    }
    const finalArray = sortedArray.map((el) => ({ ...el, isSorted: true, isComparing: false, isSwapping: false }))
    steps.push(finalArray)
    return steps
  }

  // Bogo Sort (for demonstration only, very slow for n > 7)
  function isSorted(arr: ArrayElement[]) {
    for (let i = 1; i < arr.length; i++) {
      if (arr[i - 1].value > arr[i].value) return false
    }
    return true
  }
  function shuffle(arr: ArrayElement[]) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[arr[i], arr[j]] = [arr[j], arr[i]]
    }
  }
  const bogoSort = (arr: ArrayElement[]): ArrayElement[][] => {
    const steps: ArrayElement[][] = []
    const sortedArray = [...arr]
    let tries = 0
    while (!isSorted(sortedArray) && tries < 5000) {
      const stepArray = sortedArray.map((el, idx) => ({
        ...el,
        isComparing: false,
        isSwapping: false,
        isSorted: false,
      }))
      steps.push([...stepArray])
      shuffle(sortedArray)
      tries++
    }
    const finalArray = sortedArray.map((el) => ({
      ...el,
      isSorted: true,
      isComparing: false,
      isSwapping: false,
    }))
    steps.push(finalArray)
    return steps
  }

  const startSorting = () => {
    let steps: ArrayElement[][] = []

    switch (algorithm) {
      // Quadratic
      case "bubble":
        steps = bubbleSort(array)
        break
      case "selection":
        steps = selectionSort(array)
        break
      case "insertion":
        steps = insertionSort(array)
        break
      case "gnome":
        steps = gnomeSort(array)
        break
      case "cocktail":
        steps = cocktailShakerSort(array)
        break
      // Logarithmic/Linearithmic
      case "merge":
        steps = mergeSort(array)
        break
      case "quick":
        steps = quickSort(array)
        break
      case "heap":
        steps = heapSort(array)
        break
      case "shell":
        steps = shellSort(array)
        break
      // Misc
      case "comb":
        steps = combSort(array)
        break
      case "bogo":
        steps = bogoSort(array)
        break
    }

    setSortingSteps(steps)
    setCurrentStep(0)
    setIsPlaying(true)
  }

  useEffect(() => {
    if (isPlaying && currentStep < sortingSteps.length) {
      const timer = setTimeout(
        () => {
          const newArray = sortingSteps[currentStep]
          setArray(newArray)
          playStepSounds(newArray)
          setCurrentStep((prev) => prev + 1)
        },
        Math.max(10, 200 - speed * 2),
      )

      return () => clearTimeout(timer)
    } else if (currentStep >= sortingSteps.length) {
      setIsPlaying(false)
    }
  }, [isPlaying, currentStep, sortingSteps, speed, isMuted, minValue, maxValue])

  useEffect(() => {
    generateArray()
  }, [generateArray])

  useEffect(() => {
    if (darkMode) {
      document.body.classList.add("dark")
    } else {
      document.body.classList.remove("dark")
    }
    return () => document.body.classList.remove("dark")
  }, [darkMode])

  const getBarColor = (element: ArrayElement) => {
    if (element.isSorted) return "bg-green-500"
    if (element.isSwapping) return "bg-red-500"
    if (element.isComparing) return "bg-yellow-500"
    return "bg-blue-500"
  }

  const maxArrayValue = Math.max(...array.map((el) => el.value))

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-gray-900 dark:to-gray-800 p-4 transition-colors">
      <div className="max-w-6xl mx-auto space-y-6">
        <Card className="dark:bg-gray-900 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-6 h-6" />
              Sorting Algorithm Visualizer
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-row gap-6 mb-6">
              <div className="flex flex-col gap-4 items-stretch">
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => setDarkMode((d) => !d)}
                  className="w-40"
                >
                  {darkMode ? "Light Mode" : "Dark Mode"}
                </Button>
              </div>
              <div className="flex-1">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  <div className="space-y-2">
                    <Label htmlFor="min">Min Value</Label>
                    <Input
                      id="min"
                      type="number"
                      value={minValue}
                      onChange={(e) => setMinValue(Number(e.target.value))}
                      disabled={isPlaying}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="max">Max Value</Label>
                    <Input
                      id="max"
                      type="number"
                      value={maxValue}
                      onChange={(e) => setMaxValue(Number(e.target.value))}
                      disabled={isPlaying}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="size">Array Size</Label>
                    <Input
                      id="size"
                      type="number"
                      min="5"
                      max={MAX_ARRAY_SIZE}
                      value={arraySize}
                      onChange={(e) => {
                        const val = Math.max(5, Math.min(Number(e.target.value), MAX_ARRAY_SIZE))
                        setArraySize(val)
                      }}
                      disabled={isPlaying}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="algorithm">Algorithm</Label>
                    <Select value={algorithm} onValueChange={setAlgorithm} disabled={isPlaying}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <div className="px-2 py-1 text-xs text-muted-foreground font-semibold">Quadratic Sorts</div>
                        <SelectItem value="bubble">Bubble Sort</SelectItem>
                        <SelectItem value="selection">Selection Sort</SelectItem>
                        <SelectItem value="insertion">Insertion Sort</SelectItem>
                        <SelectItem value="gnome">Gnome Sort</SelectItem>
                        <SelectItem value="cocktail">Cocktail Shaker Sort</SelectItem>
                        <div className="px-2 py-1 text-xs text-muted-foreground font-semibold">Logarithmic/Linearithmic Sorts</div>
                        <SelectItem value="merge">Merge Sort</SelectItem>
                        <SelectItem value="quick">Quick Sort</SelectItem>
                        <SelectItem value="heap">Heap Sort</SelectItem>
                        <SelectItem value="shell">Shell Sort</SelectItem>
                        <div className="px-2 py-1 text-xs text-muted-foreground font-semibold">Miscellaneous Sorts</div>
                        <SelectItem value="comb">Comb Sort</SelectItem>
                        <SelectItem value="bogo">Bogo Sort</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                {/* ...existing code for controls, legend, bars, and step counter... */}
                <div className="flex flex-wrap gap-4 mb-6">
                  <Button onClick={generateArray} disabled={isPlaying} variant="outline" size="lg">
                    <RotateCcw className="w-5 h-5 mr-2" />
                    Generate New Array
                  </Button>
                  <Button onClick={isPlaying ? () => setIsPlaying(false) : startSorting} disabled={array.length === 0} size="lg">
                    {isPlaying ? (
                      <>
                        <Pause className="w-5 h-5 mr-2" />
                        Pause
                      </>
                    ) : (
                      <>
                        <Play className="w-5 h-5 mr-2" />
                        Start Sorting
                      </>
                    )}
                  </Button>
                  <div className="flex items-center gap-2">
                    <Label htmlFor="speed" className="text-sm">
                      Speed:
                    </Label>
                    <Input
                      id="speed"
                      type="range"
                      min="1"
                      max="100"
                      value={speed}
                      onChange={(e) => setSpeed(Number(e.target.value))}
                      className="w-32"
                    />
                  </div>
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => setIsMuted(!isMuted)}
                    className="flex items-center gap-2"
                  >
                    {isMuted ? (
                      <>
                        <span className="text-lg">🔇</span>
                        <span>Unmute</span>
                      </>
                    ) : (
                      <>
                        <span className="text-lg">🔊</span>
                        <span>Mute</span>
                      </>
                    )}
                  </Button>
                </div>
                <div className="space-y-4">
                  {/* ...existing code... */}
                  <div className="bg-white dark:bg-gray-900 p-6 rounded-lg border dark:border-gray-700 min-h-[300px] flex items-end justify-center">
                    <div className="flex items-end gap-1 w-full justify-center">
                      {array.map((element, index) => {
                        const containerWidth = 800
                        const availableWidth = containerWidth - (array.length - 1) * 4
                        const barWidth = Math.min(Math.max(availableWidth / array.length, 8), 60)
                        // Always show numbers if barWidth >= 12, or if arraySize <= 30
                        const showNumbers = barWidth >= 12 || arraySize <= 30
                        const barHeight = Math.max((element.value / maxArrayValue) * 250, 10)

                        return (
                          <div
                            key={index}
                            className={`transition-all duration-300 ${getBarColor(element)} rounded-t-sm flex items-end justify-center text-white font-bold`}
                            style={{
                              height: `${barHeight}px`,
                              width: `${barWidth}px`,
                              fontSize: barWidth >= 25 ? "12px" : barWidth >= 15 ? "10px" : "8px",
                            }}
                          >
                            {showNumbers && <span className="mb-1 transform rotate-0 leading-none">{element.value}</span>}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                  {/* ...existing code... */}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
