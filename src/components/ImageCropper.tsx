import { useState, useRef, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import ReactCrop, { 
  centerCrop, 
  makeAspectCrop, 
  Crop, 
  PixelCrop,
  convertToPixelCrop 
} from 'react-image-crop'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import 'react-image-crop/dist/ReactCrop.css'

interface ImageCropperProps {
  open: boolean
  onClose: () => void
  imageSrc: string
  onCropComplete: (croppedImageBlob: Blob) => void
}

function centerAspectCrop(
  mediaWidth: number,
  mediaHeight: number,
  aspect: number,
) {
  return centerCrop(
    makeAspectCrop(
      {
        unit: '%',
        width: 90,
      },
      aspect,
      mediaWidth,
      mediaHeight,
    ),
    mediaWidth,
    mediaHeight,
  )
}

export function ImageCropper({ open, onClose, imageSrc, onCropComplete }: ImageCropperProps) {
  const { t } = useTranslation()
  const [crop, setCrop] = useState<Crop>()
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>()
  const imgRef = useRef<HTMLImageElement>(null)
  const previewCanvasRef = useRef<HTMLCanvasElement>(null)

  const onImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget
    setCrop(centerAspectCrop(width, height, 1))
  }, [])

  const getCroppedImg = useCallback((
    image: HTMLImageElement,
    crop: PixelCrop,
  ): Promise<Blob> => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')

    if (!ctx) {
      throw new Error('No 2d context')
    }

    const scaleX = image.naturalWidth / image.width
    const scaleY = image.naturalHeight / image.height

    canvas.width = crop.width
    canvas.height = crop.height

    ctx.drawImage(
      image,
      crop.x * scaleX,
      crop.y * scaleY,
      crop.width * scaleX,
      crop.height * scaleY,
      0,
      0,
      crop.width,
      crop.height,
    )

    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error('Canvas is empty'))
          return
        }
        resolve(blob)
      }, 'image/jpeg', 0.95)
    })
  }, [])

  const handleCropSave = useCallback(async () => {
    if (!imgRef.current || !completedCrop) {
      return
    }

    try {
      const croppedImageBlob = await getCroppedImg(imgRef.current, completedCrop)
      onCropComplete(croppedImageBlob)
      onClose()
    } catch (error) {
      console.error('Error cropping image:', error)
    }
  }, [completedCrop, getCroppedImg, onCropComplete, onClose])

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{t('profile.cropImage')}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="max-h-[400px] overflow-auto">
            <ReactCrop
              crop={crop}
              onChange={(_, percentCrop) => setCrop(percentCrop)}
              onComplete={(c) => setCompletedCrop(convertToPixelCrop(c, imgRef.current?.width || 0, imgRef.current?.height || 0))}
              aspect={1}
              circularCrop
            >
              <img
                ref={imgRef}
                alt="Crop me"
                src={imageSrc}
                style={{ maxHeight: '400px', width: 'auto' }}
                onLoad={onImageLoad}
              />
            </ReactCrop>
          </div>
          
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handleCropSave} disabled={!completedCrop}>
              {t('common.save')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}