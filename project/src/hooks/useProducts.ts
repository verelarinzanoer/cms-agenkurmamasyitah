import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Product } from '@/types/database';

export const useProducts = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: err } = await supabase
        .from('products')
        .select(
          `
          *,
          categories(name),
          product_images(url, sort_order),
          product_variants(*)
        `
        )
        .order('created_at', { ascending: false });

      if (err) throw err;
      setProducts(data || []);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch products';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const deleteProduct = async (id: string) => {
    try {
      const product = products.find((p) => p.id === id);
      if (!product || !product.product_images) return;

      const paths = product.product_images.map((img) => {
        const url = new URL(img.url);
        return url.pathname.split('/').pop() || '';
      });

      if (paths.length > 0) {
        await supabase.storage.from('product-images').remove(
          paths.map((name) => {
            const productPath = `${id}/${name}`;
            return productPath;
          })
        );
      }

      const { error: err } = await supabase.from('products').delete().eq('id', id);

      if (err) throw err;
      setProducts(products.filter((p) => p.id !== id));
    } catch (err) {
      throw err instanceof Error ? err : new Error('Failed to delete product');
    }
  };

  const updateProductStatus = async (id: string, is_active: boolean) => {
    try {
      const { data, error: err } = await supabase
        .from('products')
        .update({ is_active })
        .eq('id', id)
        .select()
        .single();

      if (err) throw err;
      setProducts(products.map((p) => (p.id === id ? { ...p, is_active } : p)));
      return data;
    } catch (err) {
      throw err instanceof Error ? err : new Error('Failed to update product');
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  return {
    products,
    loading,
    error,
    fetchProducts,
    deleteProduct,
    updateProductStatus,
  };
};
