import React, { useState, useRef } from 'react';
import ReactCrop, { Crop, PixelCrop, centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';

interface ImageUploadProps {
  onImageCropped: (base64Str: string) => void;
  aspect?: number;
  label?: string;
  currentImage?: string;
  onRemove?: () => void;
}

export function ImageUpload({ onImageCropped, aspect = 16 / 9, label = "Upload Image", currentImage, onRemove }: ImageUploadProps) {
  const [imgSrc, setImgSrc] = useState('');
  const imgRef = useRef<HTMLImageElement>(null);
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();

  function onSelectFile(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files.length > 0) {
      const reader = new FileReader();
      reader.addEventListener('load', () => setImgSrc(reader.result?.toString() || ''));
      reader.readAsDataURL(e.target.files[0]);
    }
  }

  function onImageLoad(e: React.SyntheticEvent<HTMLImageElement>) {
    if (aspect) {
      const { width, height } = e.currentTarget;
      const initialCrop = centerCrop(
        makeAspectCrop({ unit: '%', width: 90 }, aspect, width, height),
        width,
        height
      );
      setCrop(initialCrop);
    }
  }

  async function generateCroppedImage() {
    if (!completedCrop || !imgRef.current) return;
    const canvas = document.createElement('canvas');
    const image = imgRef.current;
    
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    
    const pixelRatio = window.devicePixelRatio;
    canvas.width = Math.floor(completedCrop.width * scaleX * pixelRatio);
    canvas.height = Math.floor(completedCrop.height * scaleY * pixelRatio);
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.scale(pixelRatio, pixelRatio);
    ctx.imageSmoothingQuality = 'high';
    
    const cropX = completedCrop.x * scaleX;
    const cropY = completedCrop.y * scaleY;
    
    ctx.drawImage(
      image,
      cropX,
      cropY,
      completedCrop.width * scaleX,
      completedCrop.height * scaleY,
      0,
      0,
      completedCrop.width * scaleX,
      completedCrop.height * scaleY
    );
    
    const base64Image = canvas.toDataURL('image/jpeg', 0.9);
    onImageCropped(base64Image);
    setImgSrc('');
  }

  return (
    <div className="flex flex-col gap-4">
      <label className="block text-sm font-medium text-zinc-400 mb-1">{label}</label>
      
      {!imgSrc && currentImage && (
        <div className="relative group rounded overflow-hidden max-h-48 border border-zinc-800">
           <img src={currentImage} className="w-full object-cover" />
           <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <button type="button" onClick={onRemove} className="px-3 py-1 bg-red-600 text-white rounded text-sm font-bold">Remove</button>
           </div>
        </div>
      )}

      {!imgSrc && (
        <input type="file" accept="image/*" onChange={onSelectFile} className="text-zinc-400 file:bg-zinc-800 file:text-white file:border-0 file:rounded file:px-4 file:py-2 hover:file:bg-zinc-700 cursor-pointer" />
      )}
      
      {imgSrc && (
        <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl flex flex-col items-center gap-4">
          <ReactCrop
            crop={crop}
            onChange={(_, percentCrop) => setCrop(percentCrop)}
            onComplete={(c) => setCompletedCrop(c)}
            aspect={aspect}
          >
            <img ref={imgRef} alt="Crop me" src={imgSrc} onLoad={onImageLoad} style={{ maxHeight: '400px' }} />
          </ReactCrop>
          <div className="flex gap-2 w-full justify-end">
             <button type="button" onClick={() => setImgSrc('')} className="px-4 py-2 bg-zinc-800 text-white rounded font-bold">Cancel</button>
             <button type="button" onClick={generateCroppedImage} className="px-4 py-2 bg-emerald-500 text-black font-bold rounded">Crop & Save</button>
          </div>
        </div>
      )}
    </div>
  );
}
