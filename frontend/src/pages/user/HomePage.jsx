import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { productAPI } from '../../services/api';
import ProductCard from '../../components/shared/ProductCard';
import {
  FiArrowRight, FiTruck, FiRefreshCw, FiShield, FiHeadphones,
  FiChevronLeft, FiChevronRight, FiZap, FiGift, FiStar
} from 'react-icons/fi';

const banners = [
  {
    id: 1,
    title: 'Electronics Sale',
    subtitle: 'Up to 70% off on laptops, phones & more',
    badge: 'Limited Time',
    cta: 'Shop Now',
    gradient: 'from-blue-900 via-blue-800 to-indigo-900',
    category: 'electronics',
    emoji: '💻',
    img: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=800&q=80'
  },
  {
    id: 2,
    title: 'Fashion Week',
    subtitle: 'Trending styles, designer brands, new arrivals',
    badge: 'New Collection',
    cta: 'Explore',
    gradient: 'from-pink-900 via-rose-800 to-red-900',
    category: 'fashion',
    emoji: '👗',
    img: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=800&q=80'
  },
  {
    id: 3,
    title: 'Home Makeover',
    subtitle: 'Furniture, kitchen & home essentials at best prices',
    badge: 'Free Delivery',
    cta: 'Shop Now',
    gradient: 'from-amber-900 via-orange-800 to-yellow-900',
    category: 'home-kitchen',
    emoji: '🏠',
    img: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&q=80'
  },
];

const categories = [
  { name: 'Electronics', slug: 'electronics', icon: '💻', color: 'bg-blue-100 text-blue-800' },
  { name: 'Fashion', slug: 'fashion', icon: '👗', color: 'bg-pink-100 text-pink-800' },
  { name: 'Home & Kitchen', slug: 'home-kitchen', icon: '🏠', color: 'bg-amber-100 text-amber-800' },
  { name: 'Books', slug: 'books', icon: '📚', color: 'bg-emerald-100 text-emerald-800' },
  { name: 'Sports', slug: 'sports', icon: '⚽', color: 'bg-green-100 text-green-800' },
  { name: 'Beauty', slug: 'beauty', icon: '💄', color: 'bg-purple-100 text-purple-800' },
  { name: 'Toys', slug: 'toys', icon: '🧸', color: 'bg-red-100 text-red-800' },
  { name: 'Grocery', slug: 'grocery', icon: '🛒', color: 'bg-lime-100 text-lime-800' },
];

const features = [
  { icon: <FiTruck size={24} />, title: 'Free Delivery', desc: 'On orders above Rs.499', color: 'text-blue-600' },
  { icon: <FiRefreshCw size={24} />, title: 'Easy Returns', desc: '7-day hassle-free returns', color: 'text-green-600' },
  { icon: <FiShield size={24} />, title: 'Secure Payments', desc: '100% protected checkout', color: 'text-purple-600' },
  { icon: <FiHeadphones size={24} />, title: '24/7 Support', desc: 'Dedicated customer care', color: 'text-orange-600' },
];

const HomePage = () => {
  const navigate = useNavigate();
  const [currentBanner, setCurrentBanner] = useState(0);
  const [featured, setFeatured] = useState([]);
  const [popular, setPopular] = useState([]);
  const [newArrivals, setNewArrivals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setInterval(() => setCurrentBanner((p) => (p + 1) % banners.length), 5000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const load = async () => {
      try {
        const [feat, pop, newArr] = await Promise.all([
          productAPI.getFeatured(),
          productAPI.getAll({ sort: 'popular', limit: 8 }),
          productAPI.getAll({ sort: 'newest', limit: 8 }),
        ]);
        setFeatured(feat.data.products || []);
        setPopular(pop.data.products || []);
        setNewArrivals(newArr.data.products || []);
      } catch {}
      setLoading(false);
    };
    load();
  }, []);

  const banner = banners[currentBanner];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Banner */}
      <div className="relative overflow-hidden">
        <div className={`bg-gradient-to-r ${banner.gradient} transition-all duration-700`}>
          <div className="max-w-7xl mx-auto px-4 py-12 md:py-20 flex items-center justify-between">
            <div className="text-white max-w-xl">
              <span className="bg-yellow-400 text-gray-900 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide">
                {banner.badge}
              </span>
              <h1 className="text-4xl md:text-6xl font-black mt-4 leading-tight">{banner.title}</h1>
              <p className="text-white/80 text-lg mt-3">{banner.subtitle}</p>
              <button
                onClick={() => navigate(`/products?category=${banner.category}`)}
                className="mt-6 bg-yellow-400 hover:bg-yellow-300 text-gray-900 font-bold px-8 py-3 rounded-full flex items-center gap-2 transition text-lg shadow-xl"
              >
                {banner.cta} <FiArrowRight />
              </button>
            </div>
            <div className="hidden md:block text-[8rem] opacity-20 select-none">{banner.emoji}</div>
          </div>
        </div>

        {/* Banner Controls */}
        <button
          onClick={() => setCurrentBanner((p) => (p - 1 + banners.length) % banners.length)}
          className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 text-white p-2 rounded-full backdrop-blur transition"
        >
          <FiChevronLeft size={20} />
        </button>
        <button
          onClick={() => setCurrentBanner((p) => (p + 1) % banners.length)}
          className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 text-white p-2 rounded-full backdrop-blur transition"
        >
          <FiChevronRight size={20} />
        </button>
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
          {banners.map((_, i) => (
            <button key={i} onClick={() => setCurrentBanner(i)}
              className={"w-8 h-1.5 rounded-full transition-all " + (i === currentBanner ? 'bg-yellow-400' : 'bg-white/40')}
            />
          ))}
        </div>
      </div>

      {/* Features Bar */}
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {features.map((f, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className={f.color}>{f.icon}</div>
                <div>
                  <p className="font-semibold text-sm text-gray-800">{f.title}</p>
                  <p className="text-xs text-gray-400">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 space-y-12">

        {/* Categories */}
        <section>
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-2xl font-black text-gray-800">Shop by Category</h2>
            <Link to="/products" className="text-blue-600 text-sm font-semibold hover:underline flex items-center gap-1">
              All Categories <FiArrowRight size={14} />
            </Link>
          </div>
          <div className="grid grid-cols-4 md:grid-cols-8 gap-3">
            {categories.map((cat) => (
              <Link
                key={cat.slug}
                to={`/products?category=${cat.slug}`}
                className="flex flex-col items-center gap-2 p-4 bg-white rounded-2xl border border-gray-100 hover:shadow-lg hover:-translate-y-1 transition-all group"
              >
                <span className="text-3xl group-hover:scale-110 transition-transform">{cat.icon}</span>
                <span className="text-xs font-semibold text-gray-700 text-center leading-tight">{cat.name}</span>
              </Link>
            ))}
          </div>
        </section>

        {/* Deal Banners */}
        <div className="grid md:grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl p-6 text-white">
            <FiZap size={28} className="text-yellow-300 mb-2" />
            <h3 className="text-xl font-black">Flash Deals</h3>
            <p className="text-blue-200 text-sm mt-1">Up to 80% off — ends in 2 hours</p>
            <Link to="/products?sort=popular" className="mt-4 inline-block bg-yellow-400 text-gray-900 font-bold px-4 py-2 rounded-full text-sm hover:bg-yellow-300 transition">
              Grab Now
            </Link>
          </div>
          <div className="bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl p-6 text-white">
            <FiGift size={28} className="text-yellow-300 mb-2" />
            <h3 className="text-xl font-black">Gift Cards</h3>
            <p className="text-purple-200 text-sm mt-1">Perfect gift for every occasion</p>
            <Link to="/products?category=electronics" className="mt-4 inline-block bg-yellow-400 text-gray-900 font-bold px-4 py-2 rounded-full text-sm hover:bg-yellow-300 transition">
              Buy Gift Card
            </Link>
          </div>
          <div className="bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl p-6 text-white">
            <FiStar size={28} className="text-yellow-300 mb-2" />
            <h3 className="text-xl font-black">Top Rated</h3>
            <p className="text-orange-200 text-sm mt-1">Products loved by 1M+ customers</p>
            <Link to="/products?sort=rating" className="mt-4 inline-block bg-yellow-400 text-gray-900 font-bold px-4 py-2 rounded-full text-sm hover:bg-yellow-300 transition">
              Explore
            </Link>
          </div>
        </div>

        {/* Featured Products */}
        {featured.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-2xl font-black text-gray-800">Featured Products</h2>
                <p className="text-gray-400 text-sm mt-0.5">Hand-picked just for you</p>
              </div>
              <Link to="/products" className="text-blue-600 text-sm font-semibold hover:underline flex items-center gap-1">
                View All <FiArrowRight size={14} />
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-4">
              {featured.slice(0, 8).map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
          </section>
        )}

        {/* Popular Products */}
        {popular.length > 0 && (
          <section>
            <div className="flex items-center gap-3 mb-5">
              <div className="flex items-center gap-2 bg-orange-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                <FiZap size={14} /> Bestsellers
              </div>
              <h2 className="text-2xl font-black text-gray-800">Most Popular</h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-4">
              {popular.map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
          </section>
        )}

        {/* New Arrivals */}
        {newArrivals.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-2xl font-black text-gray-800">New Arrivals</h2>
                <p className="text-gray-400 text-sm mt-0.5">Just landed in our store</p>
              </div>
              <Link to="/products?sort=newest" className="text-blue-600 text-sm font-semibold hover:underline flex items-center gap-1">
                See All <FiArrowRight size={14} />
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-4">
              {newArrivals.map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
          </section>
        )}

        {/* Vendor CTA */}
        <section className="bg-gradient-to-r from-blue-900 to-indigo-900 rounded-3xl overflow-hidden relative">
          <div className="px-8 py-12 text-white max-w-xl">
            <p className="text-yellow-400 font-bold text-sm uppercase tracking-widest">For Sellers</p>
            <h2 className="text-3xl font-black mt-2 leading-tight">Start Selling on ShopMart</h2>
            <p className="text-blue-200 mt-3">Join 10,000+ vendors. Reach millions of customers. Zero setup fee.</p>
            <div className="flex gap-4 mt-6">
              <Link to="/vendor/register" className="bg-yellow-400 text-gray-900 font-bold px-6 py-3 rounded-full hover:bg-yellow-300 transition">
                Start Selling
              </Link>
              <Link to="/vendor/register" className="border border-white/30 text-white font-semibold px-6 py-3 rounded-full hover:bg-white/10 transition">
                Learn More
              </Link>
            </div>
          </div>
          <div className="absolute right-8 top-1/2 -translate-y-1/2 text-[8rem] opacity-10 hidden md:block select-none">🏪</div>
        </section>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 mt-16">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="bg-yellow-400 text-blue-900 font-black px-2 py-1 rounded text-lg">SM</div>
                <span className="text-white font-bold text-xl">ShopMart</span>
              </div>
              <p className="text-sm text-gray-400">India's fastest growing multi-vendor marketplace.</p>
            </div>
            {[
              { title: 'Shopping', links: ['All Products', 'New Arrivals', 'Best Sellers', 'Deals'] },
              { title: 'Help', links: ['Contact Us', 'Track Order', 'Returns', 'FAQ'] },
              { title: 'Business', links: ['Sell on ShopMart', 'Vendor Login', 'Partner with Us', 'Advertise'] },
            ].map((col) => (
              <div key={col.title}>
                <h4 className="text-white font-semibold mb-4">{col.title}</h4>
                <ul className="space-y-2">
                  {col.links.map((l) => (
                    <li key={l}>
                      <Link to="/products" className="text-sm text-gray-400 hover:text-white transition">{l}</Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-gray-400">© 2025 ShopMart. All rights reserved.</p>
            <div className="flex gap-4 text-sm text-gray-400">
              <Link to="/products" className="hover:text-white transition">Privacy Policy</Link>
              <Link to="/products" className="hover:text-white transition">Terms of Service</Link>
              <Link to="/products" className="hover:text-white transition">Cookie Policy</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
