import { useState } from 'react';
import { useParams, useNavigate } from '@tanstack/react-router';
import {
  ArrowLeft,
  Pencil,
  Trash2,
  AlertCircle,
  PackageOpen,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { AspectRatio } from '@/components/ui/aspect-ratio';
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
import { ImageGallery } from '@/components/image-gallery';
import { EditProductDialog } from '@/components/edit-product-dialog';
import {
  useProductById,
  useProductImages,
  useDeleteProduct,
} from '@/hooks/use-products';
import { formatPriceBRL } from '@/lib/format';

export function ProductDetailPage() {
  const { id } = useParams({ from: '/product/$id' });
  const navigate = useNavigate();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const { data: product, isLoading, isError, error } = useProductById(id);
  const { data: images, isLoading: isLoadingImages } = useProductImages(id);
  const deleteProduct = useDeleteProduct();

  const handleDelete = async () => {
    try {
      await deleteProduct.mutateAsync({ id });
      toast.success('Produto excluído com sucesso!');
      navigate({ to: '/' });
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Erro ao excluir produto'
      );
    }
  };

  // Loading state
  if (isLoading || isLoadingImages) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-4">
            <AspectRatio ratio={16 / 9}>
              <Skeleton className="h-full w-full rounded-lg" />
            </AspectRatio>
            <div className="flex gap-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-20 w-20 rounded-md" />
              ))}
            </div>
          </div>
          <div className="space-y-6">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-12 w-32" />
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (isError) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Button
          variant="ghost"
          onClick={() => navigate({ to: '/' })}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Erro ao carregar produto</AlertTitle>
          <AlertDescription>
            {error instanceof Error
              ? error.message
              : 'Ocorreu um erro ao buscar o produto'}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Product not found (shouldn't happen with proper error handling above, but safety check)
  if (!product) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Button
          variant="ghost"
          onClick={() => navigate({ to: '/' })}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <PackageOpen className="h-16 w-16 text-muted-foreground mb-4" />
          <h3 className="text-xl font-semibold mb-2">Produto não encontrado</h3>
          <p className="text-muted-foreground mb-6 max-w-md">
            O produto que você está procurando não existe ou foi removido.
          </p>
          <Button onClick={() => navigate({ to: '/' })}>
            Voltar para lista de produtos
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header with back button and actions */}
      <div className="flex items-center justify-between mb-6">
        <Button variant="ghost" onClick={() => navigate({ to: '/' })}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>
        <div className="flex items-center gap-2">
          <EditProductDialog
            product={product}
            trigger={
              <Button variant="outline" size="sm">
                <Pencil className="mr-2 h-4 w-4" />
                Editar
              </Button>
            }
          />
          <AlertDialog
            open={isDeleteDialogOpen}
            onOpenChange={setIsDeleteDialogOpen}
          >
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="text-destructive hover:text-destructive"
                disabled={deleteProduct.isPending}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Excluir
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Excluir produto</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta ação não pode ser desfeita. Tem certeza que deseja
                  excluir <span className="font-semibold">{product.name}</span>?
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

      {/* Product details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Image gallery */}
        <div>
          <ImageGallery images={images || []} productName={product.name} />
        </div>

        {/* Product information */}
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">{product.name}</h1>
            <Badge variant="secondary" className="text-sm">
              SKU: {product.sku}
            </Badge>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">
                {formatPriceBRL(product.price)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-base">
                {product.description}
              </CardDescription>
            </CardContent>
          </Card>

          <div className="pt-4 border-t">
            <p className="text-sm text-muted-foreground">
              Cadastrado em:{' '}
              {new Date(product.createdAt).toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: 'long',
                year: 'numeric',
              })}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
