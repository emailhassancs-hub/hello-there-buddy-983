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
  X,
  Calendar,
  Download,
  CheckCircle,
  AlertCircle,
  RefreshCw,
} from "lucide-react"

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
    const res = await apiFetch<any>(`/api/model-optimization/get-signed-url`, {
      method: "POST",
      body: { 
        model_name: modelName, 
        filename: file.name 
      },
    });
    
    const { s3_upload_url, asset_id } = res;

    if (!s3_upload_url) throw new Error("Failed to get signed URL");

    const uploadRes = await fetch(s3_upload_url, {
      method: "PUT",
      body: file,
      headers: {
        "Content-Type": "application/octet-stream",
      },
    });
    
    if (!uploadRes.ok) throw new Error("Upload failed");

    const completeRes = await apiFetch<any>(`/api/model-optimization/complete-upload/${asset_id}`, {
      method: "GET",
    });
    
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
  const [selectedModel, setSelectedModel] = useState<number | null>(null)
  const [optimizationType, setOptimizationType] = useState("")
  const [optimizationStrength, setOptimizationStrength] = useState("")
  const [optimizationRequests, setOptimizationRequests] = useState<OptimizationRequest[]>([])
  const [isOptimizing, setIsOptimizing] = useState(false)

  // API data states
  const [models, setModels] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [associatedModels, setAssociatedModels] = useState<AssociatedModelInfo[]>([])
  const [loadingAssociated, setLoadingAssociated] = useState(false)
  const [refreshingModels, setRefreshingModels] = useState(false)
  const [refreshingAssociated, setRefreshingAssociated] = useState(false)
  const [optimizationPresets, setOptimizationPresets] = useState<OptimizationPresets | null>(null)
  
  // Success notification state
  const [showSuccessNotification, setShowSuccessNotification] = useState(false)
  const [successMessage, setSuccessMessage] = useState({ title: "", description: "" })
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
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
      setHasMore(response.totalPages > 1)
      
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
      setHasMore(response.totalPages > 1)
      
      const currentSelectedModel = selectedModel
      if (convertedModels.length > 0) {
        if (currentSelectedModel && convertedModels.find(m => m.id === currentSelectedModel)) {
          setSelectedModel(currentSelectedModel)
        } else {
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
    const threshold = 50
    
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

  const getStrengthOptions = (type: string) => {
    if (!optimizationPresets) return []
    const presetOptions = optimizationPresets.presets[type] || []
    return presetOptions.map(option => option.text)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsOptimizing(true)

    try {
      if (optimizationRequests.length === 1) {
        const request = optimizationRequests[0]
        await optimizeModel(request.modelId, request.presetId, request.modelName)
      } else {
        await optimizeMultipleModels(optimizationRequests)
      }

      setOptimizationRequests([])
      
      setSuccessMessage({
        title: "Optimization Submitted!",
        description: "Your optimization request has been submitted successfully."
      })
      setShowSuccessNotification(true)
      setTimeout(() => {
        setShowSuccessNotification(false)
      }, 5000)
      
      if (selectedModel) {
        setTimeout(() => {
          refreshAssociatedModelsData(selectedModel.toString())
        }, 2000)
      }
    } catch (error) {
      console.error("Optimization failed:", error)
    } finally {
      setIsOptimizing(false)
    }
  }

  const handleModelUpload = async (file: File) => {
    if (!file) return
    
    setIsOptimizing(true)
    try {
      const modelName = file.name.split(".")[0]
      const result = await uploadModel(file, modelName)
      
      if (result.success) {
        setSuccessMessage({
          title: "Upload Complete!",
          description: "Your model has been uploaded successfully."
        })
        setShowSuccessNotification(true)
        setTimeout(() => {
          setShowSuccessNotification(false)
        }, 5000)
        
        await refreshModelsData()
      } else {
        throw new Error("Upload failed")
      }
    } catch (error) {
      console.error("Upload failed:", error)
    } finally {
      setIsOptimizing(false)
    }
  }

  const addOptimizationRequest = () => {
    if (optimizationType && optimizationStrength && selectedModel) {
      const selectedModelData = models.find((m) => m.id === selectedModel)
      
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
      }
    }
  }

  const removeOptimizationRequest = (id: string) => {
    setOptimizationRequests(optimizationRequests.filter((req) => req.id !== id))
  }

  const selectedModelData = models.find((m) => m.id === selectedModel)

  return (
    <div className="h-full bg-white text-black p-6 overflow-y-auto hide-scrollbar">
      <style>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
      
      <div className="max-w-7xl mx-auto">
        {/* Success Notification */}
        {showSuccessNotification && (
          <div className="mb-6 p-4 bg-black/10 border border-black/20 rounded-lg flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 bg-black rounded-full">
              <CheckCircle className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-black font-semibold">{successMessage.title}</h3>
              <p className="text-black/70 text-sm">{successMessage.description}</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSuccessNotification(false)}
              className="text-black/70 hover:text-black hover:bg-black/10"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Main Panel - No Card styling */}
        <div className="bg-white">
          <div className="pb-6">
            <div className="flex items-center justify-between text-2xl">
              <div className="flex items-center gap-2">
                <Settings className="h-6 w-6 text-black" />
                <span className="text-black font-semibold">Model Optimization</span>
              </div>
              <Button
                onClick={() => document.getElementById('model-file-input')?.click()}
                className="bg-black text-white hover:bg-black/90"
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload Model
              </Button>
              <input
                id="model-file-input"
                type="file"
                accept=".glb,.gltf,.fbx,.obj"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) handleModelUpload(file)
                }}
              />
            </div>
            <p className="text-black/60 mt-2">
              Optimize your 3D models for better performance
            </p>
          </div>
          
          <div className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Available Models and Optimized Versions */}
              <div className="grid grid-cols-2 gap-6">
                {/* Available Models */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-black text-sm font-medium">Available Models</Label>
                    <Button
                      type="button"
                      onClick={refreshModelsData}
                      disabled={loading || refreshingModels}
                      size="sm"
                      variant="outline"
                      className="border-black/20 text-black hover:bg-black/10 bg-transparent"
                    >
                      <RefreshCw className={`h-3 w-3 mr-1 ${loading || refreshingModels ? 'animate-spin' : ''}`} />
                      Refresh
                    </Button>
                  </div>
                  <div className="h-96 overflow-y-auto space-y-3 p-2 bg-black/5 rounded-lg border border-black/10 hide-scrollbar" onScroll={handleScroll}>
                    {loading || refreshingModels ? (
                      <div className="flex items-center justify-center h-full min-h-[300px]">
                        <Loader2 className="h-6 w-6 animate-spin text-black" />
                      </div>
                    ) : error ? (
                      <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-center">
                        <AlertCircle className="h-8 w-8 text-black mb-2" />
                        <p className="text-black/60 text-sm">{error}</p>
                        <Button
                          type="button"
                          onClick={refreshModelsData}
                          size="sm"
                          className="mt-2 bg-black text-white hover:bg-black/90"
                        >
                          Retry
                        </Button>
                      </div>
                    ) : models.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-center">
                        <FileIcon className="h-8 w-8 text-black/50 mb-2" />
                        <p className="text-black/60 text-sm">No models available</p>
                      </div>
                    ) : (
                      models.map((model) => (
                        <Card
                          key={model.id}
                          className={`cursor-pointer transition-all ${
                            selectedModel === model.id
                              ? "border-black bg-black/20"
                              : "border-black/10 hover:border-black/30 bg-black/5"
                          }`}
                          onClick={() => setSelectedModel(model.id)}
                        >
                          <CardContent className="p-3">
                            <div className="flex items-center gap-3">
                              <img
                                src={model.image || "/placeholder.svg"}
                                alt={model.name}
                                className="w-12 h-12 rounded-lg object-cover bg-black/10"
                              />
                              <div className="flex-1">
                                <h4 className="text-black font-medium text-sm">{model.name}</h4>
                                <div className="flex items-center gap-1 text-black/60 text-xs">
                                  <Calendar className="h-3 w-3" />
                                  {model.creationDate}
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    )}
                    
                    {loadingMore && (
                      <div className="flex items-center justify-center py-4">
                        <Loader2 className="h-5 w-5 animate-spin text-black" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Optimized Versions */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-black text-sm font-medium">Optimized Versions</Label>
                    {selectedModel && (
                      <Button
                        type="button"
                        onClick={() => refreshAssociatedModelsData(selectedModel.toString())}
                        disabled={loadingAssociated || refreshingAssociated}
                        size="sm"
                        variant="outline"
                        className="border-black/20 text-black hover:bg-black/10 bg-transparent"
                      >
                        <RefreshCw className={`h-3 w-3 mr-1 ${loadingAssociated || refreshingAssociated ? 'animate-spin' : ''}`} />
                        Refresh
                      </Button>
                    )}
                  </div>
                  <div className="h-96 overflow-y-auto space-y-3 p-2 bg-black/5 rounded-lg border border-black/10 hide-scrollbar">
                    {loadingAssociated ? (
                      <div className="flex items-center justify-center h-full min-h-[300px]">
                        <Loader2 className="h-6 w-6 animate-spin text-black" />
                      </div>
                    ) : !selectedModel ? (
                      <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-center">
                        <FileIcon className="h-8 w-8 text-black/50 mb-2" />
                        <p className="text-black/60 text-sm">Select a model to view optimized versions</p>
                      </div>
                    ) : associatedModels.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-center">
                        <FileIcon className="h-8 w-8 text-black/50 mb-2" />
                        <p className="text-black/60 text-sm">No optimized versions available</p>
                      </div>
                    ) : (
                      associatedModels.map((version) => (
                        <Card key={version.id} className="border-black/10 bg-black/5">
                          <CardContent className="p-3">
                            <div className="space-y-2">
                              <h4 className="text-black font-medium text-sm">{version.preset_name}</h4>
                              <p className="text-black/60 text-xs">Status: {version.optimization_status}</p>
                              <div className="flex gap-2 flex-wrap">
                                {version.downloads.glb && (
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleDownload(version.downloads.glb!, `${version.name}.glb`)}
                                    className="border-black/20 text-black hover:bg-black/10 bg-transparent"
                                  >
                                    <Download className="h-3 w-3 mr-1" />
                                    GLB
                                  </Button>
                                )}
                                {version.downloads.usdz && (
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleDownload(version.downloads.usdz!, `${version.name}.usdz`)}
                                    className="border-black/20 text-black hover:bg-black/10 bg-transparent"
                                  >
                                    <Download className="h-3 w-3 mr-1" />
                                    USDZ
                                  </Button>
                                )}
                                {version.downloads.fbx && (
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleDownload(version.downloads.fbx!, `${version.name}.fbx`)}
                                    className="border-black/20 text-black hover:bg-black/10 bg-transparent"
                                  >
                                    <Download className="h-3 w-3 mr-1" />
                                    FBX
                                  </Button>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Optimization Controls */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-black text-sm">Optimization Type</Label>
                  <Select value={optimizationType} onValueChange={setOptimizationType}>
                    <SelectTrigger className="bg-black/5 border-black/10 text-black">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-black/20">
                      {optimizationPresets && Object.keys(optimizationPresets.presets).map((type) => (
                        <SelectItem key={type} value={type} className="text-black hover:bg-black/10">
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-black text-sm">Optimization Strength</Label>
                  <Select 
                    value={optimizationStrength} 
                    onValueChange={setOptimizationStrength}
                    disabled={!optimizationType}
                  >
                    <SelectTrigger className="bg-black/5 border-black/10 text-black">
                      <SelectValue placeholder="Select strength" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-black/20">
                      {optimizationType && optimizationPresets && 
                        optimizationPresets.presets[optimizationType]?.map((option) => (
                          <SelectItem key={option.id} value={option.id} className="text-black hover:bg-black/10">
                            {option.text}
                          </SelectItem>
                        ))
                      }
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button
                type="button"
                onClick={addOptimizationRequest}
                disabled={!optimizationType || !optimizationStrength || !selectedModel}
                className="w-full bg-black text-white hover:bg-black/90"
              >
                Add to Queue
              </Button>

              {/* Optimization Queue */}
              {optimizationRequests.length > 0 && (
                <div className="space-y-3">
                  <Label className="text-black text-sm font-medium">Optimization Queue</Label>
                  <div className="space-y-2 p-3 bg-black/5 rounded-lg border border-black/10">
                    {optimizationRequests.map((request) => (
                      <div key={request.id} className="flex items-center justify-between p-2 bg-black/5 rounded border border-black/10">
                        <div>
                          <p className="text-black text-sm font-medium">{request.modelName}</p>
                          <p className="text-black/60 text-xs">{request.optimizationType} - {request.strength}</p>
                        </div>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => removeOptimizationRequest(request.id)}
                          className="text-black/70 hover:text-black hover:bg-black/10"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <Button
                type="submit"
                disabled={optimizationRequests.length === 0 || isOptimizing}
                className="w-full bg-black text-white hover:bg-black/90"
              >
                {isOptimizing ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Processing...
                  </>
                ) : (
                  "Optimize Models"
                )}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
