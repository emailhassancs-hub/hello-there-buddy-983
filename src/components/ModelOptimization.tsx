"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { apiFetch } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Loader2,
  Settings,
  Upload,
  FileIcon,
  Zap,
  HelpCircle,
  X,
  Calendar,
  Download,
  Clock,
  CheckCircle,
  AlertCircle,
  Play,
  RefreshCw,
  Server,
} from "lucide-react"

// Tooltip component for hints
function HintTooltip({ children, hint }: { children: React.ReactNode; hint: string }) {
  return (
    <div className="flex items-center gap-1">
      {children}
      <div className="relative group">
        <HelpCircle className="h-3 w-3 text-gray-500 hover:text-gray-300 cursor-help" />
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10 border border-gray-700">
          {hint}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-800"></div>
        </div>
      </div>
    </div>
  )
}

// API types
interface ModelInfo {
  assetId: string
  fileName: string
  tags: string
  createdAt: string
  thumbnailUrl?: string
}

interface AssociatedModelInfo {
  id: string
  name: string
  preset_name: string
  optimization_status: string
  created_at: string
  downloads: {
    glb?: string
    usdz?: string
    fbx?: string
  }
}

interface ModelsResponse {
  models: ModelInfo[]
  totalPages: number
  total: number
}

interface AssociatedModelsResponse {
  models: AssociatedModelInfo[]
}

interface PresetOption {
  text: string
  id: string
}

interface OptimizationPresets {
  presets: Record<string, PresetOption[]>
}

interface OptimizationRequest {
  id: string
  modelName: string
  optimizationType: string
  strength: string
  modelId: string
  presetId: string
}

interface RunningTask {
  id: string
  modelName: string
  optimizationType: string
  strength: string
  status: "queued" | "processing" | "completed" | "failed"
  progress?: number
  startTime: Date
}

// New types for polling system
interface OptimizationJob {
  asset_id?: number
  model_name?: string
  status?: string
  progress?: number
  started_at?: string
  preset?: Record<string, any>
  task_type: string
}

interface RunningJobsResponse {
  status: string
  jobs: OptimizationJob[]
  total_count: number
}

// API functions
async function fetchModels(page: number = 1, perPage: number = 10): Promise<ModelsResponse> {
  return apiFetch<ModelsResponse>(`/api/model-optimization/models?page=${page}&per_page=${perPage}`)
}

async function fetchAssociatedModels(baseModelId: string): Promise<AssociatedModelsResponse> {
  return apiFetch<AssociatedModelsResponse>(`/api/model-optimization/models/${baseModelId}/associated`)
}

async function fetchOptimizationPresets(): Promise<OptimizationPresets> {
  return apiFetch<OptimizationPresets>(`/api/model-optimization/presets`)
}

async function optimizeModel(modelId: string, presetId: string, exportName: string): Promise<any> {
  return apiFetch<any>(`/api/model-optimization/optimize/single`, {
    method: 'POST',
    body: {
      model_id: modelId,
      config: {
        preset_id: presetId,
        exportName: exportName
      }
    }
  })
}

async function optimizeMultipleModels(optimizations: OptimizationRequest[]): Promise<any> {
  return apiFetch<any>(`/api/model-optimization/optimize/multiple`, {
    method: 'POST',
    body: {
      optimizations: optimizations.map(opt => ({
        model_id: opt.modelId,
        config: {
          preset_id: opt.presetId,
          exportName: opt.modelName
        }
      }))
    }
  })
}

async function uploadModel(file: File, modelName: string): Promise<any> {
  try {
    // 1. Get signed URL from backend (API key handled securely)
    const res = await apiFetch<any>(`/api/model-optimization/get-signed-url`, {
      method: "POST",
      body: { 
        model_name: modelName, 
        filename: file.name 
      },
    });
    
    const { s3_upload_url, asset_id } = res;
    console.log("Signed URL response:", { s3_upload_url, asset_id });

    if (!s3_upload_url) throw new Error("Failed to get signed URL");

    // 2. Upload file to signed URL (frontend handles this)
    console.log("Uploading file to S3 URL:", s3_upload_url, "File:", file);
    const uploadRes = await fetch(s3_upload_url, {
      method: "PUT",
      body: file,
      headers: {
        "Content-Type": "application/octet-stream",
      },
    });
    console.log("Upload response status:", uploadRes.status, "statusText:", uploadRes.statusText);
    if (!uploadRes.ok) throw new Error("Upload failed");

    // 3. Complete upload via backend (API key handled securely)
    console.log("Calling complete upload via backend");
    const completeRes = await apiFetch<any>(`/api/model-optimization/complete-upload/${asset_id}`, {
      method: "GET",
    });
    
    console.log("Complete upload response:", completeRes);
    if (completeRes) {
      return { success: true, asset_id, message: "Upload completed successfully" };
    } else {
      throw new Error("Upload succeeded, but completion failed.");
    }

  } catch (error) {
    console.error("Upload error:", error);
    throw error;
  }
}

// New function to fetch running optimization jobs
async function fetchRunningJobs(): Promise<RunningJobsResponse> {
  return apiFetch<RunningJobsResponse>(`/api/model-optimization/running-jobs`)
}

// Convert API model to component model
function convertApiModelToComponentModel(apiModel: ModelInfo, associatedModels: AssociatedModelInfo[] = []) {
  return {
    id: parseInt(apiModel.assetId),
    name: apiModel.fileName,
    image: apiModel.thumbnailUrl || "/placeholder.svg?height=100&width=100",
    creationDate: new Date(apiModel.createdAt).toLocaleDateString(),
    optimizedVersions: associatedModels.map(model => ({
      id: parseInt(model.id),
      name: `${model.preset_name} - ${model.optimization_status}`,
      type: model.preset_name,
      downloads: model.downloads
    }))
  }
}

export default function ModelOptimization({ isActive = false }: { isActive?: boolean }) {
  const [activeTab, setActiveTab] = useState<"optimize" | "upload">("optimize")
  const [selectedModel, setSelectedModel] = useState<number | null>(null)
  const [optimizationType, setOptimizationType] = useState("")
  const [optimizationStrength, setOptimizationStrength] = useState("")
  const [optimizationRequests, setOptimizationRequests] = useState<OptimizationRequest[]>([])
  const [runningTasks, setRunningTasks] = useState<RunningTask[]>([])
  const [formData, setFormData] = useState({
    uploadedModel: null as File | null,
  })
  const [isOptimizing, setIsOptimizing] = useState(false)

  // New state for API data
  const [models, setModels] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [associatedModels, setAssociatedModels] = useState<AssociatedModelInfo[]>([])
  const [loadingAssociated, setLoadingAssociated] = useState(false)
  const [refreshingModels, setRefreshingModels] = useState(false)
  const [refreshingAssociated, setRefreshingAssociated] = useState(false)
  const [optimizationPresets, setOptimizationPresets] = useState<OptimizationPresets | null>(null)
  
  // Upload notification state
  const [showUploadNotification, setShowUploadNotification] = useState(false)
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)

  // Fetch models on component mount
  useEffect(() => {
    fetchModelsData()
  }, [])

  // Fetch associated models when selected model changes
  useEffect(() => {
    if (selectedModel) {
      fetchAssociatedModelsData(selectedModel.toString())
    } else {
      setAssociatedModels([])
    }
  }, [selectedModel])

  // Fetch optimization presets
  useEffect(() => {
    fetchOptimizationPresetsData()
  }, [])

  // Run polling once when switching to this tab or between optimize/upload tabs
  useEffect(() => {
    const runInitialPolling = async () => {
      try {
        console.log("Running initial polling check...")
        const response = await fetchRunningJobs()
        const runningJobs = response.jobs

        console.log("Initial polling found jobs:", runningJobs)

        if (runningJobs.length === 0) {
          console.log("No running jobs found in initial check, stopping polling")
          return
        }

        // Convert running jobs to tasks if we have any
        const newTasks: RunningTask[] = runningJobs.map((job) => ({
          id: `task-${Date.now()}-${Math.random()}`,
          modelName: job.model_name || "Unknown Model",
          optimizationType: job.preset?.name || "Optimization",
          strength: "Standard",
          status: "processing" as const,
          startTime: new Date(),
        }))

        console.log("Creating tasks from initial polling:", newTasks)
        setRunningTasks(newTasks)
      } catch (error) {
        console.error("Error in initial polling:", error)
      }
    }

    // Only run initial polling when component is active
    if (isActive) {
      runInitialPolling()
    }
  }, [activeTab, isActive]) // Depend on activeTab and isActive to run when switching tabs or becoming active

  // Function to handle direct downloads
  const handleDownload = async (url: string, filename: string) => {
    try {
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const blob = await response.blob()
      const downloadUrl = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = downloadUrl
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(downloadUrl)
    } catch (error) {
      console.error('Download failed:', error)
      // Fallback to opening in new tab if direct download fails
      window.open(url, '_blank')
    }
  }

  const fetchModelsData = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetchModels(1, 10)
      const convertedModels = response.models.map(model => convertApiModelToComponentModel(model))
      setModels(convertedModels)
      setCurrentPage(1)
      setTotalPages(response.totalPages)
      setTotalItems(response.total)
      setHasMore(response.totalPages > 1)
      
      // Auto-select first model if available and no model is currently selected
      if (convertedModels.length > 0 && !selectedModel) {
        setSelectedModel(convertedModels[0].id)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch models")
      console.error("Error fetching models:", err)
    } finally {
      setLoading(false)
    }
  }

  const loadMoreModels = async () => {
    if (loadingMore || !hasMore) return
    
    try {
      setLoadingMore(true)
      const nextPage = currentPage + 1
      const response = await fetchModels(nextPage, 10)
      const newConvertedModels = response.models.map(model => convertApiModelToComponentModel(model))
      
      setModels(prev => [...prev, ...newConvertedModels])
      setCurrentPage(nextPage)
      setHasMore(nextPage < response.totalPages)
    } catch (err) {
      console.error("Error loading more models:", err)
    } finally {
      setLoadingMore(false)
    }
  }

  const refreshModelsData = async () => {
    try {
      setRefreshingModels(true)
      setError(null)
      const response = await fetchModels(1, 10)
      const convertedModels = response.models.map(model => convertApiModelToComponentModel(model))
      setModels(convertedModels)
      setCurrentPage(1)
      setTotalPages(response.totalPages)
      setTotalItems(response.total)
      setHasMore(response.totalPages > 1)
      
      // Keep the currently selected model if it still exists in the new list
      const currentSelectedModel = selectedModel
      if (convertedModels.length > 0) {
        if (currentSelectedModel && convertedModels.find(m => m.id === currentSelectedModel)) {
          // Keep the current selection
          setSelectedModel(currentSelectedModel)
        } else {
          // Select first model if current selection is no longer available
          setSelectedModel(convertedModels[0].id)
        }
      } else {
        setSelectedModel(null)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch models")
      console.error("Error fetching models:", err)
    } finally {
      setRefreshingModels(false)
    }
  }

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget
    const threshold = 50 // pixels from bottom
    
    if (scrollHeight - scrollTop - clientHeight < threshold && hasMore && !loadingMore) {
      loadMoreModels()
    }
  }

  const fetchAssociatedModelsData = async (baseModelId: string) => {
    try {
      setLoadingAssociated(true)
      const response = await fetchAssociatedModels(baseModelId)
      setAssociatedModels(response.models)
    } catch (err) {
      console.error("Error fetching associated models:", err)
      setAssociatedModels([])
      // Clear optimized versions for this model if fetch fails
    } finally {
      setLoadingAssociated(false)
    }
  }

  const refreshAssociatedModelsData = async (baseModelId: string) => {
    try {
      setRefreshingAssociated(true)
      const response = await fetchAssociatedModels(baseModelId)
      setAssociatedModels(response.models)
    } catch (err) {
      console.error("Error fetching associated models:", err)
      setAssociatedModels([])
      // Clear optimized versions for this model if fetch fails
    } finally {
      setRefreshingAssociated(false)
    }
  }

  const fetchOptimizationPresetsData = async () => {
    try {
      const response = await fetchOptimizationPresets()
      setOptimizationPresets(response)
    } catch (err) {
      console.error("Error fetching optimization presets:", err)
      setOptimizationPresets(null)
    }
  }

  // Real polling for optimization status
  useEffect(() => {
    if (runningTasks.length === 0) {
      return
    }

    const pollInterval = setInterval(async () => {
      try {
        const response = await fetchRunningJobs()
        const runningJobs = response.jobs

        console.log("Polling running jobs:", runningJobs)

        if (runningJobs.length === 0) {
          console.log("No running jobs found, stopping polling")
          if (selectedModel) {
            refreshAssociatedModelsData(selectedModel.toString())
          }
          // Mark all remaining tasks as completed and stop polling
          setRunningTasks((prevTasks) => {
            const completedTasks = prevTasks.map(task => ({
              ...task,
              status: "completed" as const
            }))
            console.log(`Marked ${completedTasks.length} tasks as completed`)
            return []
          })
          return
        }

        // Update tasks based on running jobs
        setRunningTasks((prevTasks) => {
          const updatedTasks = prevTasks.map((task) => {
            // Find matching job by model name
            const matchingJob = runningJobs.find(job => job.model_name === task.modelName)
            
            if (matchingJob) {
              // Job is still running
              let newStatus: "queued" | "processing" | "completed" | "failed"
              
              if (matchingJob.status === "finished") {
                newStatus = "completed"
              } else if (matchingJob.status === "failed") {
                newStatus = "failed"
              } else if (["executing", "processing", "running", "in_progress"].includes(matchingJob.status || "")) {
                newStatus = "processing"
              } else {
                newStatus = "queued"
              }
              
              console.log(`Task ${task.modelName} still running with status: ${newStatus}`)
              
              return {
                ...task,
                status: newStatus,
                progress: matchingJob.progress
              }
            } else {
              // Job not found in running jobs - mark as completed
              console.log(`Task ${task.modelName} not found in running jobs, marking as completed`)
              return {
                ...task,
                status: "completed" as const
              }
            }
          })
          
          // Remove completed and failed tasks from the list
          const activeTasks = updatedTasks.filter(task => 
            task.status !== "completed" && task.status !== "failed"
          )
          
          console.log(`Removed ${updatedTasks.length - activeTasks.length} completed/failed tasks`)
          
          return activeTasks
        })
      } catch (error) {
        console.error("Error polling running jobs:", error)
      }
    }, 5000) // Poll every 5 seconds

    return () => clearInterval(pollInterval)
  }, [runningTasks.length])

  // Optimization strength options based on type
  const getStrengthOptions = (type: string) => {
    if (!optimizationPresets) return []
    const presetOptions = optimizationPresets.presets[type] || []
    return presetOptions.map(option => option.text)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsOptimizing(true)

    try {
      if (activeTab === "upload") {
        // Handle upload case
        if (!formData.uploadedModel) {
          throw new Error("No file selected for upload")
        }

        const modelName = formData.uploadedModel.name.split(".")[0]
        const result = await uploadModel(formData.uploadedModel, modelName)
        
        if (result.success) {
          // Clear the uploaded file
          refreshModelsData()
          updateFormData("uploadedModel", null)
          console.log("Upload successful:", result)
          // Stop the rotator immediately after successful upload
          setIsOptimizing(false)
          // Show upload notification
          setShowUploadNotification(true)
          // Hide notification after 5 seconds
          setTimeout(() => {
            setShowUploadNotification(false)
          }, 5000)
        } else {
          throw new Error("Upload failed")
        }
      } else {
        // Handle optimization case - first submit optimization requests, then fetch running jobs
        console.log("Submitting optimization requests...")
        
        // Convert optimization requests to running tasks
        const newTasks: RunningTask[] = optimizationRequests.map((request) => ({
          id: `task-${Date.now()}-${Math.random()}`,
          modelName: request.modelName,
          optimizationType: request.optimizationType,
          strength: request.strength,
          status: "processing" as const, // Start as processing instead of queued
          startTime: new Date(),
        }))

        console.log("Creating new tasks:", newTasks)
        setRunningTasks((prevTasks) => [...prevTasks, ...newTasks])

        // Call the optimization API
        if (optimizationRequests.length === 1) {
          // Single optimization
          const request = optimizationRequests[0]
          console.log("Submitting single optimization request...")
          
          try {
            const result = await optimizeModel(request.modelId, request.presetId, request.modelName)
            console.log("Single optimization result:", result)
            
            if (result.success) {
              console.log("Optimization submitted successfully")
            } else {
              console.log("Optimization API returned failure, but letting polling handle status")
            }
          } catch (error) {
            console.error("Optimization API error:", error)
            console.log("API call failed, but letting polling handle status")
          }
        } else {
          // Multiple optimizations
          console.log("Submitting multiple optimization requests...")
          
          try {
            const result = await optimizeMultipleModels(optimizationRequests)
            console.log("Multiple optimization result:", result)
            
            if (result.success) {
              console.log("Multiple optimizations submitted successfully")
            } else {
              console.log("Multiple optimizations API returned failure, but letting polling handle status")
            }
          } catch (error) {
            console.error("Multiple optimization API error:", error)
            console.log("API call failed, but letting polling handle status")
          }
        }

        setOptimizationRequests([]) // Clear the requests after submitting
      }
    } catch (error) {
      console.error(activeTab === "upload" ? "Upload failed:" : "Optimization failed:", error)
      
      if (activeTab === "upload") {
        // Stop the rotator for upload errors
        setIsOptimizing(false)
      } else if (activeTab === "optimize") {
        // Don't mark tasks as failed - let polling handle status
        console.log("Error occurred, but letting polling handle task status")
      }
    } finally {
      // Only stop rotator for optimization (let polling handle it)
      if (activeTab === "optimize") {
        setIsOptimizing(false)
      }
    }
  }

  const updateFormData = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleModelUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      updateFormData("uploadedModel", file)
    }
  }

  const addOptimizationRequest = () => {
    if (optimizationType && optimizationStrength && selectedModel) {
      const selectedModelData = models.find((m) => m.id === selectedModel)
      
      // Find the preset text for display
      const presetOptions = optimizationPresets?.presets[optimizationType] || []
      const selectedPreset = presetOptions.find(option => option.id === optimizationStrength)
      
      if (selectedModelData && selectedPreset) {
        const newRequest: OptimizationRequest = {
          id: Date.now().toString(),
          modelName: selectedModelData.name,
          optimizationType,
          strength: selectedPreset.text,
          modelId: selectedModelData.id.toString(),
          presetId: selectedPreset.id
        }
        setOptimizationRequests(prev => [...prev, newRequest])
        setOptimizationType("")
        setOptimizationStrength("")
      } else {
        console.error("Could not find preset for:", { optimizationType, optimizationStrength, selectedPreset })
      }
    } else {
      console.log("Missing required values:", { optimizationType, optimizationStrength, selectedModel })
    }
  }

  const removeOptimizationRequest = (id: string) => {
    setOptimizationRequests(optimizationRequests.filter((req) => req.id !== id))
  }

  const getStatusIcon = (status: RunningTask["status"]) => {
    switch (status) {
      case "queued":
        return <Clock className="h-4 w-4 text-yellow-500" />
      case "processing":
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "failed":
        return <AlertCircle className="h-4 w-4 text-red-500" />
    }
  }

  const getStatusText = (status: RunningTask["status"]) => {
    switch (status) {
      case "queued":
        return "Queued"
      case "processing":
        return "Processing"
      case "completed":
        return "Completed"
      case "failed":
        return "Failed"
    }
  }

  const getStatusColor = (status: RunningTask["status"]) => {
    switch (status) {
      case "queued":
        return "text-yellow-500"
      case "processing":
        return "text-blue-500"
      case "completed":
        return "text-green-500"
      case "failed":
        return "text-red-500"
    }
  }

  const selectedModelData = models.find((m) => m.id === selectedModel)

  return (
    <div className="p-6">
      <div className="max-w-5xl mx-auto">
        {/* Upload Success Notification */}
        {showUploadNotification && (
          <div className="mb-6 p-4 bg-green-900/50 border border-green-700 rounded-lg flex items-center gap-3 animate-in fade-in-0 slide-in-from-top-2">
            <div className="flex items-center justify-center w-10 h-10 bg-green-600 rounded-full">
              <Server className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-green-300 font-semibold">Upload Complete!</h3>
              <p className="text-green-200 text-sm">Your model has been uploaded and is now processing on the server.</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowUploadNotification(false)}
              className="text-green-300 hover:text-green-100 hover:bg-green-800/50"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Form Section */}
        <Card className="shadow-xl border border-gray-800 bg-gray-900/95 backdrop-blur-sm">
          <CardHeader className="pb-6">
            <CardTitle className="flex items-center gap-2 text-2xl">
                              <Settings className="h-6 w-6 text-v0-purple" />
              Optimization Settings
            </CardTitle>
            <CardDescription className="text-gray-400">Configure your 3D model optimization parameters</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Input Type Tabs */}
              <div className="space-y-4">
                <HintTooltip hint="Choose between automatic optimization or upload your own model">
                  <Label className="text-gray-200 text-sm font-medium">Optimization Type</Label>
                </HintTooltip>
                <div className="flex gap-2 p-1 bg-gray-800 rounded-lg border border-gray-700">
                  <button
                    type="button"
                    onClick={() => setActiveTab("optimize")}
                                        className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                      activeTab === "optimize"
                        ? "bg-gradient-to-r from-v0-purple to-v0-blue text-white shadow-sm"
                        : "text-gray-400 hover:text-gray-200 hover:bg-gray-700"
                    }`}
                  >
                    <Zap className="h-4 w-4" />
                    Auto Optimize
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab("upload")}
                                        className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                      activeTab === "upload"
                        ? "bg-gradient-to-r from-v0-purple to-v0-blue text-white shadow-sm"
                        : "text-gray-400 hover:text-gray-200 hover:bg-gray-700"
                    }`}
                  >
                    <Upload className="h-4 w-4" />
                    Upload Model
                  </button>
                </div>
              </div>

              {/* Tab Content */}
              <div className="space-y-6">
                {activeTab === "optimize" && (
                  <div className="space-y-6">
                    {/* Available Models and Optimized Versions */}
                    <div className="grid grid-cols-2 gap-6">
                      {/* Available Models */}
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <HintTooltip hint="Select a model to view its optimization options">
                            <Label className="text-gray-200 text-sm font-medium">Available Models</Label>
                          </HintTooltip>
                          <Button
                            onClick={refreshModelsData}
                            disabled={loading || refreshingModels}
                            size="sm"
                            variant="outline"
                            className="border-gray-600 text-gray-300 hover:bg-gray-700 bg-transparent"
                          >
                            <RefreshCw className={`h-3 w-3 mr-1 ${loading || refreshingModels ? 'animate-spin' : ''}`} />
                            Refresh
                          </Button>
                        </div>
                        <div className="h-96 overflow-y-auto space-y-3 p-2 bg-gray-800 rounded-lg border border-gray-700" onScroll={handleScroll}>
                          {loading || refreshingModels ? (
                            <div className="flex items-center justify-center h-full min-h-[300px]">
                              <Loader2 className="h-6 w-6 animate-spin text-v0-blue" />
                            </div>
                          ) : error ? (
                            <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-center">
                              <AlertCircle className="h-8 w-8 text-red-500 mb-2" />
                              <p className="text-red-400 text-sm">{error}</p>
                              <Button
                                onClick={refreshModelsData}
                                size="sm"
                                className="mt-2 bg-v0-blue hover:bg-v0-blue/80"
                              >
                                Retry
                              </Button>
                            </div>
                          ) : models.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-center">
                              <FileIcon className="h-8 w-8 text-gray-500 mb-2" />
                              <p className="text-gray-400 text-sm">No models available</p>
                            </div>
                          ) : (
                            models.map((model) => (
                              <Card
                                key={model.id}
                                                              className={`cursor-pointer transition-all ${
                                selectedModel === model.id
                                  ? "border-v0-purple bg-v0-purple/10"
                                  : "border-gray-700 hover:border-gray-600"
                              }`}
                                onClick={() => setSelectedModel(model.id)}
                              >
                                <CardContent className="p-3">
                                  <div className="flex items-center gap-3">
                                    <img
                                      src={model.image || "/placeholder.svg"}
                                      alt={model.name}
                                      className="w-12 h-12 rounded-lg object-cover bg-gray-700"
                                    />
                                    <div className="flex-1">
                                      <h4 className="text-white font-medium text-sm">{model.name}</h4>
                                      <div className="flex items-center gap-1 text-gray-400 text-xs">
                                        <Calendar className="h-3 w-3" />
                                        {model.creationDate}
                                      </div>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            ))
                          )}
                          
                          {/* Loading more indicator */}
                          {loadingMore && (
                            <div className="flex items-center justify-center py-4">
                              <Loader2 className="h-5 w-5 animate-spin text-v0-blue" />
                              <span className="ml-2 text-gray-400 text-sm">Loading more models...</span>
                            </div>
                          )}
                          
                          {/* End of list indicator */}
                          {!hasMore && models.length > 0 && (
                            <div className="text-center py-4">
                              <span className="text-gray-500 text-xs">No more models to load</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Optimized Versions */}
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <HintTooltip hint="View optimized versions of the selected model">
                            <Label className="text-gray-200 text-sm font-medium">Optimized Versions</Label>
                          </HintTooltip>
                          <Button
                            onClick={() => selectedModel && refreshAssociatedModelsData(selectedModel.toString())}
                            disabled={loadingAssociated || refreshingAssociated || !selectedModel}
                            size="sm"
                            variant="outline"
                            className="border-gray-600 text-gray-300 hover:bg-gray-700 bg-transparent"
                          >
                            <RefreshCw className={`h-3 w-3 mr-1 ${loadingAssociated || refreshingAssociated ? 'animate-spin' : ''}`} />
                            Refresh
                          </Button>
                        </div>
                        <div className="h-96 overflow-y-auto space-y-3 p-2 bg-gray-800 rounded-lg border border-gray-700">
                          {loadingAssociated || refreshingAssociated ? (
                            <div className="flex items-center justify-center h-full min-h-[300px]">
                              <Loader2 className="h-6 w-6 animate-spin text-v0-blue" />
                            </div>
                          ) : associatedModels.length > 0 ? (
                            associatedModels.map((assocModel) => {
                              const version = {
                                id: parseInt(assocModel.id),
                                name: `${assocModel.preset_name} - ${assocModel.optimization_status}`,
                                type: assocModel.preset_name,
                                downloads: assocModel.downloads
                              }
                              return (
                                <Card key={version.id} className="border-gray-700">
                                  <CardContent className="p-3">
                                    <div className="space-y-3">
                                      <h4 className="text-white font-medium text-sm">{version.name}</h4>
                                      <div className="flex gap-2">
                                        {version.downloads?.fbx && (
                                          <Button
                                            size="sm"
                                            variant="outline"
                                            className="border-gray-600 text-gray-300 hover:bg-gray-700 bg-transparent text-xs"
                                            onClick={() => handleDownload(version.downloads.fbx!, `optimized_${version.name}.fbx`)}
                                          >
                                            <Download className="h-3 w-3 mr-1" />
                                            FBX
                                          </Button>
                                        )}
                                        {version.downloads?.glb && (
                                          <Button
                                            size="sm"
                                            variant="outline"
                                            className="border-gray-600 text-gray-300 hover:bg-gray-700 bg-transparent text-xs"
                                            onClick={() => handleDownload(version.downloads.glb!, `optimized_${version.name}.glb`)}
                                          >
                                            <Download className="h-3 w-3 mr-1" />
                                            GLB
                                          </Button>
                                        )}
                                        {version.downloads?.usdz && (
                                          <Button
                                            size="sm"
                                            variant="outline"
                                            className="border-gray-600 text-gray-300 hover:bg-gray-700 bg-transparent text-xs"
                                            onClick={() => handleDownload(version.downloads.usdz!, `optimized_${version.name}.usdz`)}
                                          >
                                            <Download className="h-3 w-3 mr-1" />
                                            USDZ
                                          </Button>
                                        )}
                                        {(!version.downloads?.fbx && !version.downloads?.glb && !version.downloads?.usdz) && (
                                          <span className="text-gray-500 text-xs">No downloads available</span>
                                        )}
                                      </div>
                                    </div>
                                  </CardContent>
                                </Card>
                              )
                            })
                          ) : (
                            <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-center">
                              <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mb-4">
                                <Settings className="h-8 w-8 text-gray-500" />
                              </div>
                              <p className="text-gray-400 text-sm">No optimized versions available</p>
                              <p className="text-gray-500 text-xs mt-1">
                                Select a model to view its optimization options
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Optimization Form */}
                    <div className="space-y-4 p-4 bg-gray-800 rounded-lg border border-gray-700">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <HintTooltip hint="Select the type of optimization to apply">
                            <Label className="text-gray-200 text-sm font-medium">Optimization Type</Label>
                          </HintTooltip>
                          <Select value={optimizationType} onValueChange={setOptimizationType}>
                            <SelectTrigger className="bg-gray-800 border-gray-700 text-white focus:border-v0-purple focus:ring-v0-purple/20">
                              <SelectValue placeholder="Select optimization type" />
                            </SelectTrigger>
                            <SelectContent className="bg-gray-800 border-gray-700">
                              {optimizationPresets && Object.keys(optimizationPresets.presets).map(type => (
                                <SelectItem
                                  key={type}
                                  value={type}
                                  className="text-white hover:bg-gray-700 focus:bg-gray-700"
                                >
                                  {type}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <HintTooltip hint="Select the optimization strength">
                            <Label className="text-gray-200 text-sm font-medium">Optimization Strength</Label>
                          </HintTooltip>
                          <Select
                            value={optimizationStrength}
                            onValueChange={setOptimizationStrength}
                            disabled={!optimizationType}
                          >
                            <SelectTrigger className="bg-gray-800 border-gray-700 text-white focus:border-v0-purple focus:ring-v0-purple/20">
                              <SelectValue placeholder="Select strength" />
                            </SelectTrigger>
                            <SelectContent className="bg-gray-800 border-gray-700">
                              {optimizationType && optimizationPresets?.presets[optimizationType]?.map((option) => (
                                <SelectItem
                                  key={option.id}
                                  value={option.id}
                                  className="text-white hover:bg-gray-700 focus:bg-gray-700"
                                >
                                  {option.text}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <Button
                        type="button"
                        onClick={addOptimizationRequest}
                        disabled={!optimizationType || !optimizationStrength || !selectedModel}
                        className="w-full bg-gradient-to-r from-v0-purple to-v0-blue text-white"
                      >
                        Select Optimization Settings
                      </Button>
                    </div>

                    {/* Optimization Requests */}
                    {/* Selected Optimizations - Always visible with placeholder */}
                    <div className="space-y-4">
                      <Label className="text-gray-200 text-sm font-medium">Selected Optimizations</Label>
                      <div className="min-h-[200px] max-h-80 overflow-y-auto space-y-3 p-4 bg-gray-800 rounded-lg border border-gray-700">
                        {optimizationRequests.length === 0 ? (
                          <div className="flex flex-col items-center justify-center h-40 text-center">
                            <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mb-4">
                              <Settings className="h-8 w-8 text-gray-500" />
                            </div>
                            <p className="text-gray-400 text-sm">No optimizations selected</p>
                            <p className="text-gray-500 text-xs mt-1">
                              Click "Select Optimization Settings" to add optimizations
                            </p>
                          </div>
                        ) : (
                          optimizationRequests
                            .slice()
                            .reverse()
                            .map((request) => (
                              <Card key={request.id} className="border-gray-700">
                                <CardContent className="p-4">
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <h4 className="text-white font-medium">{request.modelName}</h4>
                                      <p className="text-gray-400 text-sm">
                                        {request.optimizationType} - {request.strength}
                                      </p>
                                    </div>
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      onClick={() => removeOptimizationRequest(request.id)}
                                      className="border-red-600 text-red-400 hover:bg-red-600 hover:text-white"
                                    >
                                      <X className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </CardContent>
                              </Card>
                            ))
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === "upload" && (
                  <div className="space-y-4">
                    <HintTooltip hint="Upload a 3D model file that you want to optimize">
                      <Label className="text-gray-200 text-sm font-medium">Upload 3D Model</Label>
                    </HintTooltip>
                    <div className="border-2 border-dashed border-gray-700 rounded-lg p-8 text-center hover:border-gray-600 transition-colors">
                      <input
                        type="file"
                        id="modelUpload"
                        accept=".glb,.gltf,.fbx,.obj"
                        onChange={handleModelUpload}
                        className="hidden"
                      />
                      <label htmlFor="modelUpload" className="cursor-pointer flex flex-col items-center gap-4">
                        <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center">
                          <Upload className="h-8 w-8 text-gray-400" />
                        </div>
                        <div>
                          <p className="text-gray-200 font-medium">Upload 3D Model</p>
                          <p className="text-gray-500 text-sm">Supports GLB, GLTF, FBX, OBJ</p>
                                                        <p className="text-v0-blue text-xs mt-1">Maximum file size: 2GB</p>
                        </div>
                      </label>
                    </div>

                    {formData.uploadedModel && (
                      <div className="flex items-center gap-3 p-3 bg-gray-800 rounded-lg border border-gray-700">
                        <FileIcon className="h-5 w-5 text-v0-purple" />
                        <span className="text-gray-200 text-sm flex-1">{formData.uploadedModel.name}</span>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => updateFormData("uploadedModel", null)}
                          className="border-gray-600 text-gray-400 hover:bg-gray-700 bg-transparent"
                        >
                          Remove
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                                  className="w-full h-12 text-lg font-medium bg-gradient-to-r from-v0-purple to-v0-blue text-white border-0"
                disabled={
                  isOptimizing ||
                  (activeTab === "upload" && !formData.uploadedModel) ||
                  (activeTab === "optimize" && optimizationRequests.length === 0)
                }
              >
                {isOptimizing ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    {activeTab === "upload" ? "Uploading Model..." : "Optimizing Models..."}
                  </>
                ) : (
                  <>
                    {activeTab === "upload" ? (
                      <Upload className="mr-2 h-5 w-5" />
                    ) : (
                      <Settings className="mr-2 h-5 w-5" />
                    )}
                    {activeTab === "upload" ? "Upload Model" : "Optimize Models"}
                  </>
                )}
              </Button>
            </form>

            {/* Running Tasks Section */}
            {runningTasks.length > 0 && (
              <div className="space-y-4 pt-6 border-t border-gray-700">
                <div className="flex items-center gap-2">
                                          <Play className="h-5 w-5 text-v0-purple" />
                  <Label className="text-gray-200 text-lg font-medium">Running Tasks</Label>
                </div>
                <div className="max-h-64 overflow-y-auto space-y-3 p-2 bg-gray-800 rounded-lg border border-gray-700">
                  {runningTasks
                    .slice()
                    .reverse()
                    .map((task) => (
                      <Card key={task.id} className="border-gray-700">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <h4 className="text-white font-medium">{task.modelName}</h4>
                              <p className="text-gray-400 text-sm">
                                {task.optimizationType} - {task.strength}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              {getStatusIcon(task.status)}
                              <span className={`text-sm font-medium ${getStatusColor(task.status)}`}>
                                {getStatusText(task.status)}
                              </span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}