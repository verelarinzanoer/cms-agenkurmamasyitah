import { useState, useEffect, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Trash2 } from 'lucide-react';

export interface Variant {
  id: string;
  name: string;
  price: string;
  stock: string;
}

interface VariantTableProps {
  variants: Variant[];
  onVariantsChange: (variants: Variant[]) => void;
}

export const VariantTable = ({ variants, onVariantsChange }: VariantTableProps) => {
  const [localVariants, setLocalVariants] = useState<Variant[]>(variants);

  // Sync parent -> local only when parent changes from outside (e.g., reset)
  useEffect(() => {
    setLocalVariants(variants);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const syncToParent = useCallback((updated: Variant[]) => {
    onVariantsChange(updated);
  }, [onVariantsChange]);

  const addVariant = () => {
    const newVariant: Variant = {
      id: `local-${Date.now()}`,
      name: '',
      price: '',
      stock: '',
    };
    const updated = [...localVariants, newVariant];
    setLocalVariants(updated);
    syncToParent(updated);
  };

  const updateVariant = (id: string, field: keyof Variant, value: string) => {
    const updated = localVariants.map((v) =>
      v.id === id ? { ...v, [field]: value } : v
    );
    setLocalVariants(updated);
    syncToParent(updated);
  };

  const removeVariant = (id: string) => {
    const updated = localVariants.filter((v) => v.id !== id);
    setLocalVariants(updated);
    syncToParent(updated);
  };

  return (
    <div className="space-y-4">
      <div className="border border-slate-200 rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs font-semibold bg-slate-50">
                Nama Varian
              </TableHead>
              <TableHead className="text-xs font-semibold bg-slate-50">
                Harga (Rp)
              </TableHead>
              <TableHead className="text-xs font-semibold bg-slate-50">
                Stok
              </TableHead>
              <TableHead className="text-xs font-semibold bg-slate-50 w-12">
                Aksi
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {localVariants.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-sm text-slate-400 py-4">
                  Belum ada varian. Klik "Tambah Varian" untuk menambahkan.
                </TableCell>
              </TableRow>
            )}
            {localVariants.map((variant) => (
              <TableRow key={variant.id}>
                <TableCell>
                  <Input
                    placeholder="Contoh: Merah M"
                    value={variant.name}
                    onChange={(e) => updateVariant(variant.id, 'name', e.target.value)}
                    className="border-slate-200 text-sm"
                  />
                </TableCell>
                <TableCell>
                  <Input
                    type="number"
                    placeholder="0"
                    value={variant.price}
                    min="0"
                    onChange={(e) => updateVariant(variant.id, 'price', e.target.value)}
                    className="border-slate-200 text-sm"
                  />
                </TableCell>
                <TableCell>
                  <Input
                    type="number"
                    placeholder="0"
                    value={variant.stock}
                    min="0"
                    onChange={(e) => updateVariant(variant.id, 'stock', e.target.value)}
                    className="border-slate-200 text-sm"
                  />
                </TableCell>
                <TableCell>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeVariant(variant.id)}
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Button
        type="button"
        variant="outline"
        onClick={addVariant}
        className="gap-2 w-full"
      >
        <Plus className="w-4 h-4" />
        Tambah Varian
      </Button>

      {localVariants.length < 2 && (
        <p className="text-sm text-red-600 font-medium">Minimal 2 varian diperlukan</p>
      )}
    </div>
  );
};
