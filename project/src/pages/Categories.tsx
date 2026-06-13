import { useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Plus, Pencil, Trash2, Tag } from 'lucide-react';
import { useCategories } from '@/hooks/useCategories';
import { supabase } from '@/lib/supabase';
import { Category } from '@/types/database';
import { toast } from 'sonner';

export const Categories = () => {
  const { categories, loading, addCategory, updateCategory, deleteCategory } = useCategories();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [deleteAlertOpen, setDeleteAlertOpen] = useState(false);
  const [deleteWarningOpen, setDeleteWarningOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
  const [productCountInCategory, setProductCountInCategory] = useState<number>(0);
  const [name, setName] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const handleOpenDialog = (category?: Category) => {
    if (category) {
      setEditingCategory(category);
      setName(category.name);
      setIsActive(category.is_active);
    } else {
      setEditingCategory(null);
      setName('');
      setIsActive(true);
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      toast.error('Nama kategori harus diisi');
      return;
    }

    setSubmitting(true);

    try {
      if (editingCategory) {
        await updateCategory(editingCategory.id, name, isActive);
        toast.success('Kategori berhasil diperbarui');
      } else {
        await addCategory(name);
        toast.success('Kategori berhasil ditambahkan');
      }
      setIsDialogOpen(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Terjadi kesalahan';
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteClick = async (category: Category) => {
    setCategoryToDelete(category);

    const { count } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('category_id', category.id);

    if (count && count > 0) {
      setProductCountInCategory(count);
      setDeleteWarningOpen(true);
    } else {
      setDeleteAlertOpen(true);
    }
  };

  const handleConfirmDelete = async () => {
    if (!categoryToDelete) return;

    try {
      await deleteCategory(categoryToDelete.id);
      toast.success('Kategori berhasil dihapus');
      setDeleteAlertOpen(false);
      setDeleteWarningOpen(false);
      setCategoryToDelete(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Gagal menghapus kategori';
      toast.error(message);
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h2 className="text-2xl font-bold text-slate-900">Manajemen Kategori</h2>
          <Button
            onClick={() => handleOpenDialog()}
            className="gap-2 bg-[#1B4332] hover:bg-[#153728]"
          >
            <Plus className="w-4 h-4" />
            Tambah Kategori
          </Button>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-slate-100 hover:bg-transparent">
                  <TableHead className="text-xs font-semibold text-slate-600 bg-slate-50 w-12">
                    No
                  </TableHead>
                  <TableHead className="text-xs font-semibold text-slate-600 bg-slate-50">
                    Nama Kategori
                  </TableHead>
                  <TableHead className="text-xs font-semibold text-slate-600 bg-slate-50">
                    Jumlah Produk
                  </TableHead>
                  <TableHead className="text-xs font-semibold text-slate-600 bg-slate-50">
                    Status
                  </TableHead>
                  <TableHead className="text-xs font-semibold text-slate-600 bg-slate-50">
                    Aksi
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 5 }).map((_, j) => (
                        <TableCell key={j}>
                          <Skeleton className="w-20 h-4" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : categories.length > 0 ? (
                  categories.map((category, idx) => (
                    <CategoryRow
                      key={category.id}
                      category={category}
                      index={idx + 1}
                      onEdit={() => handleOpenDialog(category)}
                      onDelete={() => handleDeleteClick(category)}
                      onToggleStatus={async (is_active) => {
                        try {
                          await updateCategory(category.id, category.name, is_active);
                          toast.success('Status kategori berhasil diubah');
                        } catch (err) {
                          toast.error('Gagal mengubah status');
                        }
                      }}
                    />
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="py-12 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <Tag className="w-12 h-12 text-slate-300" />
                        <p className="text-slate-500 font-medium">Belum ada kategori</p>
                        <Button
                          onClick={() => handleOpenDialog()}
                          className="gap-2 bg-[#1B4332] hover:bg-[#153728]"
                        >
                          <Plus className="w-4 h-4" />
                          Tambah Kategori Pertama
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingCategory ? 'Edit Kategori' : 'Tambah Kategori Baru'}
            </DialogTitle>
            <DialogDescription>
              {editingCategory ? 'Update informasi kategori' : 'Buat kategori produk baru'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium">
                Nama Kategori <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                placeholder="Contoh: Baju Muslim"
                value={name}
                onChange={(e) => setName(e.target.value.slice(0, 100))}
                maxLength={100}
                className="border-slate-200"
                disabled={submitting}
              />
              <p className="text-xs text-slate-500">{name.length} / 100</p>
            </div>

            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
              <Label htmlFor="active" className="text-sm font-medium cursor-pointer">
                Kategori Aktif
              </Label>
              <Switch
                id="active"
                checked={isActive}
                onCheckedChange={setIsActive}
                disabled={submitting}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
              disabled={submitting}
            >
              Batal
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={submitting}
              className="bg-[#1B4332] hover:bg-[#153728]"
            >
              {submitting ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteAlertOpen} onOpenChange={setDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogTitle>Hapus Kategori?</AlertDialogTitle>
          <AlertDialogDescription>
            Tindakan ini tidak dapat dibatalkan. Kategori akan dihapus secara permanen.
          </AlertDialogDescription>
          <div className="flex gap-3 justify-end">
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Ya, Hapus
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      {/* Warning Dialog */}
      <AlertDialog open={deleteWarningOpen} onOpenChange={setDeleteWarningOpen}>
        <AlertDialogContent>
          <AlertDialogTitle>Kategori Memiliki Produk</AlertDialogTitle>
          <AlertDialogDescription>
            Kategori ini memiliki {productCountInCategory} produk. Produk tidak akan terhapus tapi
            kategori produk akan menjadi kosong. Lanjutkan?
          </AlertDialogDescription>
          <div className="flex gap-3 justify-end">
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-orange-600 hover:bg-orange-700 text-white"
            >
              Ya, Lanjutkan
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
};

interface CategoryRowProps {
  category: Category;
  index: number;
  onEdit: () => void;
  onDelete: () => void;
  onToggleStatus: (is_active: boolean) => Promise<void>;
}

const CategoryRow = ({ category, index, onEdit, onDelete, onToggleStatus }: CategoryRowProps) => {
  const [togglingStatus, setTogglingStatus] = useState(false);

  const handleToggle = async () => {
    setTogglingStatus(true);
    try {
      await onToggleStatus(!category.is_active);
    } finally {
      setTogglingStatus(false);
    }
  };

  return (
    <TableRow className="border-slate-100">
      <TableCell className="text-sm text-slate-600 font-medium">{index}</TableCell>
      <TableCell className="text-sm text-slate-900 font-medium">{category.name}</TableCell>
      <TableCell className="text-sm text-slate-600">
        <Badge variant="secondary">0 produk</Badge>
      </TableCell>
      <TableCell>
        <button
          onClick={handleToggle}
          disabled={togglingStatus}
          className="inline-flex"
        >
          <Badge
            variant={category.is_active ? 'default' : 'secondary'}
            className={
              category.is_active
                ? 'bg-green-100 text-green-800'
                : 'bg-slate-100 text-slate-800'
            }
          >
            {category.is_active ? 'Aktif' : 'Nonaktif'}
          </Badge>
        </button>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={onEdit}>
            <Pencil className="w-4 h-4 text-slate-600" />
          </Button>
          <Button variant="ghost" size="sm" onClick={onDelete}>
            <Trash2 className="w-4 h-4 text-red-500" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
};
