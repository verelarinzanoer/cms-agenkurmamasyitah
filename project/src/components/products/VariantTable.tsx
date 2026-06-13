import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Trash2 } from 'lucide-react';

interface Variant {
  id: string;
  name: string;
  price: number;
  stock: number;
}

interface VariantTableProps {
  variants: Variant[];
  onVariantsChange: (variants: Variant[]) => void;
}

export const VariantTable = ({ variants, onVariantsChange }: VariantTableProps) => {
  const addVariant = () => {
    const newVariant: Variant = {
      id: `${Date.now()}`,
      name: '',
      price: 0,
      stock: 0,
    };
    onVariantsChange([...variants, newVariant]);
  };

  const updateVariant = (id: string, field: keyof Variant, value: any) => {
    onVariantsChange(
      variants.map((v) =>
        v.id === id ? { ...v, [field]: value } : v
      )
    );
  };

  const removeVariant = (id: string) => {
    onVariantsChange(variants.filter((v) => v.id !== id));
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
            {variants.map((variant) => (
              <TableRow key={variant.id}>
                <TableCell>
                  <Input
                    placeholder="Contoh: Merah M"
                    value={variant.name}
                    onChange={(e) =>
                      updateVariant(variant.id, 'name', e.target.value)
                    }
                    className="border-slate-200 text-sm"
                  />
                </TableCell>
                <TableCell>
                  <Input
                    type="number"
                    placeholder="0"
                    value={variant.price}
                    onChange={(e) =>
                      updateVariant(variant.id, 'price', Number(e.target.value))
                    }
                    className="border-slate-200 text-sm"
                  />
                </TableCell>
                <TableCell>
                  <Input
                    type="number"
                    placeholder="0"
                    value={variant.stock}
                    onChange={(e) =>
                      updateVariant(variant.id, 'stock', Number(e.target.value))
                    }
                    className="border-slate-200 text-sm"
                  />
                </TableCell>
                <TableCell>
                  <Button
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

      {variants.length < 2 && (
        <p className="text-sm text-red-600 font-medium">Minimal 2 varian diperlukan</p>
      )}
    </div>
  );
};
