import React, { useState, useEffect } from 'react';
import { FaTimes, FaChevronLeft, FaChevronRight, FaEdit, FaFireAlt } from 'react-icons/fa';
import { FiZoomIn, FiZoomOut } from 'react-icons/fi';
import axios from 'axios';

import ProductReviews from './ProductReviews';
import ProductDetailsTab from './ProductDetailsTab';

const API_BASE_URL = 'http://localhost:8000/api';

const ProductViewModal = ({ product, onClose, onUpdate }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState('details');
  const [editedProduct, setEditedProduct] = useState({
    price: 0,
    stock: 0,
    warranty: '',
    tags: [],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  useEffect(() => {
    if (product) {
      setEditedProduct({
        price: product.price || 0,
        stock: product.stock || 0,
        warranty: product.warranty || '',
        tags: product.tags?.map((tag) => tag.name || tag) || [],
      });
    }
  }, [product, isEditing]);

  if (!product) return null;

  // ✅ Promotion (directly from product)
  const activePromotion = product.promotion?.isActive ? product.promotion : null;
  const hasActivePromotion = !!activePromotion;
  const promotionName = hasActivePromotion ? activePromotion.name : '';
  const discountRate = hasActivePromotion ? activePromotion.discountRate : 0;
  const promotionImage = hasActivePromotion ? activePromotion.image?.url : null;
  const promotionEndDate = hasActivePromotion
    ? new Date(activePromotion.endDate).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : '';

  // ✅ Image navigation
  const handleNextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % (product.images?.length || 1));
    setZoomLevel(1);
  };
  const handlePrevImage = () => {
    setCurrentImageIndex(
      (prev) => (prev - 1 + (product.images?.length || 1)) % (product.images?.length || 1)
    );
    setZoomLevel(1);
  };

  // ✅ Zoom
  const handleZoomIn = () => setZoomLevel((prev) => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setZoomLevel((prev) => Math.max(prev - 0.25, 1));

  // ✅ Edit toggle
  const handleEditToggle = () => {
    setIsEditing(!isEditing);
    setError(null);
    setSuccessMessage(null);
  };

  // ✅ Field change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setEditedProduct((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // ✅ Save product directly
  const handleSave = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.put(`${API_BASE_URL}/products/${product._id}`, {
        price: parseFloat(editedProduct.price),
        stock: parseInt(editedProduct.stock, 10),
        warranty: editedProduct.warranty || '',
        tags: editedProduct.tags,
      });

      onUpdate(response.data);
      setIsEditing(false);
      setSuccessMessage('Product updated successfully!');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save changes');
    } finally {
      setLoading(false);
    }
  };

  const currentImage = product.images?.[currentImageIndex];

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-xl max-w-6xl w-full max-h-[95vh] overflow-hidden flex flex-col border border-gray-200 animate-scale-in">
        {/* Header */}
        <div className="flex justify-between items-center border-b border-gray-200 p-5 bg-white">
          <div className="flex items-center space-x-4">
            <div className="p-2.5 bg-indigo-50 rounded-xl text-indigo-600">
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                ></path>
              </svg>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{product.name || 'Product Details'}</h2>
              <p className="text-sm text-gray-500 mt-1">SKU: {product.reference || 'N/A'}</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            {!isEditing && (
              <button
                onClick={handleEditToggle}
                className="flex items-center space-x-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-all duration-200 shadow-sm hover:shadow-md"
              >
                <FaEdit className="h-4 w-4" />
                <span>Edit Product</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors duration-200"
            >
              <FaTimes className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Messages */}
        {error && (
          <div className="p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-md shadow-sm mx-6 mt-4">
            {error}
          </div>
        )}
        {successMessage && (
          <div className="p-4 bg-green-50 border-l-4 border-green-500 text-green-700 rounded-md shadow-sm mx-6 mt-4">
            {successMessage}
          </div>
        )}

        {/* Content */}
        <div className="flex flex-col lg:flex-row flex-1 overflow-hidden">
          {/* Image Section */}
          <div className="lg:w-1/2 bg-gray-50 p-6 flex flex-col border-r border-gray-200">
            <div className="relative flex-1 flex items-center justify-center bg-white rounded-xl overflow-hidden shadow-sm">
              {product.images?.length > 0 ? (
                <>
                  <img
                    src={currentImage.url}
                    alt={`Product ${currentImageIndex + 1}`}
                    className="max-h-[450px] w-auto object-contain transition-transform duration-300 ease-in-out"
                    style={{ transform: `scale(${zoomLevel})` }}
                  />
                  {hasActivePromotion && (
                    <div className="absolute top-6 left-6 z-10 transform -rotate-6 hover:rotate-0 transition-transform duration-300">
                      <div className="bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-xl shadow-2xl flex items-stretch overflow-hidden min-w-[180px]">
                        {promotionImage ? (
                          <img
                            src={promotionImage}
                            alt={promotionName}
                            className="w-16 h-16 object-cover border-r border-orange-400"
                          />
                        ) : (
                          <div className="w-16 h-16 flex items-center justify-center bg-white/20 border-r border-orange-400">
                            <FaFireAlt className="text-white text-xl" />
                          </div>
                        )}
                        <div className="px-3 py-2 flex flex-col justify-center">
                          <span className="font-bold text-sm block leading-tight">{promotionName}</span>
                          <span className="text-xs font-bold bg-white text-red-600 px-2 py-0.5 rounded-full mt-1 w-fit">
                            {discountRate}% OFF
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                  {product.images.length > 1 && (
                    <>
                      <button
                        onClick={handlePrevImage}
                        className="absolute left-5 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white p-3 rounded-full shadow-lg transition-all duration-200 hover:scale-110"
                      >
                        <FaChevronLeft className="h-5 w-5 text-gray-700" />
                      </button>
                      <button
                        onClick={handleNextImage}
                        className="absolute right-5 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white p-3 rounded-full shadow-lg transition-all duration-200 hover:scale-110"
                      >
                        <FaChevronRight className="h-5 w-5 text-gray-700" />
                      </button>
                    </>
                  )}
                  <div className="absolute bottom-5 right-5 flex flex-col space-y-2 bg-white/90 rounded-xl p-1.5 shadow-lg">
                    <button
                      onClick={handleZoomIn}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-all duration-200 hover:text-indigo-600"
                      disabled={zoomLevel >= 3}
                    >
                      <FiZoomIn className="h-4 w-4 text-gray-700" />
                    </button>
                    <button
                      onClick={handleZoomOut}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-all duration-200 hover:text-indigo-600"
                      disabled={zoomLevel <= 1}
                    >
                      <FiZoomOut className="h-4 w-4 text-gray-700" />
                    </button>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-gray-500">
                  <p>No product images</p>
                </div>
              )}
            </div>
          </div>

          {/* Details Section */}
          <div className="lg:w-1/2 p-6 overflow-y-auto">
            <div className="border-b border-gray-200 mb-6">
              <nav className="flex space-x-4">
                <button
                  onClick={() => setActiveTab('details')}
                  className={`px-4 py-2 text-sm font-medium ${
                    activeTab === 'details'
                      ? 'border-b-2 border-indigo-600 text-indigo-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Details
                </button>
                <button
                  onClick={() => setActiveTab('reviews')}
                  className={`px-4 py-2 text-sm font-medium ${
                    activeTab === 'reviews'
                      ? 'border-b-2 border-indigo-600 text-indigo-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Reviews
                </button>
              </nav>
            </div>

            {activeTab === 'details' && (
              <ProductDetailsTab
                product={product}
                isEditing={isEditing}
                editedProduct={editedProduct}
                onSave={handleSave}
                onCancel={handleEditToggle}
                onChange={handleChange}
                loading={loading}
              />
            )}

            {activeTab === 'reviews' && <ProductReviews productId={product._id} />}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductViewModal;