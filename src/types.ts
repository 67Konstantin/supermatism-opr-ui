export type CompositionAnalysis = {
  layout: string
  perspective: string
  symmetry: string
}

export type ColorAnalysis = {
  palette: string[]
  contrast: string
  saturation: string
  tonalTransitions: string
}

export type TextureAnalysis = {
  brushwork: string
  surface: string
  volumeModeling: string
}

export type AnalysisModel = {
  styleGuess: string
  summary: string
  composition: CompositionAnalysis
  color: ColorAnalysis
  texture: TextureAnalysis
  stylisticMarkers: string[]
}

export type ArtworkResult = {
  title: string
  artist: string
  similarity: number
  description: string
  imageUrl: string
  sourceUrl: string
}

export type AnalyzeArtResponse = {
  analysis: AnalysisModel
  results: ArtworkResult[]
}
