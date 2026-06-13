import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Category } from '@/types/database';

export const useCategories = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCategories = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: err } = await supabase
        .from('categories')
        .select('*')
        .order('created_at', { ascending: false });

      if (err) throw err;
      setCategories(data || []);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch categories';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const addCategory = async (name: string) => {
    try {
      const { data, error: err } = await supabase
        .from('categories')
        .insert([{ name, is_active: true }])
        .select()
        .single();

      if (err) throw err;
      setCategories([data, ...categories]);
      return data;
    } catch (err) {
      throw err instanceof Error ? err : new Error('Failed to add category');
    }
  };

  const updateCategory = async (id: string, name: string, is_active: boolean) => {
    try {
      const { data, error: err } = await supabase
        .from('categories')
        .update({ name, is_active })
        .eq('id', id)
        .select()
        .single();

      if (err) throw err;
      setCategories(categories.map((cat) => (cat.id === id ? data : cat)));
      return data;
    } catch (err) {
      throw err instanceof Error ? err : new Error('Failed to update category');
    }
  };

  const deleteCategory = async (id: string) => {
    try {
      const { error: err } = await supabase.from('categories').delete().eq('id', id);

      if (err) throw err;
      setCategories(categories.filter((cat) => cat.id !== id));
    } catch (err) {
      throw err instanceof Error ? err : new Error('Failed to delete category');
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  return {
    categories,
    loading,
    error,
    fetchCategories,
    addCategory,
    updateCategory,
    deleteCategory,
  };
};
