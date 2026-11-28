import React, { useState, useEffect, useRef } from 'react';
import api from '../../services/api';
import { X, Upload, Image as ImageIcon, Loader2, Plus, Trash2, CheckCircle, AlertCircle } from 'lucide-react';
import { useProductCategories } from '../../context/CategoryContext';
import ThemeSelect from '../../components/common/ThemeSelect';

const ProductEditorModal = ({ product, isOpen, onClose, onSaved }) => {
  const { categories, refreshCategories } = useProductCategories();
  const isEditing = !!product;

  const [formData, setFormData] = useState({
    title: '',
    category: 'vehicle-gps',
    slug: '',
    subtitle: '',
    sellingPrice: '',
    originalPrice: '',
    primaryImage: '',
    planOptions: '1 Year, 2 Years',
    inStock: true,
    description: '',
    features: '',
    whatsInBox: '',
    specs: {
      color: '',
      dimensions: '',
      weight: '',
      battery: '',
      skuCode: '',
      taxCode: '18% GST Included',
    },
  });

  const [uploading, setUploading] = useState(false);
  const [pendingImage, setPendingImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const previewUrlRef = useRef('');
  const [loadedImageSrc, setLoadedImageSrc] = useState('');
  const [failedImageSrc, setFailedImageSrc] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [categoryError, setCategoryError] = useState('');
  const [savingCategory, setSavingCategory] = useState(false);

  const clearPendingImage = () => {
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    previewUrlRef.current = '';
    setPreviewUrl('');
    setPendingImage(null);
  };

  useEffect(() => () => {
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
  }, []);

  useEffect(() => {
    clearPendingImage();
    if (product) {
      setFormData({
        title: product.title || '',
        category: product.category || 'vehicle-gps',
        slug: product.slug || '',
        subtitle: product.subtitle || '',
        sellingPrice: product.sellingPrice || '',
        originalPrice: product.originalPrice || '',
        primaryImage: product.primaryImage || '',
        planOptions: Array.isArray(product.planOptions) ? product.planOptions.join(', ') : '1 Year',
        inStock: product.inStock !== undefined ? product.inStock : true,
        description: product.description || '',
        features: Array.isArray(product.features) ? product.features.join('\n') : '',
        whatsInBox: Array.isArray(product.whatsInBox) ? product.whatsInBox.join('\n') : '',
        specs: {
          ...(product.specs || {}),
          color: product.specs?.color || '',
          dimensions: product.specs?.dimensions || '',
          weight: product.specs?.weight || '',
          battery: product.specs?.battery || '',
          skuCode: product.specs?.skuCode || '',
          taxCode: product.specs?.taxCode || '18% GST Included',
        },
      });
    } else {
      setFormData({
        title: '',
        category: 'vehicle-gps',
        slug: '',
        subtitle: '',
        sellingPrice: '',
        originalPrice: '',
        primaryImage: '',
        planOptions: '1 Year, 2 Years',
        inStock: true,
        description: '',
        features: '',
        whatsInBox: '',
        specs: {
          color: '',
          dimensions: '',
          weight: '',
          battery: '',
          skuCode: '',
          taxCode: '18% GST Included',
        },
      });
    }
    setError('');
    setShowCategoryForm(false);
    setNewCategoryName('');
    setCategoryError('');
  }, [product, isOpen]);

  if (!isOpen) return null;

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    setError('');
    clearPendingImage();
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 5 * 1024 * 1024 || !file.size) {
      setError('Choose a JPEG, PNG, or WebP image up to 5 MB.');
      return;
    }
    const url = URL.createObjectURL(file);
    previewUrlRef.current = url;
    setPreviewUrl(url);
    setPendingImage(file);
  };

  const handleImagePathChange = (event) => {
    clearPendingImage();
    setFormData((current) => ({ ...current, primaryImage: event.target.value }));
    setError('');
  };

  const calculateDiscount = () => {
    const orig = parseFloat(formData.originalPrice);
    const sell = parseFloat(formData.sellingPrice);
    if (orig && sell && orig > sell) {
      return Math.round(((orig - sell) / orig) * 100);
    }
    return 0;
  };

  const handleCreateCategory = async () => {
    const label = newCategoryName.trim();
    if (label.length < 2) {
      setCategoryError('Enter a category name with at least 2 characters.');
      return;
    }
    setSavingCategory(true);
    setCategoryError('');
    try {
      const response = await api.post('/admin/categories', { label });
      if (response.data.success) {
        await refreshCategories();
        setFormData((current) => ({ ...current, category: response.data.category.id }));
        setShowCategoryForm(false);
        setNewCategoryName('');
      }
    } catch (err) {
      setCategoryError(err.response?.data?.message || 'Could not add this category. Please try again.');
    } finally {
      setSavingCategory(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.title.trim() || !formData.sellingPrice || (!formData.primaryImage && !pendingImage) || !formData.description.trim()) {
      setError('Please provide Title, Selling Price, Primary Image, and Description.');
      return;
    }
    const previewSrc = previewUrl || formData.primaryImage.trim();
    if (loadedImageSrc !== previewSrc || failedImageSrc === previewSrc) {
      setError('Wait for the image preview to load, or choose another image.');
      return;
    }

    setSaving(true);

    const payload = {
      title: formData.title,
      category: formData.category,
      slug: formData.slug,
      subtitle: formData.subtitle,
      sellingPrice: parseFloat(formData.sellingPrice),
      originalPrice: formData.originalPrice ? parseFloat(formData.originalPrice) : parseFloat(formData.sellingPrice),
      primaryImage: formData.primaryImage.trim(),
      planOptions: formData.planOptions.split(',').map((p) => p.trim()).filter(Boolean),
      inStock: formData.inStock,
      description: formData.description,
      features: formData.features.split('\n').map((f) => f.trim()).filter(Boolean),
      whatsInBox: formData.whatsInBox.split('\n').map((w) => w.trim()).filter(Boolean),
      specs: formData.specs,
    };

    let uploadedUrl = '';
    try {
      if (pendingImage) {
        setUploading(true);
        const uploadForm = new FormData();
        uploadForm.append('image', pendingImage);
        const uploadResponse = await api.post('/admin/upload', uploadForm, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        if (!uploadResponse.data.success || !uploadResponse.data.imageUrl) {
          throw new Error(uploadResponse.data.message || 'Image upload failed.');
        }
        uploadedUrl = uploadResponse.data.imageUrl;
        payload.primaryImage = uploadedUrl;
        setUploading(false);
      }
      let res;
      if (isEditing) {
        res = await api.put(`/admin/products/${product.id}`, payload);
      } else {
        res = await api.post('/admin/products', payload);
      }

      if (res.data.success) {
        onSaved();
        onClose();
      } else {
        throw new Error(res.data.message || 'Saving product failed.');
      }
    } catch (err) {
      if (uploadedUrl) {
        await api.delete('/admin/upload', { data: { imageUrl: uploadedUrl } }).catch(() => {});
      }
      setError(err.response?.data?.message || err.message || 'Error occurred while saving product.');
    } finally {
      setUploading(false);
      setSaving(false);
    }
  };

  const imagePreviewSrc = previewUrl || formData.primaryImage.trim();
  const imagePreviewFailed = imagePreviewSrc && failedImageSrc === imagePreviewSrc;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
      <div className="w-full max-w-3xl bg-white rounded-lg border border-gray-200/80 shadow-2xl overflow-hidden animate-fadeInScale max-h-[92dvh] flex flex-col">
        
        {/* Header */}
        <div className="bg-[#172536] text-white px-4 py-3 sm:px-6 sm:py-4 flex items-center justify-between gap-2 border-b border-brand-900 shrink-0">
          <div className="min-w-0">
            <span className="text-[10px] font-bold uppercase tracking-widest text-brand-300">Catalog Manager</span>
            <h3 className="text-base sm:text-lg font-black tracking-tight text-white truncate">
              {isEditing ? `Edit Product: ${product.title}` : 'Add New GPS Tracker / Device'}
            </h3>
          </div>
          <button
            onClick={onClose}
            disabled={saving}
            className="p-2 shrink-0 rounded-md bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 overflow-y-auto space-y-5 sm:space-y-6 flex-1 text-xs">
          
          {error && (
            <div className="p-3.5 rounded-md bg-red-50 text-red-700 border border-red-200 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Section 1: Basic Information */}
          <div className="space-y-4">
            <h4 className="font-extrabold text-sm text-gray-900 border-b border-gray-100 pb-2">
              1. Basic Information
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-gray-700 mb-1">Product Title *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. A5 DEVICE"
                  className="w-full bg-brand-50/40 border border-gray-200 rounded-md px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-brand-500/30"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-700 mb-1">Custom Slug (Optional)</label>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  placeholder="e.g. a5-device (auto-generated if empty)"
                  className="w-full bg-brand-50/40 border border-gray-200 rounded-md px-3 py-2 text-xs font-sans focus:outline-none focus:ring-2 focus:ring-brand-500/30"
                />
              </div>
            </div>

            <div>
              <div className="mb-1 flex items-center justify-between gap-3">
                <label htmlFor="product-category" className="block text-[11px] font-bold text-gray-700">Product Category *</label>
                <button type="button" onClick={() => { setShowCategoryForm((open) => !open); setCategoryError(''); }} className="inline-flex items-center gap-1 text-[11px] font-bold text-[#385775] hover:underline">
                  <Plus className="h-3.5 w-3.5" aria-hidden="true" /> Add Category
                </button>
              </div>
              <ThemeSelect
                id="product-category"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                options={categories.map((item) => ({ value: item.id, label: item.label }))}
                className="w-full"
              />
              {showCategoryForm && <div className="mt-3 rounded-lg border border-brand-200 bg-brand-50 p-3">
                <label htmlFor="new-category-name" className="mb-1 block text-[11px] font-bold text-gray-700">New category name</label>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <input id="new-category-name" type="text" value={newCategoryName} onChange={(e) => { setNewCategoryName(e.target.value); setCategoryError(''); }} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleCreateCategory(); } }} maxLength={60} placeholder="e.g. Dash Cameras" className="min-w-0 flex-1 rounded-md border border-brand-200 bg-white px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-brand-500/30" />
                  <button type="button" onClick={handleCreateCategory} disabled={savingCategory} className="inline-flex items-center justify-center gap-1.5 rounded-md bg-[#385775] px-4 py-2 text-xs font-bold text-white hover:bg-[#293d54] disabled:opacity-50">
                    {savingCategory && <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />}
                    Save Category
                  </button>
                </div>
                {categoryError && <p role="alert" className="mt-2 text-[11px] font-semibold text-red-700">{categoryError}</p>}
              </div>}
            </div>

            <div>
              <label className="block text-[11px] font-bold text-gray-700 mb-1">Subtitle / Short Punchline</label>
              <input
                type="text"
                value={formData.subtitle}
                onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                placeholder="e.g. GPS TRACKER A5 device with 1 YEAR REPLACEMENT Warranty"
                className="w-full bg-brand-50/40 border border-gray-200 rounded-md px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/30"
              />
            </div>

            <div className="flex items-center gap-3 pt-1">
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.inStock}
                  onChange={(e) => setFormData({ ...formData, inStock: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-10 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#385775]"></div>
              </label>
              <span className="text-xs font-bold text-gray-800">
                {formData.inStock ? 'In Stock (Visible for Purchase)' : 'Out of Stock (Marked as Unavailable)'}
              </span>
            </div>
          </div>

          {/* Section 2: Pricing & Warranty Plans */}
          <div className="space-y-4">
            <h4 className="font-extrabold text-sm text-gray-900 border-b border-gray-100 pb-2">
              2. Pricing & Warranty Options
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
              <div>
                <label className="block text-[11px] font-bold text-gray-700 mb-1">Selling Price (₹) *</label>
                <input
                  type="number"
                  value={formData.sellingPrice}
                  onChange={(e) => setFormData({ ...formData, sellingPrice: e.target.value })}
                  placeholder="3200"
                  className="w-full bg-brand-50/40 border border-gray-200 rounded-md px-3 py-2 text-xs font-bold text-[#293d54] focus:outline-none focus:ring-2 focus:ring-brand-500/30"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-700 mb-1">MRP / Original Price (₹)</label>
                <input
                  type="number"
                  value={formData.originalPrice}
                  onChange={(e) => setFormData({ ...formData, originalPrice: e.target.value })}
                  placeholder="4500"
                  className="w-full bg-brand-50/40 border border-gray-200 rounded-md px-3 py-2 text-xs text-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-700 mb-1">Discount Preview</label>
                <div className="py-2 px-3 rounded-md bg-brand-100 text-[#385775] font-bold text-xs">
                  {calculateDiscount()}% OFF
                </div>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-gray-700 mb-1">
                Warranty Plan Options (Comma separated)
              </label>
              <input
                type="text"
                value={formData.planOptions}
                onChange={(e) => setFormData({ ...formData, planOptions: e.target.value })}
                placeholder="1 Year, 2 Years, 3 Years"
                className="w-full bg-brand-50/40 border border-gray-200 rounded-md px-3 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-brand-500/30"
              />
              <span className="text-[10px] text-gray-400">Users can pick one of these plans on the product card or detail page.</span>
            </div>
          </div>

          {/* Section 3: Image Upload & Preview */}
          <div className="space-y-4">
            <h4 className="font-extrabold text-sm text-gray-900 border-b border-gray-100 pb-2">
              3. Product Image
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
              
              {/* Image Preview Box */}
              <div className="sm:col-span-4 flex justify-center">
                <div className="w-36 h-36 rounded-md border-2 border-dashed border-gray-300 bg-brand-50/30 flex items-center justify-center overflow-hidden p-2 relative group">
                  {imagePreviewSrc ? (
                    <img
                      key={imagePreviewSrc}
                      src={imagePreviewSrc}
                      alt="Product Preview"
                      onLoad={() => { setLoadedImageSrc(imagePreviewSrc); setFailedImageSrc(''); }}
                      onError={() => setFailedImageSrc(imagePreviewSrc)}
                      className={`w-full h-full object-contain ${imagePreviewFailed ? 'hidden' : ''}`}
                    />
                  ) : (
                    <div className="text-center text-gray-400 p-2">
                      <ImageIcon className="w-8 h-8 mx-auto mb-1 opacity-50" />
                      <span className="text-[10px]">No image yet</span>
                    </div>
                  )}
                  {imagePreviewFailed && <span role="alert" className="absolute inset-0 flex items-center justify-center bg-red-50 p-3 text-center text-[11px] font-semibold text-red-700">Image could not be loaded</span>}
                </div>
              </div>

              {/* Upload & URL Input */}
              <div className="sm:col-span-8 space-y-3">
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">Upload New Image File</label>
                  <label className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-brand-100 hover:bg-brand-200 text-[#385775] font-bold text-xs cursor-pointer transition-colors border border-brand-200">
                    {uploading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Uploading and saving...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4" />
                        <span>{pendingImage ? 'Change Selected Image' : 'Select Image from Computer'}</span>
                      </>
                    )}
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handleFileUpload}
                      disabled={saving}
                      className="hidden"
                    />
                  </label>
                  <p className="text-[10px] text-gray-400 mt-1">JPEG, PNG, or WebP, up to 5 MB. The image uploads when you save.</p>
                  {pendingImage && <p className="mt-1 text-[11px] font-semibold text-[#385775]">Selected: {pendingImage.name}</p>}
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">Or Enter Existing Product Image Path</label>
                  <input
                    type="text"
                    value={formData.primaryImage}
                    onChange={handleImagePathChange}
                    placeholder="/products/a5-device.jpg"
                    className="w-full bg-brand-50/40 border border-gray-200 rounded-md px-3 py-2 text-xs font-sans focus:outline-none focus:ring-2 focus:ring-brand-500/30"
                    required={!pendingImage}
                  />
                  {pendingImage && <p className="mt-1 text-[10px] text-gray-500">The selected file will replace this path. Editing the path cancels the selected file.</p>}
                </div>
              </div>

            </div>
          </div>

          {/* Section 4: Description & Features */}
          <div className="space-y-4">
            <h4 className="font-extrabold text-sm text-gray-900 border-b border-gray-100 pb-2">
              4. Description, Features & In-The-Box
            </h4>

            <div>
              <label className="block text-[11px] font-bold text-gray-700 mb-1">Detailed Description *</label>
              <textarea
                rows="3"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Comprehensive overview of device capabilities..."
                className="w-full bg-brand-50/40 border border-gray-200 rounded-md px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/30"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-gray-700 mb-1">Key Features (One per line)</label>
                <textarea
                  rows="4"
                  value={formData.features}
                  onChange={(e) => setFormData({ ...formData, features: e.target.value })}
                  placeholder="Live Satellite Tracking&#10;Remote Engine Cut-Off&#10;In-built 4G SIM Card&#10;Anti-theft Alerts"
                  className="w-full bg-brand-50/40 border border-gray-200 rounded-md px-3 py-2 text-xs font-sans focus:outline-none focus:ring-2 focus:ring-brand-500/30"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-700 mb-1">What's in the Box (One per line)</label>
                <textarea
                  rows="4"
                  value={formData.whatsInBox}
                  onChange={(e) => setFormData({ ...formData, whatsInBox: e.target.value })}
                  placeholder="1x GPS Unit&#10;1x Relay Cable Harness&#10;1x 4G Pre-configured SIM&#10;1x 1-Year Warranty Card"
                  className="w-full bg-brand-50/40 border border-gray-200 rounded-md px-3 py-2 text-xs font-sans focus:outline-none focus:ring-2 focus:ring-brand-500/30"
                />
              </div>
            </div>
          </div>

          {/* Section 5: Technical Specifications */}
          <div className="space-y-4">
            <h4 className="font-extrabold text-sm text-gray-900 border-b border-gray-100 pb-2">
              5. Technical Specifications
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-gray-700 mb-1">Dimensions</label>
                <input
                  type="text"
                  value={formData.specs.dimensions}
                  onChange={(e) => setFormData({ ...formData, specs: { ...formData.specs, dimensions: e.target.value } })}
                  placeholder="L: 14 x B: 12 x H: 15 cm"
                  className="w-full bg-brand-50/40 border border-gray-200 rounded-md px-2.5 py-1.5 text-xs"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-700 mb-1">Weight</label>
                <input
                  type="text"
                  value={formData.specs.weight}
                  onChange={(e) => setFormData({ ...formData, specs: { ...formData.specs, weight: e.target.value } })}
                  placeholder="135g"
                  className="w-full bg-brand-50/40 border border-gray-200 rounded-md px-2.5 py-1.5 text-xs"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-700 mb-1">Color</label>
                <input
                  type="text"
                  value={formData.specs.color}
                  onChange={(e) => setFormData({ ...formData, specs: { ...formData.specs, color: e.target.value } })}
                  placeholder="Matte Black"
                  className="w-full bg-brand-50/40 border border-gray-200 rounded-md px-2.5 py-1.5 text-xs"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-700 mb-1">Battery / Backup</label>
                <input
                  type="text"
                  value={formData.specs.battery}
                  onChange={(e) => setFormData({ ...formData, specs: { ...formData.specs, battery: e.target.value } })}
                  placeholder="10,000mAh / 6-hour backup"
                  className="w-full bg-brand-50/40 border border-gray-200 rounded-md px-2.5 py-1.5 text-xs"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-700 mb-1">SKU / HSN Code</label>
                <input
                  type="text"
                  value={formData.specs.skuCode}
                  onChange={(e) => setFormData({ ...formData, specs: { ...formData.specs, skuCode: e.target.value } })}
                  placeholder="85269190"
                  className="w-full bg-brand-50/40 border border-gray-200 rounded-md px-2.5 py-1.5 text-xs font-sans"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-700 mb-1">Tax Code</label>
                <input
                  type="text"
                  value={formData.specs.taxCode}
                  onChange={(e) => setFormData({ ...formData, specs: { ...formData.specs, taxCode: e.target.value } })}
                  placeholder="18% GST Included"
                  className="w-full bg-brand-50/40 border border-gray-200 rounded-md px-2.5 py-1.5 text-xs"
                />
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="pt-4 border-t border-gray-200 flex items-center justify-end gap-3 sticky bottom-0 bg-white py-3">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-5 py-2.5 rounded-md border border-gray-300 text-gray-700 font-bold text-xs hover:bg-gray-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !!imagePreviewFailed || (!!imagePreviewSrc && loadedImageSrc !== imagePreviewSrc)}
              className="px-6 py-2.5 rounded-md bg-[#385775] hover:bg-[#293d54] text-white font-bold text-xs shadow-md transition-all btn-press flex items-center gap-2 disabled:opacity-50"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving to Database...</span>
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  <span>{isEditing ? 'Update GPS Product' : 'Create & Publish Product'}</span>
                </>
              )}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};

export default ProductEditorModal;
