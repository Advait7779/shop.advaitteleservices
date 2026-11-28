import { useEffect, useState } from 'react';
import api from '../../services/api';
import ProductCard from './ProductCard';

const RelatedProducts = ({ productId, category }) => {
  const [recommendations, setRecommendations] = useState(null);

  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;

    const loadRecommendations = async () => {
      const matches = new Map();
      let hasNextPage = Boolean(category);

      for (let page = 1; hasNextPage; page += 1) {
        const { data } = await api.get('/products', { params: { category, page, limit: 100 }, signal });
        if (signal.aborted || !data.success) return;

        for (const product of data.products) {
          if (product.id !== productId) matches.set(product.id, product);
        }
        hasNextPage = data.hasNextPage;
      }

      if (matches.size > 0) {
        setRecommendations({ title: 'Related Products', products: [...matches.values()] });
        return;
      }

      const { data } = await api.get('/products', { params: { limit: 5 }, signal });
      if (!signal.aborted && data.success) {
        const products = data.products.filter((product) => product.id !== productId).slice(0, 4);
        setRecommendations({ title: 'More Products', products });
      }
    };

    loadRecommendations().catch((error) => {
      if (!signal.aborted) console.error('Failed to load related products:', error);
    });
    return () => controller.abort();
  }, [productId, category]);

  if (!recommendations?.products.length) return null;

  return (
    <section aria-labelledby="related-products-title" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <h2 id="related-products-title" className="mb-5 text-xl font-extrabold tracking-tight text-gray-900 sm:text-2xl">
        {recommendations.title}
      </h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4">
        {recommendations.products.map((product) => <ProductCard key={product.id} product={product} />)}
      </div>
    </section>
  );
};

export default RelatedProducts;
