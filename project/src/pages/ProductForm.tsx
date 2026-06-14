import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { VariantTable } from '@/components/products/VariantTable';
import { ImageUploader, UploadedImage } from '@/components/products/ImageUploader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCategories } from '@/hooks/useCategories';
import { supabase } from '@/lib/supabase';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

const uploadImage = async (file: File, productId: string) => {
  const ext = file.name.split('.').pop();
  const fileName = `${productId}/${Date.now()}.${ext}`;
  const { error } = await supabase.storage
    .from('product-images')
    .upload(fileName, file, { cacheControl: '3600', upsert: false });
  if (error) throw error;
  const { data: urlData } = supabase.storage
    .from('product-images')
    .getPublicUrl(fileName);
  return urlData.publicUrl;
};

export const ProductForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = !!id;
  const { categories } = useCategories();

  const [images, setImages] = useState<UploadedImage[]>([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [weight, setWeight] = useState('');
  const [weightUnit, setWeightUnit] = useState<'gram' | 'kg'>('gram');
  const [categoryId, setCategoryId] = useState('');
  const [hasVariants, setHasVariants] = useState(false);
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [variants, setVariants] = useState<any[]>([]);

  // Track existing image IDs for deletion sync
  const [existingImageIds, setExistingImageIds] = useState<string[]>([]);

  useEffect(() => {
    if (!isEditMode || !id) return;

    const fetchProduct = async () => {
      setFetching(true);
      try {
        const { data, error: err } = await supabase
          .from('products')
          .select(
            `
            *,
            categories(name),
            product_images(id, url, sort_order),
            product_variants(id, name, price, stock)
          `
          )
          .eq('id', id)
          .single();

        if (err) throw err;
        if (!data) {
          toast.error('Produk tidak ditemukan');
          navigate('/products');
          return;
        }

        setName(data.name || '');
        setDescription(data.description || '');
        setCategoryId(data.category_id || '');
        setWeightUnit(data.weight_unit || 'gram');

        if (data.weight_unit === 'kg') {
          setWeight(String(data.weight_gram / 1000));
        } else {
          setWeight(String(data.weight_gram || ''));
        }

        setIsActive(data.is_active ?? true);
        setHasVariants(data.has_variants ?? false);

        if (!data.has_variants) {
          setPrice(data.price != null ? String(data.price) : '');
          setStock(data.stock != null ? String(data.stock) : '');
        } else {
          setVariants(data.product_variants || []);
        }

        // Map existing images to UploadedImage format
        const mappedImages: UploadedImage[] = (data.product_images || [])
          .sort((a: any, b: any) => a.sort_order - b.sort_order)
          .map((img: any) => ({
            id: img.id,
            url: img.url,
            sort_order: img.sort_order,
          }));

        setImages(mappedImages);
        setExistingImageIds(mappedImages.map((img) => img.id));
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Gagal memuat data produk';
        toast.error(message);
        navigate('/products');
      } finally {
        setFetching(false);
      }
    };

    fetchProduct();
  }, [id, isEditMode, navigate]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (images.length === 0) newErrors.images = 'Minimal 1 gambar wajib diupload';
    if (!name.trim()) newErrors.name = 'Nama produk wajib diisi';
    if (!weight) newErrors.weight = 'Berat wajib diisi';
    if (!categoryId) newErrors.categoryId = 'Kategori wajib dipilih';

    if (!hasVariants) {
      if (!price) newErrors.price = 'Harga wajib diisi';
      if (stock === '') newErrors.stock = 'Stok wajib diisi';
    } else {
      if (variants.length < 2) newErrors.variants = 'Minimal 2 varian diperlukan';
      if (variants.some(v => !v.name || v.price <= 0 || v.stock < 0)) {
        newErrors.variants = 'Harap isi semua detail varian dengan benar';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('Harap isi semua field yang wajib');
      return;
    }

    setLoading(true);

    try {
      const weightInGrams =
        weightUnit === 'kg' ? Number(weight) * 1000 : Number(weight);

      if (isEditMode && id) {
        // UPDATE existing product
        const { error: updateError } = await supabase
          .from('products')
          .update({
            name,
            description,
            weight_gram: weightInGrams,
            weight_unit: weightUnit,
            category_id: categoryId || null,
            has_variants: hasVariants,
            price: hasVariants ? null : Number(price),
            stock: hasVariants ? null : Number(stock),
            is_active: isActive,
          })
          .eq('id', id);

        if (updateError) throw updateError;

        // Sync images: delete removed ones, upload new ones, update sort_order
        const currentImageIds = images.filter((img) => !img.file).map((img) => img.id);
        const removedImageIds = existingImageIds.filter(
          (eid) => !currentImageIds.includes(eid)
        );

        // Delete removed images from DB
        if (removedImageIds.length > 0) {
          await supabase
            .from('product_images')
            .delete()
            .in('id', removedImageIds);
        }

        // Upload new images and collect all records
        const allImageRecords: { url: string; sort_order: number }[] = [];

        for (let i = 0; i < images.length; i++) {
          const img = images[i];

          if (img.file) {
            const publicUrl = await uploadImage(img.file, id);
            allImageRecords.push({ url: publicUrl, sort_order: i });
          } else if (img.url) {
            allImageRecords.push({ url: img.url, sort_order: i });
          }
        }

        // Delete all existing image records and re-insert with correct sort_order
        await supabase.from('product_images').delete().eq('product_id', id);

        if (allImageRecords.length > 0) {
          const { error: imagesError } = await supabase
            .from('product_images')
            .insert(
              allImageRecords.map((rec) => ({
                product_id: id,
                url: rec.url,
                sort_order: rec.sort_order,
              }))
            );

          if (imagesError) throw imagesError;
        }

        // Handle Variants Update
        if (hasVariants) {
           for (const v of variants) {
              if (v.id && v.id.length > 20) {
                 await supabase.from('product_variants').update({
                   name: v.name, price: Number(v.price), stock: Number(v.stock)
                 }).eq('id', v.id);
              } else {
                 await supabase.from('product_variants').insert([{
                   product_id: id, name: v.name, price: Number(v.price), stock: Number(v.stock)
                 }]);
              }
           }
           const currentIds = variants.filter(v => v.id && v.id.length > 20).map(v => v.id);
           if (currentIds.length > 0) {
              await supabase.from('product_variants').delete().eq('product_id', id).not('id', 'in', `(${currentIds.join(',')})`);
           } else {
              await supabase.from('product_variants').delete().eq('product_id', id);
           }
        } else {
           await supabase.from('product_variants').delete().eq('product_id', id);
        }

        toast.success('Produk berhasil diperbarui');
      } else {
        // INSERT new product
        const { data: productData, error: insertError } = await supabase
          .from('products')
          .insert([
            {
              name,
              description,
              weight_gram: weightInGrams,
              weight_unit: weightUnit,
              category_id: categoryId || null,
              has_variants: hasVariants,
              price: hasVariants ? null : Number(price),
              stock: hasVariants ? null : Number(stock),
              is_active: isActive,
              sold_count: 0,
            },
          ])
          .select()
          .single();

        if (insertError) throw insertError;
        if (!productData) throw new Error('Gagal membuat produk');

        const productId = productData.id;

        // Upload all images
        const imageRecords: { url: string; sort_order: number }[] = [];

        for (let i = 0; i < images.length; i++) {
          const img = images[i];

          if (img.file) {
            const publicUrl = await uploadImage(img.file, productId);
            imageRecords.push({ url: publicUrl, sort_order: i });
          } else if (img.url) {
            imageRecords.push({ url: img.url, sort_order: i });
          }
        }

        // Insert image records
        if (imageRecords.length > 0) {
          const { error: imagesError } = await supabase
            .from('product_images')
            .insert(
              imageRecords.map((rec) => ({
                product_id: productId,
                url: rec.url,
                sort_order: rec.sort_order,
              }))
            );

          if (imagesError) throw imagesError;
        }

        // Insert variants
        if (hasVariants && variants.length > 0) {
           const variantRecords = variants.map(v => ({
             product_id: productId,
             name: v.name,
             price: Number(v.price),
             stock: Number(v.stock)
           }));
           await supabase.from('product_variants').insert(variantRecords);
        }

        toast.success('Produk berhasil ditambahkan');
      }

      navigate('/products');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Gagal menyimpan produk';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (value: string) => {
    return value.replace(/\D/g, '').replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  };

  if (fetching) {
    return (
      <Layout>
        <div className="max-w-2xl space-y-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-40 w-full rounded-xl" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-2xl">
        <h2 className="text-2xl font-bold text-slate-900 mb-6">
          {isEditMode ? 'Edit Produk' : 'Tambah Produk'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* BAGIAN 1 - UPLOAD GAMBAR (paling atas) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">
                Foto Produk <span className="text-red-500">*</span>
              </Label>
              <span className="text-xs text-slate-500 font-medium">
                {images.length} / 9 gambar
              </span>
            </div>
            <ImageUploader
              images={images}
              onImagesChange={setImages}
              maxImages={9}
              disabled={loading}
            />
            {errors.images && (
              <p className="text-xs text-red-600">{errors.images}</p>
            )}
          </div>

          {/* BAGIAN 2 - INFO PRODUK */}
          <div className="space-y-5">
            <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">
              Informasi Produk
            </h3>

            {/* Nama Produk */}
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium">
                Nama Produk <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                placeholder="Contoh: Sajadah Premium"
                value={name}
                onChange={(e) => setName(e.target.value.slice(0, 200))}
                maxLength={200}
                className="border-slate-200"
                disabled={loading}
              />
              {errors.name && <p className="text-xs text-red-600">{errors.name}</p>}
              <p className="text-xs text-slate-500">{200 - name.length} karakter tersisa</p>
            </div>

            {/* Kategori */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                Kategori <span className="text-red-500">*</span>
              </Label>
              <Select value={categoryId} onValueChange={setCategoryId} disabled={loading}>
                <SelectTrigger className="border-slate-200">
                  <SelectValue placeholder="Pilih kategori" />
                </SelectTrigger>
                <SelectContent>
                  {categories
                    .filter((c) => c.is_active)
                    .map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              {errors.categoryId && (
                <p className="text-xs text-red-600">{errors.categoryId}</p>
              )}
            </div>

            {/* Deskripsi */}
            <div className="space-y-2">
              <Label htmlFor="description" className="text-sm font-medium">
                Deskripsi Produk
              </Label>
              <Textarea
                id="description"
                placeholder="Deskripsi detail produk..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="border-slate-200 min-h-[120px]"
                disabled={loading}
              />
            </div>

            {/* Berat */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                Berat <span className="text-red-500">*</span>
              </Label>
              <div className="flex gap-3">
                <Input
                  type="number"
                  placeholder="0"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  className="border-slate-200 flex-1"
                  disabled={loading || hasVariants}
                  min="0"
                />
                <Select
                  value={weightUnit}
                  onValueChange={(val: any) => setWeightUnit(val)}
                  disabled={loading || hasVariants}
                >
                  <SelectTrigger className="w-28 border-slate-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gram">Gram</SelectItem>
                    <SelectItem value="kg">Kilogram</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {errors.weight && <p className="text-xs text-red-600">{errors.weight}</p>}
            </div>
          </div>

          {/* BAGIAN 3 - HARGA & VARIAN */}
          <div className="space-y-5">
            <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">
              Harga & Stok
            </h3>

            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="variants-toggle" className="text-sm font-medium cursor-pointer">
                  Produk memiliki varian?
                </Label>
                <Switch
                  id="variants-toggle"
                  checked={hasVariants}
                  onCheckedChange={setHasVariants}
                  disabled={loading}
                />
              </div>

              {!hasVariants && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="price" className="text-sm font-medium">
                      Harga (Rp) <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">
                        Rp
                      </span>
                      <Input
                        id="price"
                        placeholder="0"
                        value={formatPrice(price)}
                        onChange={(e) => setPrice(e.target.value.replace(/\D/g, ''))}
                        className="border-slate-200 pl-10"
                        disabled={loading}
                      />
                    </div>
                    {errors.price && <p className="text-xs text-red-600">{errors.price}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="stock" className="text-sm font-medium">
                      Stok <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="stock"
                      type="number"
                      placeholder="0"
                      value={stock}
                      onChange={(e) => setStock(e.target.value)}
                      className="border-slate-200"
                      disabled={loading}
                      min="0"
                    />
                    {errors.stock && <p className="text-xs text-red-600">{errors.stock}</p>}
                  </div>
                </>
              )}

              {hasVariants && (
                <div className="space-y-2">
                  <VariantTable variants={variants} onVariantsChange={setVariants} />
                  {errors.variants && <p className="text-xs text-red-600">{errors.variants}</p>}
                </div>
              )}
            </div>
          </div>

          {/* BAGIAN 4 - STATUS */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">
              Status
            </h3>
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200">
              <div className="flex items-center gap-3">
                <Label htmlFor="active" className="text-sm font-medium cursor-pointer">
                  Tampilkan di Website
                </Label>
                <Badge
                  variant="secondary"
                  className={
                    isActive
                      ? 'bg-green-100 text-green-800'
                      : 'bg-slate-100 text-slate-600'
                  }
                >
                  {isActive ? 'Aktif' : 'Nonaktif'}
                </Badge>
              </div>
              <Switch
                id="active"
                checked={isActive}
                onCheckedChange={setIsActive}
                disabled={loading}
              />
            </div>
          </div>

          {/* Tombol Form */}
          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/products')}
              disabled={loading}
            >
              Batal
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-[#1B4332] hover:bg-[#153728] min-w-[140px]"
            >
              {loading
                ? 'Menyimpan...'
                : isEditMode
                  ? 'Simpan Perubahan'
                  : 'Simpan Produk'}
            </Button>
          </div>
        </form>
      </div>
    </Layout>
  );
};
