export interface UploadedAsset {
  url: string
  name?: string
  mimeType?: string
  size?: number
  alt?: string
}

export interface EditorAssetUploadContext {
  signal: AbortSignal
  onProgress: (percentage: number) => void
}

export interface EditorAssetUploadAdapter {
  upload: (
    file: File,
    context: EditorAssetUploadContext
  ) => Promise<UploadedAsset>
}
