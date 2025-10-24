import { useState } from 'react';
import { Image as ImageIcon } from 'lucide-react';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { cn } from '@/lib/utils';
import type { ProductImage } from '@/types/product';

interface ImageGalleryProps {
  images: ProductImage[];
  productName: string;
}

export function ImageGallery({ images, productName }: ImageGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  if (!images || images.length === 0) {
    return (
      <div className="space-y-4">
        <AspectRatio ratio={16 / 9}>
          <div className="w-full h-full rounded-lg border bg-muted flex flex-col items-center justify-center gap-2">
            <ImageIcon className="h-12 w-12 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Sem imagens disponíveis
            </p>
          </div>
        </AspectRatio>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Main image */}
      <AspectRatio ratio={16 / 9}>
        <img
          src={images[activeIndex].url}
          alt={`${productName} - Imagem ${activeIndex + 1}`}
          className="w-full h-full object-cover rounded-lg border shadow-sm"
          loading="lazy"
        />
      </AspectRatio>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {images.map((image, index) => (
            <button
              key={image.id}
              onClick={() => setActiveIndex(index)}
              className={cn(
                'flex-shrink-0 w-20 h-20 rounded-md border-2 overflow-hidden transition-all hover:scale-105',
                activeIndex === index
                  ? 'border-primary ring-2 ring-primary ring-offset-2'
                  : 'border-transparent hover:border-muted-foreground'
              )}
              aria-label={`Ver imagem ${index + 1} de ${images.length}`}
              aria-pressed={activeIndex === index}
            >
              <img
                src={image.url}
                alt={`${productName} - Miniatura ${index + 1}`}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
