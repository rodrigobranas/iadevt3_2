import { useState } from 'react';
import { Link } from '@tanstack/react-router';
import { Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { EditProductDialog } from '@/components/edit-product-dialog';
import { useDeleteProduct, useProductImages } from '@/hooks/use-products';
import { formatPriceBRL } from '@/lib/format';
import type { Product } from '@/types/product';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const deleteProduct = useDeleteProduct();
  const { data: images } = useProductImages(product.id, true);

  const handleDelete = async () => {
    try {
      await deleteProduct.mutateAsync({ id: product.id });
      toast.success('Produto excluído com sucesso!');
      setIsDeleteDialogOpen(false);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Erro ao excluir produto'
      );
    }
  };

  return (
    <Card className="overflow-hidden group hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="space-y-1">
            <CardTitle className="text-lg">{product.name}</CardTitle>
            <Badge variant="secondary">{product.sku}</Badge>
          </div>
          <div
            className="flex items-center gap-2"
            onClick={(e) => e.stopPropagation()}
          >
            <EditProductDialog
              product={product}
              trigger={
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Pencil className="h-4 w-4" />
                  <span className="sr-only">Editar produto</span>
                </Button>
              }
            />
            <AlertDialog
              open={isDeleteDialogOpen}
              onOpenChange={setIsDeleteDialogOpen}
            >
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive hover:text-destructive"
                  disabled={deleteProduct.isPending}
                >
                  <Trash2 className="h-4 w-4" />
                  <span className="sr-only">Excluir produto</span>
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Excluir produto</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta ação não pode ser desfeita. Tem certeza que deseja
                    excluir{' '}
                    <span className="font-semibold">{product.name}</span>?
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={deleteProduct.isPending}>
                    Cancelar
                  </AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    disabled={deleteProduct.isPending}
                    onClick={async (event) => {
                      event.preventDefault();
                      await handleDelete();
                    }}
                  >
                    {deleteProduct.isPending ? 'Excluindo...' : 'Excluir'}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
        <Link
          to="/product/$id"
          params={{ id: product.id }}
          className="block cursor-pointer"
        >
          <div className="mb-3">
            {/* Cover image */}
            {images && images.length > 0 ? (
              <img
                src={images[0].url}
                alt={product.name}
                className="w-full h-40 object-cover rounded-md border group-hover:opacity-90 transition-opacity"
              />
            ) : (
              <div className="w-full h-40 rounded-md border bg-muted group-hover:bg-muted/80 transition-colors" />
            )}
          </div>
          <CardDescription className="line-clamp-2">
            {product.description}
          </CardDescription>
        </Link>
      </CardHeader>
      <CardContent>
        <Link to="/product/$id" params={{ id: product.id }} className="block">
          <p className="text-2xl font-bold group-hover:text-primary transition-colors">
            {formatPriceBRL(product.price)}
          </p>
        </Link>
      </CardContent>
    </Card>
  );
}
