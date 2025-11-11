import React, { useState, useEffect } from 'react';
import { FaBoxOpen, FaSearch, FaSpinner, FaTimes } from 'react-icons/fa';
import axios from 'axios';
import CategorySelector from './CategorySelector';
import TagSelector from './TagSelector';
import ImageUploader from './ImageUploader';
import { useSelector } from "react-redux";

const API_BASE_URL = 'http://localhost:8000/api';

const DashAddInventory = () => {
  const currentUser = useSelector((state) => state.user.currentUser);
  const [formData, setFormData] = useState({
    reference: '',
    name: '',
    description: '',
    images: [],
    categoryDetails: {
      category: null,
      subcategory: {
        group: '',
        item: ''
      }
    },
    tags: [],
    price: '',
    stock: ''
  });

  const [categories, setCategories] = useState([]);
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState({
    categories: true,
    tags: true,
    form: false,
    images: false,
    searching: false
  });
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);

  // Fetch categories and tags
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [categoriesRes, tagsRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/categories`),
          axios.get(`${API_BASE_URL}/product-tags`)
        ]);

        setCategories(categoriesRes?.data || []);
        setTags(tagsRes?.data || []);
      } catch (err) {
        setError(err.response?.data?.message || err.message);
      } finally {
        setLoading(prev => ({
          ...prev,
          categories: false,
          tags: false
        }));
      }
    };
    fetchData();
  }, []);

  // Optional: Search existing products by reference
  const handleReferenceSearch = async (query) => {
    if (!query || query.length < 3) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    try {
      setLoading(prev => ({ ...prev, searching: true }));
      const response = await axios.get(`${API_BASE_URL}/products/search`, {
        params: { q: query }
      });
      setSearchResults(response.data.products || []);
      setShowSearchResults(true);
    } catch (err) {
      setSearchResults([]);
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(prev => ({ ...prev, searching: false }));
    }
  };

  const handleTagSelect = (tagId) => {
    if (!formData.tags.includes(tagId)) {
      setFormData(prev => ({ ...prev, tags: [...prev.tags, tagId] }));
    }
  };

  const removeTag = (tagId) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(id => id !== tagId)
    }));
  };

  const addNewTag = async (tagName) => {
    if (!tagName) return;
    try {
      setLoading(prev => ({ ...prev, form: true }));
      const response = await axios.post(`${API_BASE_URL}/product-tags`, { name: tagName });
      setTags(prev => [...prev, response.data]);
      handleTagSelect(response.data._id);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(prev => ({ ...prev, form: false }));
    }
  };

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    try {
      setLoading(prev => ({ ...prev, images: true }));

      const imagePreviews = files.map(file => ({
        file,
        url: URL.createObjectURL(file)
      }));

      setFormData(prev => ({
        ...prev,
        images: [...prev.images, ...imagePreviews]
      }));
    } catch {
      setError("Failed to process images");
    } finally {
      setLoading(prev => ({ ...prev, images: false }));
    }
  };

  const removeImage = async (index) => {
    try {
      setLoading(prev => ({ ...prev, images: true }));
      setFormData(prev => {
        const updatedImages = [...prev.images];
        if (updatedImages[index]?.url) {
          URL.revokeObjectURL(updatedImages[index].url);
        }
        updatedImages.splice(index, 1);
        return { ...prev, images: updatedImages };
      });
    } catch {
      setError("Failed to remove image");
    } finally {
      setLoading(prev => ({ ...prev, images: false }));
    }
  };

  const handleAddNewCategory = async (newCategoryData) => {
    try {
      setLoading(prev => ({ ...prev, form: true }));
      const response = await axios.post(`${API_BASE_URL}/categories`, {
        name: newCategoryData.name,
        subcategories: [{
          group: newCategoryData.group,
          items: [newCategoryData.item]
        }]
      });

      setCategories(prev => [...prev, response.data]);
      setFormData(prev => ({
        ...prev,
        categoryDetails: {
          category: response.data._id,
          subcategory: {
            group: newCategoryData.group,
            item: newCategoryData.item
          }
        }
      }));
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(prev => ({ ...prev, form: false }));
    }
  };

  const handleAddSubcategoryToExisting = async (categoryId, subcategoryData) => {
    try {
      setLoading(prev => ({ ...prev, form: true }));
      await axios.patch(`${API_BASE_URL}/categories/${categoryId}/subcategories`, {
        group: subcategoryData.group,
        items: subcategoryData.items
      });
      const response = await axios.get(`${API_BASE_URL}/categories`);
      setCategories(response.data || []);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(prev => ({ ...prev, form: false }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!formData.reference) return setError("Product reference is required");
    if (!formData.name || !formData.description) return setError("Name and description are required");
    if (!formData.price || isNaN(formData.price) || formData.price <= 0) return setError("Enter a valid price");
    if (!formData.stock || isNaN(formData.stock) || formData.stock < 0) return setError("Enter a valid stock quantity");
    if (!formData.categoryDetails.category || !formData.categoryDetails.subcategory.group || !formData.categoryDetails.subcategory.item)
      return setError("Complete category details are required");

    try {
      setLoading(prev => ({ ...prev, form: true }));

      const formDataToSend = new FormData();
      formDataToSend.append('reference', formData.reference);
      formDataToSend.append('name', formData.name);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('price', formData.price);
      formDataToSend.append('stock', formData.stock);
      formDataToSend.append('categoryDetails[category]', formData.categoryDetails.category);
      formDataToSend.append('categoryDetails[subcategory][group]', formData.categoryDetails.subcategory.group);
      formDataToSend.append('categoryDetails[subcategory][item]', formData.categoryDetails.subcategory.item);
      formDataToSend.append('createdBy', currentUser?._id || currentUser?.id);

      formData.tags.forEach(tag => formDataToSend.append('tags', tag));
      formData.images.forEach(image => {
        if (image.file) formDataToSend.append('images', image.file);
      });

      await axios.post(`${API_BASE_URL}/products`, formDataToSend, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setSuccess("Product created successfully!");
      setFormData({
        reference: '',
        name: '',
        description: '',
        images: [],
        categoryDetails: { category: null, subcategory: { group: '', item: '' } },
        tags: [],
        price: '',
        stock: '',
        createdBy: ''
      });
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.message || "Failed to create product");
    } finally {
      setLoading(prev => ({ ...prev, form: false }));
    }
  };

  if (loading.categories || loading.tags) {
    return (
      <div className="flex justify-center items-center h-64">
        <FaSpinner className="animate-spin text-4xl text-purple-600" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <div className="flex items-center mb-6">
        <FaBoxOpen className="text-2xl text-purple-600 mr-3" />
        <h2 className="text-2xl font-bold text-gray-800">Add New Product</h2>
      </div>

      {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">{error}</div>}
      {success && <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-md">{success}</div>}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Product Reference*</label>
          <input
            type="text"
            name="reference"
            value={formData.reference}
            onChange={(e) => {
              setFormData({ ...formData, reference: e.target.value });
              handleReferenceSearch(e.target.value);
            }}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Product Name*</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description*</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
              required
            />
          </div>
        </div>

        <CategorySelector
          categories={categories}
          selectedCategory={formData.categoryDetails.category}
          selectedSubcategory={formData.categoryDetails.subcategory}
          onSelectCategory={(categoryId) => {
            setFormData(prev => ({
              ...prev,
              categoryDetails: {
                category: categoryId,
                subcategory: { group: '', item: '' }
              }
            }));
          }}
          onSelectSubcategory={(subcategory) => {
            setFormData(prev => ({
              ...prev,
              categoryDetails: { ...prev.categoryDetails, subcategory }
            }));
          }}
          onAddNewCategory={handleAddNewCategory}
          onAddSubcategoryToExisting={handleAddSubcategoryToExisting}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Price*</label>
            <input
              type="number"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              min="0.01"
              step="0.01"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Stock*</label>
            <input
              type="number"
              value={formData.stock}
              onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
              min="0"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
              required
            />
          </div>
        </div>

        <TagSelector
          tags={tags}
          selectedTags={formData.tags}
          onSelectTag={handleTagSelect}
          onRemoveTag={removeTag}
          onAddNewTag={addNewTag}
          loading={loading.form}
        />

        <ImageUploader
          images={formData.images}
          onUpload={handleImageUpload}
          onRemove={removeImage}
          loading={loading.images}
        />

        <div className="pt-4">
          <button
            type="submit"
            disabled={loading.form}
            className={`w-full flex justify-center items-center bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-4 rounded-md transition duration-150 ease-in-out ${
              loading.form ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {loading.form ? <><FaSpinner className="animate-spin mr-2" /> Creating Product...</> : 'Create Product'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default DashAddInventory;
