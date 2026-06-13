export interface Category {
  id: string;
  name: string;
  is_active: boolean;
  created_at: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  weight_gram: number;
  weight_unit: 'gram' | 'kg';
  category_id: string | null;
  is_active: boolean;
  has_variants: boolean;
  price: number | null;
  stock: number | null;
  sold_count: number;
  created_at: string;
  updated_at: string;
  categories?: Category;
  product_images?: ProductImage[];
  product_variants?: ProductVariant[];
}

export interface ProductVariant {
  id: string;
  product_id: string;
  name: string;
  price: number;
  stock: number;
}

export interface ProductImage {
  id: string;
  product_id: string;
  url: string;
  sort_order: number;
}
