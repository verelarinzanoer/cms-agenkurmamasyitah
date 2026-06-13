import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  Package,
  Eye,
  EyeOff,
} from 'lucide-react';
import { useProducts } from '@/hooks/useProducts';
import { useCategories } from '@/hooks/useCategories';
import { Product } from '@/types/database';
import { toast } from 'sonner';

export const Products = () => {
  const navigate = useNavigate();
  const { products, loading, deleteProduct, updateProductStatus } = useProducts();
  const { categories } = useCategories();
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [deleteProductId, setDeleteProductId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchSearch = product.name.toLowerCase().includes(search.toLowerCase());
      const matchCategory =
        categoryFilter === 'all' || product.category_id === categoryFilter;
      const matchStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && product.is_active) ||
        (statusFilter === 'inactive' && !product.is_active);

      return matchSearch && matchCategory && matchStatus;
    });
  }, [products, search, categoryFilter, statusFilter]);

  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredProducts.slice(start, start + itemsPerPage);
  }, [filteredProducts, currentPage]);

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);

  const handleDelete = async () => {
    if (!deleteProductId) return;

    try {
      await deleteProduct(deleteProductId);
      toast.success('Produk berhasil dihapus');
      setDeleteProductId(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Gagal menghapus produk';
      toast.error(message);
    }
  };

  const handleToggleStatus = async (id: string, isActive: boolean) => {
    try {
      await updateProductStatus(id, !isActive);
      toast.success('Status produk berhasil diubah');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Gagal mengubah status';
      toast.error(message);
    }
  };

  const formatCurrency = (value: number | null) => {
    if (value === null) return '-';
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(value);
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h2 className="text-2xl font-bold text-slate-900">Manajemen Produk</h2>
          <Button
            onClick={() => navigate('/products/new')}
            className="gap-2 bg-[#1B4332] hover:bg-[#153728]"
          >
            <Plus className="w-4 h-4" />
            Tambah Produk
          </Button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl border border-slate-100 p-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Cari produk..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-10 border-slate-200"
              />
            </div>

            {/* Category Filter */}
            <Select value={categoryFilter} onValueChange={(val) => {
              setCategoryFilter(val);
              setCurrentPage(1);
            }}>
              <SelectTrigger className="border-slate-200">
                <SelectValue placeholder="Filter Kategori" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Kategori</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={(val) => {
              setStatusFilter(val);
              setCurrentPage(1);
            }}>
              <SelectTrigger className="border-slate-200">
                <SelectValue placeholder="Filter Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Status</SelectItem>
                <SelectItem value="active">Aktif</SelectItem>
                <SelectItem value="inactive">Nonaktif</SelectItem>
              </SelectContent>
            </Select>
          </div>
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
                    Foto
                  </TableHead>
                  <TableHead className="text-xs font-semibold text-slate-600 bg-slate-50">
                    Nama
                  </TableHead>
                  <TableHead className="text-xs font-semibold text-slate-600 bg-slate-50">
                    Kategori
                  </TableHead>
                  <TableHead className="text-xs font-semibold text-slate-600 bg-slate-50">
                    Harga
                  </TableHead>
                  <TableHead className="text-xs font-semibold text-slate-600 bg-slate-50">
                    Stok
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
                      {Array.from({ length: 8 }).map((_, j) => (
                        <TableCell key={j}>
                          {j === 0 ? (
                            <Skeleton className="w-6 h-4" />
                          ) : j === 1 ? (
                            <Skeleton className="w-10 h-10 rounded" />
                          ) : (
                            <Skeleton className="w-20 h-4" />
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : paginatedProducts.length > 0 ? (
                  paginatedProducts.map((product: Product, idx) => {
                    const image = product.product_images?.find((img) => img.sort_order === 0);
                    const rowNumber = (currentPage - 1) * itemsPerPage + idx + 1;

                    return (
                      <TableRow key={product.id} className="border-slate-100">
                        <TableCell className="text-sm text-slate-600 font-medium">
                          {rowNumber}
                        </TableCell>
                        <TableCell>
                          {image ? (
                            <img
                              src={image.url}
                              alt={product.name}
                              className="w-10 h-10 rounded object-cover"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded bg-slate-100 flex items-center justify-center">
                              <Package className="w-5 h-5 text-slate-400" />
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-slate-900 font-medium">
                          {product.name}
                        </TableCell>
                        <TableCell className="text-sm text-slate-600">
                          {product.categories?.name || '-'}
                        </TableCell>
                        <TableCell className="text-sm text-slate-900">
                          {product.has_variants ? 'Lihat Varian' : formatCurrency(product.price)}
                        </TableCell>
                        <TableCell className="text-sm text-slate-900">
                          {product.has_variants ? '-' : product.stock ?? 0}
                        </TableCell>
                        <TableCell>
                          <button
                            onClick={() => handleToggleStatus(product.id, product.is_active)}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors"
                          >
                            {product.is_active ? (
                              <>
                                <Eye className="w-3 h-3 text-green-600" />
                                <span className="text-green-700">Aktif</span>
                              </>
                            ) : (
                              <>
                                <EyeOff className="w-3 h-3 text-slate-400" />
                                <span className="text-slate-600">Nonaktif</span>
                              </>
                            )}
                          </button>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => navigate(`/products/${product.id}/edit`)}
                            >
                              <Pencil className="w-4 h-4 text-slate-600" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setDeleteProductId(product.id)}
                            >
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} className="py-12 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <Package className="w-12 h-12 text-slate-300" />
                        <p className="text-slate-500 font-medium">Belum ada produk</p>
                        <Button
                          onClick={() => navigate('/products/new')}
                          className="gap-2 bg-[#1B4332] hover:bg-[#153728]"
                        >
                          <Plus className="w-4 h-4" />
                          Tambah Produk Pertama
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 p-4 border-t border-slate-100">
              {Array.from({ length: totalPages }).map((_, i) => (
                <Button
                  key={i + 1}
                  variant={currentPage === i + 1 ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setCurrentPage(i + 1)}
                  className={
                    currentPage === i + 1
                      ? 'bg-[#1B4332] hover:bg-[#153728]'
                      : ''
                  }
                >
                  {i + 1}
                </Button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteProductId} onOpenChange={(open) => {
        if (!open) setDeleteProductId(null);
      }}>
        <AlertDialogContent>
          <AlertDialogTitle>Hapus Produk?</AlertDialogTitle>
          <AlertDialogDescription>
            Tindakan ini tidak dapat dibatalkan. Produk dan semua gambarnya akan dihapus secara permanen.
          </AlertDialogDescription>
          <div className="flex gap-3 justify-end">
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Ya, Hapus
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
};
