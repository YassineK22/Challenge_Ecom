import React, { useState, useEffect, useCallback } from "react";
import { useSelector } from "react-redux";
import axios from "axios";
import {
  FiUpload,
  FiCopy,
  FiSearch,
  FiCheck,
  FiX,
  FiCalendar,
  FiPercent,
  FiGift,
} from "react-icons/fi";
import debounce from "lodash.debounce";
import ReusePromotionModal from "./ReusePromotionModal";

const API_BASE_URL = "http://localhost:8000/api/promotions";

const DashPromotion = () => {
  const currentUser = useSelector((state) => state.user.currentUser);

  // Form state
  const [promotionName, setPromotionName] = useState("");
  const [discountRate, setDiscountRate] = useState(15);
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  );
  const [imagePreview, setImagePreview] = useState(null);
  const [imageFile, setImageFile] = useState(null);

  // Product selection
  const [products, setProducts] = useState([]);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [productSearch, setProductSearch] = useState("");
  const [productsPerPage] = useState(10);
  const [totalProducts, setTotalProducts] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Reuse promotions modal
  const [showReuseModal, setShowReuseModal] = useState(false);

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce((searchValue, page) => {
      fetchProducts(searchValue, page);
    }, 500),
    []
  );

  const fetchProducts = async (search = "", page = 1) => {
    try {
      setLoading(true);
      const response = await axios.get(`http://localhost:8000/api/products`, {
        params: {
          page,
          limit: productsPerPage,
          search,
        },
      });
      setProducts(response.data || []);
      setTotalProducts(response.data.length || 0);
      setError(null);
    } catch (err) {
      console.error("Fetch Products Error:", err.response?.data || err.message);
      setError(err.response?.data?.message || "Failed to fetch products");
      setProducts([]);
      setTotalProducts(0);
    } finally {
      setLoading(false);
    }
  };

  // Fetch products when search or page changes
  useEffect(() => {
    debouncedSearch(productSearch, currentPage);
    return () => {
      debouncedSearch.cancel();
    };
  }, [productSearch, currentPage, debouncedSearch]);

  // Handle image upload
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle remove image
  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
  };

  // Handle product selection
  const handleProductToggle = (productId) => {
    setSelectedProducts((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId]
    );
  };

  // Handle select all products
  const handleSelectAll = () => {
    if (selectedProducts.length === products.length) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(products.map((product) => product._id));
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!promotionName || !imageFile || selectedProducts.length === 0) return;

    setSubmitting(true);
    setError(null);
    setSuccess(null);

    const formData = new FormData();
    formData.append("name", promotionName);
    formData.append("discountRate", discountRate);
    formData.append("startDate", startDate.toISOString());
    formData.append("endDate", endDate.toISOString());
    formData.append("applicableProducts", JSON.stringify(selectedProducts));
    formData.append("image", imageFile);
    formData.append("createdBy", currentUser.id);

    try {
      const response = await axios.post(`${API_BASE_URL}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setSuccess("Promotion created successfully!");
      // Reset form
      setPromotionName("");
      setDiscountRate(15);
      setStartDate(new Date());
      setEndDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));
      setImageFile(null);
      setImagePreview(null);
      setSelectedProducts([]);
      setCurrentPage(1);
      setProductSearch("");
    } catch (err) {
      console.error(
        "Create Promotion Error:",
        err.response?.data || err.message
      );
      setError(err.response?.data?.message || "Failed to create promotion");
    } finally {
      setSubmitting(false);
    }
  };

  // Handle form reset
  const handleReset = () => {
    setPromotionName("");
    setDiscountRate(15);
    setStartDate(new Date());
    setEndDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));
    setImageFile(null);
    setImagePreview(null);
    setSelectedProducts([]);
    setProductSearch("");
    setCurrentPage(1);
    setError(null);
    setSuccess(null);
  };

  // Handle reuse promotion
  const handleReusePromotion = (promotion) => {
    setPromotionName(promotion.name);
    setDiscountRate(promotion.discountRate);
    setStartDate(new Date(promotion.startDate));
    setEndDate(new Date(promotion.endDate));
    setSelectedProducts(promotion.applicableProducts.map((p) => p._id));
    setImagePreview(promotion.image.url);
    setImageFile(null);
    setShowReuseModal(false);
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-50 to-gray-100 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center bg-linear-to-r from-purple-600 to-blue-500 text-white p-4 rounded-full shadow-lg mb-4 transform hover:scale-105 transition-transform">
            <FiGift className="text-3xl" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold bg-clip-text bg-linear-to-r from-purple-600 to-blue-500 text-transparent">
            Promotion Creator
          </h1>
          <p className="text-gray-600 mt-3 max-w-2xl mx-auto text-lg">
            Create discount campaigns to attract buyers and increase sales.
          </p>
        </div>

        {/* Success Message */}
        {success && (
          <div className="p-4 bg-green-50 border-l-4 border-green-500 text-green-700 rounded-md shadow-sm mb-6 flex items-center">
            <FiCheck className="w-5 h-5 mr-3" />
            <span>{success}</span>
            <button
              onClick={() => setSuccess(null)}
              className="ml-auto text-green-700 hover:text-green-900"
            >
              <FiX className="h-5 w-5" />
            </button>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-md shadow-sm mb-6 flex items-center">
            <span>{error}</span>
            <button
              onClick={() => setError(null)}
              className="ml-auto text-red-700 hover:text-red-900"
            >
              <FiX className="h-5 w-5" />
            </button>
          </div>
        )}

        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden transition-all hover:shadow-2xl">
          <div className="bg-linear-to-r from-purple-600 to-blue-500 p-6 text-white flex justify-between items-center">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <FiGift /> Create New Promotion
            </h2>
            <button
              onClick={() => setShowReuseModal(true)}
              className="flex items-center gap-2 bg-white/20 hover:bg-white/30 px-5 py-3 rounded-xl transition-all border border-white/20 backdrop-blur-sm"
            >
              <FiCopy className="text-lg" />
              <span>Reuse Template</span>
            </button>
          </div>

          {/* Main Form */}
          <form className="p-6" onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column - Promotion Details */}
              <div className="lg:col-span-1 space-y-6">
                {/* Image Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Banner Image
                    <span className="text-purple-600 ml-1">*</span>
                  </label>
                  <div
                    className={`border-2 ${
                      imagePreview
                        ? "border-transparent"
                        : "border-dashed border-gray-300 hover:border-purple-300"
                    } rounded-xl overflow-hidden transition-all bg-linear-to-br from-gray-50 to-white hover:shadow-sm`}
                  >
                    {imagePreview ? (
                      <div className="relative group">
                        <img
                          src={imagePreview}
                          alt="Promotion banner"
                          className="w-full h-48 md:h-56 object-cover"
                        />
                        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <label className="bg-white text-purple-600 p-2 rounded-full hover:bg-purple-50 transition-colors shadow-md mr-2 cursor-pointer">
                            <FiUpload className="text-lg" />
                            <input
                              type="file"
                              accept="image/jpeg,image/jpg,image/png"
                              className="hidden"
                              onChange={handleImageChange}
                            />
                          </label>
                          <button
                            type="button"
                            onClick={handleRemoveImage}
                            className="bg-white text-red-500 p-2 rounded-full hover:bg-red-50 transition-colors shadow-md"
                            title="Remove image"
                          >
                            <FiX className="text-lg" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <label className="w-full h-48 md:h-56 flex flex-col items-center justify-center p-8 text-center hover:bg-gray-50 transition-colors cursor-pointer">
                        <div className="p-4 bg-purple-100 rounded-full mb-3 transform hover:scale-110 transition-transform">
                          <FiUpload className="text-2xl text-purple-600" />
                        </div>
                        <p className="text-sm text-gray-600 font-medium">
                          Upload promotion banner
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          JPG or PNG, max 5MB
                        </p>
                        <input
                          type="file"
                          accept="image/jpeg,image/jpg,image/png"
                          className="hidden"
                          onChange={handleImageChange}
                        />
                      </label>
                    )}
                  </div>
                </div>

                {/* Promotion Name */}
                <div>
                  <label
                    htmlFor="name"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Promotion Name
                    <span className="text-purple-600 ml-1">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      id="name"
                      value={promotionName}
                      onChange={(e) => setPromotionName(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white transition-all hover:border-purple-300"
                      placeholder="e.g. Summer Sale"
                      required
                    />
                    <div className="absolute left-3 top-3 text-purple-500">
                      <FiGift />
                    </div>
                  </div>
                </div>

                {/* Discount Rate */}
                <div>
                  <label
                    htmlFor="discount"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Discount Rate
                    <span className="text-purple-600 ml-1">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      id="discount"
                      min="0"
                      max="100"
                      value={discountRate}
                      onChange={(e) =>
                        setDiscountRate(parseInt(e.target.value) || 0)
                      }
                      className="w-full pl-10 pr-12 be-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white transition-all hover:border-purple-300"
                      required
                    />
                    <div className="absolute left-3 top-3 text-purple-500">
                      <FiPercent />
                    </div>
                    <div className="absolute right-3 top-3 text-gray-500">
                      %
                    </div>
                  </div>
                  <div className="mt-2 px-1">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={discountRate}
                      onChange={(e) =>
                        setDiscountRate(parseInt(e.target.value))
                      }
                      className="w-full h-2 bg-purple-100 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-purple-600 [&::-webkit-slider-thumb]:hover:bg-purple-700 transition-colors"
                    />
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 mt-1 px-1">
                    <span>0%</span>
                    <span>100%</span>
                  </div>
                </div>

                {/* Date Range */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Promotion Period
                    <span className="text-purple-600 ml-1">*</span>
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="relative">
                      <label className="block text-xs text-gray-500 mb-1">
                        Start Date
                      </label>
                      <input
                        type="date"
                        value={startDate.toISOString().split("T")[0]}
                        onChange={(e) => setStartDate(new Date(e.target.value))}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white transition-all hover:border-purple-300"
                        required
                      />
                      <div className="absolute left-3 top-8 text-purple-500">
                        <FiCalendar />
                      </div>
                    </div>
                    <div className="relative">
                      <label className="block text-xs text-gray-500 mb-1">
                        End Date
                      </label>
                      <input
                        type="date"
                        value={endDate.toISOString().split("T")[0]}
                        onChange={(e) => setEndDate(new Date(e.target.value))}
                        min={startDate.toISOString().split("T")[0]}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white transition-all hover:border-purple-300"
                        required
                      />
                      <div className="absolute left-3 top-8 text-purple-500">
                        <FiCalendar />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column - Product Selection */}
              <div className="lg:col-span-2">
                <div className="bg-linear-to-br from-gray-50 to-white rounded-xl p-5 border border-gray-200 shadow-inner">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                      <FiGift className="text-purple-600" />
                      Select Products
                    </h2>
                    <div className="relative w-full md:w-72">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FiSearch className="text-gray-400" />
                      </div>
                      <input
                        type="text"
                        value={productSearch}
                        onChange={(e) => {
                          setProductSearch(e.target.value);
                          setCurrentPage(1);
                        }}
                        className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white transition-all hover:border-purple-300"
                        placeholder="Search products or categories..."
                      />
                    </div>
                  </div>

                  <div className="bg-white rounded-lg overflow-hidden">
                    <div className="grid grid-cols-12 gap-4 p-3 bg-linear-to-r from-purple-50 to-blue-50 border-b text-xs font-medium text-purple-800 uppercase tracking-wider">
                      <div className="col-span-1 flex items-center">
                        <input
                          type="checkbox"
                          checked={
                            selectedProducts.length === products.length &&
                            products.length > 0
                          }
                          onChange={handleSelectAll}
                          className="h-4 w-4 text-purple-600 border-gray-300 rounded"
                        />
                      </div>
                      <div className="col-span-5">Product</div>
                      <div className="col-span-3">Category</div>
                      <div className="col-span-3">Price</div>
                    </div>

                    <div className="divide-y divide-gray-200 max-h-[500px] overflow-y-auto">
                      {loading ? (
                        <div className="p-8 text-center text-gray-500">
                          Loading products...
                        </div>
                      ) : error ? (
                        <div className="p-8 text-center text-red-500">
                          {error}
                        </div>
                      ) : products.length > 0 ? (
                        products.map((product) => (
                          <div
                            key={product._id}
                            className={`grid grid-cols-12 gap-4 p-3 ${
                              selectedProducts.includes(product._id)
                                ? "bg-purple-50 hover:bg-purple-100"
                                : "hover:bg-gray-50"
                            } transition-colors`}
                          >
                            <div className="col-span-1 flex items-center">
                              <input
                                type="checkbox"
                                checked={selectedProducts.includes(product._id)}
                                onChange={() =>
                                  handleProductToggle(product._id)
                                }
                                className="h-4 w-4 text-purple-600 border-gray-300 rounded"
                              />
                            </div>
                            <div className="col-span-5 flex items-center">
                              <img
                                className="h-12 w-12 object-cover rounded-lg border"
                                src={
                                  product.images?.[0]?.url || "/placeholder.jpg"
                                }
                                alt={product.name}
                              />
                              <div className="ml-3">
                                <p className="text-sm font-medium text-gray-900">
                                  {product.name}
                                </p>
                                <p className="text-xs text-gray-500">
                                  SKU:{" "}
                                  {product.reference || product._id.slice(-5)}
                                </p>
                              </div>
                            </div>
                            <div className="col-span-3 flex items-center text-sm text-gray-600">
                              {product.categoryDetails?.category?.name || "N/A"}
                            </div>
                            <div className="col-span-3 flex items-center text-sm font-medium text-gray-900">
                              ${product.price?.toFixed(2) || "N/A"}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="p-8 text-center text-gray-500">
                          No products found
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Form Actions */}
            <div className="mt-8 flex flex-col-reverse md:flex-row justify-end gap-3">
              <button
                type="button"
                onClick={handleReset}
                className="px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors"
                disabled={submitting}
              >
                Reset Form
              </button>
              <button
                type="submit"
                disabled={
                  !promotionName ||
                  !imageFile ||
                  selectedProducts.length === 0 ||
                  submitting
                }
                className={`px-8 py-3 text-white font-medium rounded-xl shadow-lg transition-all ${
                  !promotionName ||
                  !imageFile ||
                  selectedProducts.length === 0 ||
                  submitting
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-linear-to-r from-purple-600 to-blue-500 hover:from-purple-700 hover:to-blue-600"
                } flex items-center gap-2`}
              >
                <FiGift />
                <span>{submitting ? "Launching..." : "Launch Promotion"}</span>
              </button>
            </div>
          </form>
        </div>
      </div>

      <ReusePromotionModal
        show={showReuseModal}
        onClose={() => setShowReuseModal(false)}
        onSelect={handleReusePromotion}
        currentUser={currentUser}
      />
    </div>
  );
};

export default DashPromotion;
