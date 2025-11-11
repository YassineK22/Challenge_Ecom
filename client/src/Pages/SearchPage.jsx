import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { useSelector, useDispatch } from "react-redux";
import { toast } from "react-toastify";
import { useTranslation } from "react-i18next";
import {
  FaSpinner,
  FaShoppingBag,
  FaFilter,
  FaSearch,
  FaTimes,
  FaStar,
} from "react-icons/fa";
import ProductCard from "../components/ProductCard";

const SearchPage = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser } = useSelector((state) => state.user);
  const wishlistItems = useSelector((state) => state.wishlist.items || []);

  // Get initial query from URL
  const queryParams = new URLSearchParams(location.search);
  const initialQuery = queryParams.get("q") || "";

  const [searchParams, setSearchParams] = useState({
    q: initialQuery,
    category: "",
    minPrice: "",
    maxPrice: "",
    rating: "",
    inStock: false,
    page: 1,
    limit: 20,
  });

  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const API_URL = "http://localhost:8000/api/wishlist";

  // Sync query with URL
  useEffect(() => {
    if (searchParams.q !== initialQuery) {
      navigate(`/search?q=${encodeURIComponent(searchParams.q)}`, {
        replace: true,
      });
    }
  }, [searchParams.q, navigate, initialQuery]);

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await axios.get("http://localhost:8000/api/categories");
        setCategories(res.data);
      } catch {
        setError(t("productCategory.errors.loadError"));
      }
    };
    fetchCategories();
  }, [t]);

  // Fetch wishlist
  useEffect(() => {
    const fetchWishlist = async () => {
      if (!currentUser) return;
      try {
        const res = await axios.get(`${API_URL}?userId=${currentUser.id}`);
        dispatch({
          type: "wishlist/setWishlist",
          payload: res.data.items.map((item) => ({
            ...item,
            price: item.price || item.productId?.price || 0,
            stock: item.stock || item.productId?.stock || 0,
          })),
        });
      } catch {
        toast.error(t("productCategory.errors.wishlist.loadError"));
      }
    };
    fetchWishlist();
  }, [currentUser, dispatch, t]);

  // Fetch products
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await axios.get(
          "http://localhost:8000/api/products/search",
          {
            params: searchParams,
          }
        );
        setProducts(res.data.products);
        setTotalPages(res.data.totalPages);
        setTotalProducts(res.data.total);
      } catch (err) {
        setError(
          err.response?.data?.message || t("productCategory.errors.loadError")
        );
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [searchParams, t]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSearchParams((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
      page: 1,
    }));
  };

  const handlePageChange = (newPage) => {
    setSearchParams((prev) => ({ ...prev, page: newPage }));
  };

  const handleWishlistToggle = async (productId, isAdded) => {
    if (!currentUser) {
      toast.error(t("productCategory.errors.wishlist.loginRequired"));
      return;
    }

    try {
      if (isAdded) {
        const product = products.find((p) => p._id === productId);
        const response = await axios.post(`${API_URL}/add`, {
          userId: currentUser.id,
          productId,
          price: product.price,
          stock: product.stock,
        });
        dispatch({
          type: "wishlist/addItem",
          payload: {
            ...response.data.wishlist.items.slice(-1)[0],
            price: product.price,
            stock: product.stock,
          },
        });
        toast.success(t("productCategory.errors.wishlist.addSuccess"));
      } else {
        const res = await axios.get(`${API_URL}?userId=${currentUser.id}`);
        const wishlist = res.data;
        const item = wishlist.items.find(
          (item) => item.productId._id === productId
        );
        if (item) {
          await axios.delete(`${API_URL}/item`, {
            data: { userId: currentUser.id, itemId: item._id },
          });
          dispatch({ type: "wishlist/removeItem", payload: item._id });
          toast.success(t("productCategory.errors.wishlist.removeSuccess"));
        }
      }
    } catch (err) {
      toast.error(
        err.response?.data?.message ||
          t("productCategory.errors.wishlist.error")
      );
    }
  };

  const clearFilters = () => {
    setSearchParams({
      q: "",
      category: "",
      minPrice: "",
      maxPrice: "",
      rating: "",
      inStock: false,
      page: 1,
      limit: 20,
    });
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Filters and layout */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-baseline justify-between border-b border-gray-200 pb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
            {t("productCategory.title")}
          </h1>

          <button
            type="button"
            className="-m-2 ml-4 p-2 text-gray-400 hover:text-gray-500 sm:ml-6 lg:hidden"
            onClick={() => setMobileFiltersOpen(true)}
          >
            <FaFilter className="h-5 w-5" />
          </button>
        </div>

        <div className="pt-6 lg:grid lg:grid-cols-5 lg:gap-x-8">
          {/* Filters */}
          <div className="hidden lg:block lg:col-span-1">
            <div className="space-y-6 bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("search.search")}
                </label>
                <div className="relative mt-1 rounded-md shadow-sm">
                  <FaSearch className="absolute left-3 top-2.5 text-gray-400" />
                  <input
                    type="text"
                    name="q"
                    value={searchParams.q}
                    onChange={handleInputChange}
                    placeholder={t("search.placeholder")}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>
              </div>

              {/* Category */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">
                  {t("search.category")}
                </h3>
                <select
                  name="category"
                  value={searchParams.category}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                >
                  <option value="">{t("search.allCategories")}</option>
                  {categories.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-4">
                  {t("search.priceRange")}
                </h3>
                <div className="px-2">
                  <div className="relative h-1 bg-gray-200 rounded-full mb-6">
                    <div
                      className="absolute h-1 bg-indigo-500 rounded-full"
                      style={{
                        left: `${(searchParams.minPrice / 3000) * 100}%`,
                        right: `${100 - (searchParams.maxPrice / 3000) * 100}%`,
                      }}
                    />
                    <input
                      type="range"
                      min="0"
                      max="3000"
                      step="10"
                      value={searchParams.minPrice || 0}
                      onChange={(e) =>
                        setSearchParams((prev) => ({
                          ...prev,
                          minPrice: e.target.value,
                          page: 1,
                        }))
                      }
                      className="absolute w-full h-1 opacity-0 cursor-pointer -top-1"
                    />
                    <input
                      type="range"
                      min="0"
                      max="3000"
                      step="10"
                      value={searchParams.maxPrice || 3000}
                      onChange={(e) =>
                        setSearchParams((prev) => ({
                          ...prev,
                          maxPrice: e.target.value,
                          page: 1,
                        }))
                      }
                      className="absolute w-full h-1 opacity-0 cursor-pointer -top-1"
                    />
                  </div>
                  <div className="flex justify-between">
                    <input
                      type="number"
                      name="minPrice"
                      value={searchParams.minPrice || ""}
                      onChange={handleInputChange}
                      placeholder="0"
                      className="w-20 px-2 py-1 text-sm border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                    />
                    <input
                      type="number"
                      name="maxPrice"
                      value={searchParams.maxPrice || ""}
                      onChange={handleInputChange}
                      placeholder="3000"
                      className="w-20 px-2 py-1 text-sm border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">
                  {t("search.rating")}
                </h3>
                <div className="flex flex-col space-y-2">
                  {[5, 4, 3, 2, 1].map((rating) => (
                    <button
                      key={rating}
                      type="button"
                      onClick={() =>
                        setSearchParams((prev) => ({
                          ...prev,
                          rating:
                            prev.rating === rating.toString()
                              ? ""
                              : rating.toString(),
                        }))
                      }
                      className={`flex items-center group ${
                        searchParams.rating === rating.toString()
                          ? "text-amber-500"
                          : "text-gray-400 hover:text-amber-400"
                      }`}
                    >
                      <div className="flex mr-2">
                        {[...Array(5)].map((_, i) => (
                          <FaStar
                            key={i}
                            className={`w-4 h-4 ${
                              i < rating
                                ? "fill-current"
                                : "fill-none stroke-current stroke-2"
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-xs font-medium group-hover:text-gray-700">
                        {t(`search.rating${rating}`)}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Stock */}
              <div className="flex items-center">
                <input
                  id="inStock"
                  name="inStock"
                  type="checkbox"
                  checked={searchParams.inStock}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                />
                <label htmlFor="inStock" className="ml-2 text-sm text-gray-700">
                  {t("search.inStock")}
                </label>
              </div>

              <button
                onClick={clearFilters}
                className="w-full py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                {t("search.clearFilters")}
              </button>
            </div>
          </div>

          {/* Product grid */}
          <div className="lg:col-span-4">
            {loading ? (
              <div className="flex justify-center py-20">
                <FaSpinner className="animate-spin text-indigo-600 text-3xl" />
              </div>
            ) : error ? (
              <div className="text-red-600 text-center py-10">{error}</div>
            ) : products.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {products.map((product) => {
                  const isWishlisted = wishlistItems.some(
                    (item) => item.productId._id === product._id
                  );
                  return (
                    <ProductCard
                      key={product._id}
                      product={product}
                      isWishlisted={isWishlisted}
                      onWishlistToggle={handleWishlistToggle}
                    />
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-16">
                <FaShoppingBag className="mx-auto text-5xl text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-700">
                  {t("productCategory.noProducts.title")}
                </h3>
                <p className="text-gray-500 mt-2">
                  {t("productCategory.noProducts.description")}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SearchPage;
