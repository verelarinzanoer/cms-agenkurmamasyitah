import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Package,
  Tag,
  EyeOff,
  AlertTriangle,
  ArrowRight,
  Package as PackageIcon,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Product } from '@/types/database';

export const Dashboard = () => {
  const navigate = useNavigate();
  const [activeProductCount, setActiveProductCount] = useState<number | null>(null);
  const [categoryCount, setCategoryCount] = useState<number | null>(null);
  const [inactiveProductCount, setInactiveProductCount] = useState<number | null>(null);
  const [lowStockCount, setLowStockCount] = useState<number | null>(null);
  const [recentProducts, setRecentProducts] = useState<Product[]>([]);
  const [lowStockProducts, setLowStockProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      // Active products
      const { count: activeCount } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);

      setActiveProductCount(activeCount);

      // Total categories
      const { count: catCount } = await supabase
        .from('categories')
        .select('*', { count: 'exact', head: true });

      setCategoryCount(catCount);

      // Inactive products
      const { count: inactiveCount } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', false);

      setInactiveProductCount(inactiveCount);

      // Low stock
      const { count: lowStockCountResult } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('has_variants', false)
        .lt('stock', 10)
        .eq('is_active', true);

      setLowStockCount(lowStockCountResult);

      // Recent products
      const { data: recentData } = await supabase
        .from('products')
        .select(
          `
          id, name, is_active, price, stock, created_at, description,
          weight_gram, weight_unit, category_id, has_variants, sold_count, updated_at,
          categories(name),
          product_images(url, sort_order)
        `
        )
        .order('created_at', { ascending: false })
        .limit(5);

      setRecentProducts((recentData as any) || []);

      // Low stock products
      const { data: lowStockData } = await supabase
        .from('products')
        .select(`id, name, stock, description, weight_gram, weight_unit, category_id, has_variants, is_active, price, sold_count, created_at, updated_at, product_images(url, sort_order)`)
        .eq('has_variants', false)
        .lt('stock', 10)
        .eq('is_active', true)
        .order('stock', { ascending: true });

      setLowStockProducts((lowStockData as any) || []);

      setLoading(false);
    } catch (err) {
      console.error('Failed to fetch stats:', err);
      setLoading(false);
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
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            title="Total Produk Aktif"
            value={activeProductCount}
            icon={Package}
            color="bg-[#1B4332]"
            loading={loading}
          />
          <StatsCard
            title="Total Kategori"
            value={categoryCount}
            icon={Tag}
            color="bg-[#C9A84C]"
            loading={loading}
          />
          <StatsCard
            title="Produk Tidak Aktif"
            value={inactiveProductCount}
            icon={EyeOff}
            color="bg-slate-400"
            loading={loading}
          />
          <StatsCard
            title="Stok Menipis"
            value={lowStockCount}
            icon={AlertTriangle}
            color="bg-red-500"
            loading={loading}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Products */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-slate-100 shadow-sm">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h2 className="font-semibold text-slate-900">Produk Terbaru</h2>
              <Button variant="outline" size="sm" className="text-xs" onClick={() => navigate('/products')}>
                Lihat Semua <ArrowRight className="w-3 h-3 ml-1" />
              </Button>
            </div>

            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-100 hover:bg-transparent">
                    <TableHead className="text-xs font-semibold text-slate-600 bg-slate-50">
                      Foto
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-slate-600 bg-slate-50">
                      Produk
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
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    Array.from({ length: 3 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell>
                          <Skeleton className="w-10 h-10 rounded" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="w-24 h-4" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="w-20 h-4" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="w-20 h-4" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="w-12 h-4" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="w-16 h-6 rounded" />
                        </TableCell>
                      </TableRow>
                    ))
                  ) : recentProducts.length > 0 ? (
                    recentProducts.map((product) => {
                      const image = product.product_images?.find((img) => img.sort_order === 0);
                      return (
                        <TableRow
                          key={product.id}
                          className="cursor-pointer hover:bg-slate-50"
                          onClick={() => navigate(`/products/${product.id}/edit`)}
                        >
                          <TableCell>
                            {image ? (
                              <img
                                src={image.url}
                                alt={product.name}
                                className="w-10 h-10 rounded object-cover"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded bg-slate-100 flex items-center justify-center">
                                <PackageIcon className="w-5 h-5 text-slate-400" />
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="text-sm text-slate-900">{product.name}</TableCell>
                          <TableCell className="text-sm text-slate-600">
                            {product.categories?.name || '-'}
                          </TableCell>
                          <TableCell className="text-sm text-slate-900">
                            {formatCurrency(product.price)}
                          </TableCell>
                          <TableCell className="text-sm text-slate-900">{product.stock || '-'}</TableCell>
                          <TableCell>
                            <Badge
                              variant={product.is_active ? 'default' : 'secondary'}
                              className={
                                product.is_active
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-slate-100 text-slate-800'
                              }
                            >
                              {product.is_active ? 'Aktif' : 'Nonaktif'}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-slate-500">
                        Belum ada produk
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Low Stock Alert */}
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm">
            <div className="p-6 border-b border-slate-100">
              <h2 className="font-semibold text-slate-900 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-orange-500" />
                Stok Menipis
              </h2>
            </div>

            <div className="divide-y">
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="p-4 space-y-2">
                    <Skeleton className="w-24 h-4" />
                    <Skeleton className="w-16 h-4" />
                  </div>
                ))
              ) : lowStockProducts.length > 0 ? (
                lowStockProducts.slice(0, 5).map((product) => (
                  <div key={product.id} className="p-4">
                    <p className="text-sm font-medium text-slate-900 truncate">{product.name}</p>
                    <div className="flex items-center justify-between mt-2">
                      <Badge
                        variant="secondary"
                        className={
                          (product.stock ?? 0) === 0
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }
                      >
                        Stok: {product.stock ?? 0}
                      </Badge>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-4 text-center text-sm text-slate-500">Tidak ada produk dengan stok menipis</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};
