import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useUpdateProduct, useUploadProductImages } from '@/hooks/use-products';
import {
  updateProductSchema,
  type Product,
  type UpdateProduct,
} from '@/types/product';

interface EditProductDialogProps {
  product: Product;
  trigger: React.ReactNode;
}

export function EditProductDialog({
  product,
  trigger,
}: EditProductDialogProps) {
  const [open, setOpen] = useState(false);
  const updateProduct = useUpdateProduct();
  const uploadImages = useUploadProductImages();
  const [files, setFiles] = useState<File[]>([]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<UpdateProduct>({
    resolver: zodResolver(updateProductSchema),
    defaultValues: {
      name: product.name,
      description: product.description,
      price: product.price,
      sku: product.sku,
    },
  });

  useEffect(() => {
    if (open) {
      reset({
        name: product.name,
        description: product.description,
        price: product.price,
        sku: product.sku,
      });
    }
  }, [product, open, reset]);

  const onSubmit = async (data: UpdateProduct) => {
    try {
      await updateProduct.mutateAsync({
        id: product.id,
        data,
      });
      if (files.length > 0) {
        await uploadImages.mutateAsync({ productId: product.id, files });
      }
      toast.success('Produto atualizado com sucesso!');
      setOpen(false);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Erro ao atualizar produto'
      );
    }
  };

  const handleDialogChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen) {
      reset({
        name: product.name,
        description: product.description,
        price: product.price,
        sku: product.sku,
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleDialogChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>Editar Produto</DialogTitle>
            <DialogDescription>
              Atualize as informações do produto selecionado.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor={`name-${product.id}`}>Nome</Label>
              <Input
                id={`name-${product.id}`}
                {...register('name')}
                placeholder="Nome do produto"
                disabled={updateProduct.isPending}
              />
              {errors.name && (
                <p className="text-sm text-destructive">
                  {errors.name.message}
                </p>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor={`description-${product.id}`}>Descrição</Label>
              <Textarea
                id={`description-${product.id}`}
                {...register('description')}
                placeholder="Descrição do produto"
                rows={3}
                disabled={updateProduct.isPending}
              />
              {errors.description && (
                <p className="text-sm text-destructive">
                  {errors.description.message}
                </p>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor={`price-${product.id}`}>Preço</Label>
              <Input
                id={`price-${product.id}`}
                type="number"
                step="0.01"
                {...register('price', { valueAsNumber: true })}
                placeholder="0.00"
                disabled={updateProduct.isPending}
              />
              {errors.price && (
                <p className="text-sm text-destructive">
                  {errors.price.message}
                </p>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor={`images-${product.id}`}>Imagens (opcional)</Label>
              <Input
                id={`images-${product.id}`}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                onChange={(e) => {
                  const list = e.target.files ? Array.from(e.target.files) : [];
                  setFiles(list);
                }}
                disabled={updateProduct.isPending || uploadImages.isPending}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor={`sku-${product.id}`}>SKU</Label>
              <Input
                id={`sku-${product.id}`}
                {...register('sku')}
                placeholder="SKU-001"
                disabled={updateProduct.isPending || uploadImages.isPending}
              />
              {errors.sku && (
                <p className="text-sm text-destructive">{errors.sku.message}</p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={updateProduct.isPending || uploadImages.isPending}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={updateProduct.isPending || uploadImages.isPending}
            >
              {updateProduct.isPending || uploadImages.isPending
                ? 'Enviando...'
                : 'Salvar Alterações'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
