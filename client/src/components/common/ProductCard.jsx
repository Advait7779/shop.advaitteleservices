import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, LoaderCircle, Check } from 'lucide-react';
import { useCart } from '../../context/CartContext';

const ProductCard = ({ product }) => {
  const { addToCart } = useCart();
  const defaultPlan = Array.isArray(product?.planOptions) && product.planOptions.length > 0
    ? product.planOptions[0]
    : '1 Year';
  const [isAdding, setIsAdding] = useState(false);
  const [justAdded, setJustAdded] = useState(false);

  if (!product) return null;

  const handleAddToCart = async () => {
    if (isAdding || product.inStock === false) return;
    setIsAdding(true);
    const added = await addToCart(product, defaultPlan, 1);
    setIsAdding(false);
    if (added) {
      setJustAdded(true);
      window.setTimeout(() => setJustAdded(false), 1600);
    }
  };

  const savings = product.originalPrice > product.sellingPrice
    ? product.originalPrice - product.sellingPrice
    : 0;

  return (
    <article className="product-editorial group flex h-full flex-col">
      <div className="product-editorial__image-panel">
        <div className="product-editorial__topline">
          <span className="product-editorial__code">ADVAIT TRACK</span>
          {product.discountPercent > 0 && (
            <span className="product-editorial__discount">{product.discountPercent}% OFF</span>
          )}
        </div>

        <Link to={`/product/${product.slug}`} className="product-editorial__image-link" aria-label={`View ${product.title}`}>
          <img src={product.primaryImage} alt={product.title} loading="lazy" />
        </Link>
      </div>

      <div className="product-editorial__details">
        <div className="product-editorial__meta">
          <span className={`product-editorial__stock ${product.inStock === false ? 'product-editorial__stock--empty' : ''}`}>
            {product.inStock === false ? 'Out of stock' : 'In stock'}
          </span>
        </div>

        <Link to={`/product/${product.slug}`} className="product-editorial__name" title={product.title}>
          {product.title}
        </Link>

        <p className="product-editorial__subtitle">{product.subtitle || product.description}</p>
        
        <div className="product-editorial__price-wrap">
          <div className="product-editorial__price">
            <span className="product-editorial__price-main">₹{product.sellingPrice.toLocaleString('en-IN')}</span>
            {product.originalPrice > product.sellingPrice && (
              <del>₹{product.originalPrice.toLocaleString('en-IN')}</del>
            )}
          </div>
          {savings > 0 && (
            <span className="product-editorial__savings">
              Save ₹{savings.toLocaleString('en-IN')}
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={handleAddToCart}
          disabled={isAdding || product.inStock === false}
          aria-label={product.inStock === false ? `${product.title} is out of stock` : `Add ${product.title} to cart`}
          className="product-editorial__cart"
        >
          {isAdding ? (
            <>
              <LoaderCircle size={16} strokeWidth={2} className="animate-spin text-brand-200" />
              <span>Adding to Cart...</span>
            </>
          ) : justAdded ? (
            <>
              <Check size={16} strokeWidth={2.4} className="text-brand-200" />
              <span>Added to Cart!</span>
            </>
          ) : product.inStock === false ? (
            <span>Out of Stock</span>
          ) : (
            <>
              <ShoppingBag size={16} strokeWidth={1.8} />
              <span>Add to Cart</span>
            </>
          )}
        </button>
      </div>
    </article>
  );
};

export default ProductCard;
