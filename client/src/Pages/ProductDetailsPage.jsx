import React, { useState, useEffect, useRef } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import {
  FaStar,
  FaRegStar,
  FaShoppingCart,
  FaCheck,
  FaFireAlt,
} from "react-icons/fa";
import { IoMdHeart, IoMdHeartEmpty } from "react-icons/io";
import { RiLeafLine, RiExchangeLine } from "react-icons/ri";
import { BsShieldCheck, BsBoxSeam, BsCheckCircleFill } from "react-icons/bs";
import axios from "axios";
import { toast } from "react-toastify";
import { useSelector, useDispatch } from "react-redux";
import {
  addItem as addWishlistItem,
  removeItem as removeWishlistItem,
} from "../redux/user/wishlistSlice";
import { addItem as addCartItem } from "../redux/user/cartSlice";
import ProductImageGallery from "../components/ProductImageGallery";
import ProductReviews from "../components/ProductReviews";
import BreadcrumbNav from "../components/BreadcrumbNav";
import SimilarProducts from "../components/SimilarProducts";
import { useTranslation } from "react-i18next";

const ProductDetailsPage = () => {
  const { t } = useTranslation();
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { currentUser } = useSelector((state) => state.user);
  const wishlistItems = useSelector((state) => state.wishlist.items || []);
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState(
    location.state?.openReviews ? "reviews" : "description"
  );
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [isTogglingWishlist, setIsTogglingWishlist] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [averageRating, setAverageRating] = useState(0);
  const [reviewCount, setReviewCount] = useState(0);
  const reviewsRef = useRef(null);

  const API_URL = "http://localhost:8000/api";

  // 🧩 Fetch product data
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${API_URL}/products/${id}`);
        setProduct(response.data.product);
        if (response.data.product.variants?.length > 0) {
          setSelectedVariant(response.data.product.variants[0]);
        }
      } catch (err) {
        setError(err.response?.data?.message || t("product.fetchError"));
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id, t]);

  // 🧩 Fetch reviews
  useEffect(() => {
    if (product?._id) {
      const fetchReviews = async () => {
        try {
          const response = await axios.get(`${API_URL}/reviews/${product._id}`);
          const reviews = response.data;
          const avgRating =
            reviews.length > 0
              ? (
                  reviews.reduce(
                    (sum, review) => sum + (review.rating || 0),
                    0
                  ) / reviews.length
                ).toFixed(1)
              : 0;
          setAverageRating(parseFloat(avgRating));
          setReviewCount(reviews.length);
        } catch {
          setAverageRating(0);
          setReviewCount(0);
        }
      };
      fetchReviews();
    }
  }, [product]);

  // 🧩 Handle wishlist state
  useEffect(() => {
    if (product && currentUser) {
      const wishlisted = wishlistItems.some(
        (item) => item.productId?._id === product._id
      );
      setIsWishlisted(wishlisted);
    }
  }, [product, wishlistItems, currentUser]);

  // 🧩 Auto scroll to reviews
  useEffect(() => {
    if (location.state?.openReviews && reviewsRef.current && !loading) {
      reviewsRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [location.state, loading]);

  const getKeyFeatures = () => {
    if (!product?.description) return [];
    return product.description
      .split("\r\n")
      .filter((line) => line.trim())
      .slice(0, 5);
  };

  // 🛒 Add to cart
  const handleAddToCart = async () => {
    if (!currentUser) return toast.error(t("product.mustLogin"));
    if (!product.stock || product.stock < quantity)
      return toast.error(t("product.outOfStock"));

    try {
      const response = await axios.post(`${API_URL}/cart/add`, {
        userId: currentUser.id,
        productId: product._id,
        quantity,
        price: product.price,
        variantId: selectedVariant?._id,
      });

      // ✅ Correct access to items
      const cartData = response.data.data; // <--- your API returns the cart in data
      const newItem = cartData.items.at(-1);

      dispatch(
        addCartItem({
          ...newItem,
          productId: product, // attach product details for frontend
          price: product.price,
          stock: product.stock,
          variantId: selectedVariant?._id,
        })
      );

      toast.success(t("product.addedToCart"), {
        position: "bottom-right",
      });
    } catch (err) {
      toast.error(err.response?.data?.message || t("product.cartError"));
    }
  };

  // 💖 Wishlist
  const toggleWishlist = async () => {
    if (!currentUser) return toast.error(t("product.mustLoginWishlist"));
    if (isTogglingWishlist) return;

    setIsTogglingWishlist(true);
    try {
      if (isWishlisted) {
        const item = wishlistItems.find(
          (item) => item.productId?._id === product._id
        );
        if (item) {
          await axios.delete(`${API_URL}/wishlist/item`, {
            data: { userId: currentUser.id, itemId: item._id },
          });
          dispatch(removeWishlistItem(item._id));
          toast.success(t("product.removedFromWishlist"));
        }
      } else {
        const response = await axios.post(`${API_URL}/wishlist/add`, {
          userId: currentUser.id,
          productId: product._id,
          price: product.price,
          stock: product.stock || 0,
          variantId: selectedVariant?._id,
        });

        const newItem = response.data.wishlist.items.find(
          (i) => i.productId?._id === product._id
        );
        if (newItem) dispatch(addWishlistItem({ ...newItem, product }));
        toast.success(t("product.addedToWishlist"));
      }
      setIsWishlisted(!isWishlisted);
    } catch (err) {
      toast.error(err.response?.data?.message || t("product.wishlistError"));
    } finally {
      setIsTogglingWishlist(false);
    }
  };

  const renderStars = (rating) =>
    Array(5)
      .fill(0)
      .map((_, i) =>
        i < Math.floor(rating) ? (
          <FaStar key={i} className="text-yellow-400" />
        ) : (
          <FaRegStar key={i} className="text-gray-300" />
        )
      );

  if (loading)
    return <div className="p-6 text-gray-500">{t("product.loading")}</div>;
  if (error)
    return (
      <div className="p-6 text-red-600 text-center">
        {t("product.fetchError")}: {error}
      </div>
    );

  const keyFeatures = getKeyFeatures();

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <BreadcrumbNav product={product} />

        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="md:flex">
            <ProductImageGallery
              images={product.images || []}
              productName={product.name}
            />

            <div className="md:w-1/2 p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <span className="inline-block bg-purple-100 text-purple-600 text-xs px-2 py-1 rounded-full mb-2">
                    {product.categoryDetails?.category?.name}
                  </span>
                  <h1 className="text-2xl font-bold">{product.name}</h1>
                  <p className="text-gray-500">{product.shortDescription}</p>
                </div>
                <button
                  onClick={toggleWishlist}
                  disabled={isTogglingWishlist}
                  className={`p-2 rounded-full ${
                    isWishlisted
                      ? "text-red-500 hover:bg-red-50"
                      : "text-gray-400 hover:text-red-500 hover:bg-gray-100"
                  }`}
                >
                  {isWishlisted ? (
                    <IoMdHeart size={24} />
                  ) : (
                    <IoMdHeartEmpty size={24} />
                  )}
                </button>
              </div>

              <div className="flex items-center mb-5">
                <div className="flex mr-2">{renderStars(averageRating)}</div>
                <span className="text-sm text-gray-500">
                  {averageRating.toFixed(1)} ({reviewCount}{" "}
                  {t("product.reviews")}) •{" "}
                  <span className="text-green-600">
                    {product.stock > 0
                      ? t("product.inStock")
                      : t("product.outOfStock")}
                  </span>
                </span>
              </div>

              <div className="mb-4">
                <span className="text-3xl font-bold">
                  ${product.price.toFixed(2)}
                </span>
                {product.discount && (
                  <span className="ml-2 text-red-500 text-sm">
                    -{product.discount}% {t("product.off")}
                  </span>
                )}
              </div>

              {keyFeatures.length > 0 && (
                <div className="mb-6">
                  <h3 className="font-medium text-lg text-gray-900 mb-3">
                    {t("product.keyFeatures")}
                  </h3>
                  <ul className="space-y-3">
                    {keyFeatures.map((feature, index) => (
                      <li key={index} className="flex items-start">
                        <FaCheck className="text-purple-500 mt-0.5 mr-2 shrink-0 text-sm" />
                        <span className="text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="flex items-center mb-4">
                <span className="mr-3 font-medium">
                  {t("product.quantity")}:
                </span>
                <div className="flex items-center border border-gray-300 rounded-lg">
                  <button
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="px-3 py-2"
                  >
                    -
                  </button>
                  <span className="px-4 border-x">{quantity}</span>
                  <button
                    onClick={() =>
                      setQuantity((q) => Math.min(product.stock, q + 1))
                    }
                    className="px-3 py-2"
                  >
                    +
                  </button>
                </div>
              </div>

              <button
                onClick={handleAddToCart}
                disabled={product.stock <= 0}
                className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium flex items-center justify-center"
              >
                <FaShoppingCart className="mr-3" />
                {product.stock > 0
                  ? t("product.addToCart")
                  : t("product.soldOut")}
              </button>

              <div className="flex justify-center gap-4 text-xs text-gray-500 border-t pt-4 mt-6">
                <div className="flex items-center">
                  <BsShieldCheck className="text-green-500 mr-1" />
                  {t("product.securePayment")}
                </div>
                <div className="flex items-center">
                  <BsBoxSeam className="text-blue-500 mr-1" />
                  {t("product.freeReturns")}
                </div>
                <div className="flex items-center">
                  <RiExchangeLine className="text-purple-500 mr-1" />
                  {t("product.returnsPolicy")}
                </div>
              </div>
            </div>
          </div>

          <div className="border-t mt-6" ref={reviewsRef}>
            <div className="flex border-b">
              {["description", "specifications", "reviews"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-6 py-4 font-medium ${
                    activeTab === tab
                      ? "text-purple-600 border-b-2 border-purple-600"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  {t(`product.tabs.${tab}`)}
                </button>
              ))}
            </div>
            <div className="p-6">
              {activeTab === "description" && (
                <div className="text-gray-700 space-y-4">
                  {product.description.split("\n\n").map((p, i) => (
                    <p key={i}>{p}</p>
                  ))}
                </div>
              )}
              {activeTab === "specifications" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-bold text-gray-900 mb-3">
                      {t("product.general")}
                    </h4>
                    <div className="space-y-3">
                      <div className="flex justify-between py-2 border-b">
                        <span>{t("product.brand")}</span>
                        <span className="font-medium">
                          {product.brand || "—"}
                        </span>
                      </div>
                      <div className="flex justify-between py-2 border-b">
                        <span>{t("product.model")}</span>
                        <span className="font-medium">
                          {product.reference || "—"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              {activeTab === "reviews" && (
                <ProductReviews productId={product._id} />
              )}
            </div>
          </div>

          <SimilarProducts productId={id} />
        </div>
      </div>
    </div>
  );
};

export default ProductDetailsPage;
