import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { FaStar, FaRegStar, FaShoppingCart, FaFireAlt } from "react-icons/fa";
import { IoMdHeart, IoMdHeartEmpty } from "react-icons/io";
import axios from "axios";
import {
  addItem as addWishlistItem,
  removeItem as removeWishlistItem,
} from "../redux/user/wishlistSlice";
import { addItem as addCartItem } from "../redux/user/cartSlice";
import { useSelector, useDispatch } from "react-redux";
import { toast } from "react-toastify";
import debounce from "lodash.debounce";
import { useTranslation } from "react-i18next";

const ProductCard = ({ product }) => {
  const { t, i18n } = useTranslation();
  const { currentUser } = useSelector((state) => state.user);
  const wishlistItems = useSelector((state) => state.wishlist.items || []);
  const dispatch = useDispatch();

  const [isHovered, setIsHovered] = useState(false);
  const [isToggling, setIsToggling] = useState(false);
  const [averageRating, setAverageRating] = useState(0);
  const [reviewCount, setReviewCount] = useState(0);
  const [activePromotion, setActivePromotion] = useState(null);

  const WISHLIST_API_URL = "http://localhost:8000/api/wishlist";
  const CART_API_URL = "http://localhost:8000/api/cart";
  const API_URL = "http://localhost:8000/api";

  // Check if product is in wishlist
  const isWishlisted = wishlistItems.some(
    (item) => item.productId._id === product._id
  );

  const price = product?.price?.toFixed(2) || "0.00";
  const stock = product?.stock ?? 0;
  const status = stock > 0 ? t("productCard.inStock") : t("productCard.outOfStock");

  // Truncate product name
  const truncatedName =
    product.name.length > 50
      ? `${product.name.substring(0, 50)}...`
      : product.name;

  // Handle product-level promotion
  useEffect(() => {
    if (product.activePromotion) {
      setActivePromotion(product.activePromotion);
    } else {
      setActivePromotion(null);
    }
  }, [product]);

  const hasActivePromotion = !!activePromotion;
  const promotionName = hasActivePromotion
    ? activePromotion.name || t("product.specialOffer")
    : "";
  const discountRate = hasActivePromotion ? activePromotion.discountRate || 0 : 0;
  const promotionImage = hasActivePromotion ? activePromotion.image?.url : null;
  const promotionEndDate = hasActivePromotion
    ? new Date(activePromotion.endDate).toLocaleDateString(i18n.language, {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "";
  const newPrice = hasActivePromotion
    ? (price * (1 - discountRate / 100)).toFixed(2)
    : price;
  const oldPrice = hasActivePromotion ? price : null;

  // Fetch product reviews
  useEffect(() => {
    const fetchReviews = async () => {
      if (!product?._id) return;
      try {
        const response = await axios.get(`${API_URL}/reviews/${product._id}`);
        const reviews = response.data;
        const avgRating =
          reviews.length > 0
            ? (
                reviews.reduce((sum, review) => sum + (review.rating || 0), 0) /
                reviews.length
              ).toFixed(1)
            : 0;
        setAverageRating(parseFloat(avgRating));
        setReviewCount(reviews.length);
      } catch (err) {
        console.error("Error fetching reviews:", err);
        setAverageRating(0);
        setReviewCount(0);
      }
    };
    fetchReviews();
  }, [product?._id]);

  // Wishlist toggle
  const handleWishlistToggle = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!currentUser) {
      toast.error(t("productCard.wishlist.loginRequired"));
      return;
    }

    if (isToggling) return;
    setIsToggling(true);

    try {
      if (isWishlisted) {
        const item = wishlistItems.find((item) => item.productId._id === product._id);
        if (item) {
          await axios.delete(`${WISHLIST_API_URL}/item`, {
            data: { userId: currentUser.id, itemId: item._id },
          });
          dispatch(removeWishlistItem(item._id));
          toast.success(t("productCard.wishlist.successRemove"));
        }
      } else {
        const response = await axios.post(`${WISHLIST_API_URL}/add`, {
          userId: currentUser.id,
          productId: product._id,
          price: parseFloat(newPrice),
          stock,
        });
        const newItem = {
          ...response.data.wishlist.items.find((item) => item.productId._id === product._id),
          productId: product,
        };
        if (newItem) {
          dispatch(addWishlistItem(newItem));
          toast.success(t("productCard.wishlist.successAdd"));
        }
      }
    } catch (err) {
      console.error("Wishlist toggle error:", err);
      toast.error(t("productCard.wishlist.error"));
    } finally {
      setIsToggling(false);
    }
  };

  const debouncedWishlistToggle = debounce(handleWishlistToggle, 300, {
    leading: true,
    trailing: false,
  });

  useEffect(() => {
    return () => debouncedWishlistToggle.cancel();
  }, []);

  // Add to cart
  const handleAddToCart = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!currentUser) {
      toast.error(t("productCard.cart.loginRequired"));
      return;
    }

    if (stock <= 0) {
      toast.error(t("productCard.cart.outOfStock"));
      return;
    }

    try {
      const response = await axios.post(`${CART_API_URL}/add`, {
        userId: currentUser.id,
        productId: product._id,
        quantity: 1,
        price: parseFloat(newPrice),
      });

      const newItem = response.data.cart.items[response.data.cart.items.length - 1];
      dispatch(addCartItem({
        ...newItem,
        productId: { ...product, price: parseFloat(newPrice), stock },
        price: parseFloat(newPrice),
        stock,
      }));
      toast.success(t("productCard.cart.success"));
    } catch (err) {
      console.error("Add to cart error:", err);
      toast.error(t("productCard.cart.error"));
    }
  };

  const renderStars = () => {
    return Array(5)
      .fill(0)
      .map((_, i) =>
        i < Math.floor(averageRating) ? (
          <FaStar key={i} className="text-yellow-400 w-3 h-3" />
        ) : (
          <FaRegStar key={i} className="text-gray-300 w-3 h-3" />
        )
      );
  };

  const primaryImage = product.images?.[0]?.url;
  const hoverImage = product.images?.[1]?.url;

  return (
    <div
      className="bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-200 border border-gray-100 relative group overflow-hidden flex flex-col h-full"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}>
      <div className="relative pb-[100%] overflow-hidden">
        <Link to={`/products/${product._id}`} className="absolute inset-0">
          {primaryImage && (
            <img
              src={primaryImage}
              alt={product.name}
              className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-200 ${
                hoverImage && isHovered ? "opacity-0" : "opacity-100"
              }`}
              loading="lazy"
            />
          )}
          {hoverImage && (
            <img
              src={hoverImage}
              alt={product.name}
              className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-200 ${
                isHovered ? "opacity-100" : "opacity-0"
              }`}
              loading="lazy"
            />
          )}
          {!primaryImage && (
            <div className="absolute inset-0 bg-gray-50 flex items-center justify-center">
              <span className="text-gray-400 text-sm">{t("product.noImage")}</span>
            </div>
          )}
        </Link>

        {/* Promotion Tag */}
        {hasActivePromotion && (
          <div className="absolute top-2 left-2 z-10 transform -rotate-6 hover:rotate-0 transition-transform duration-300">
            <div className="relative group">
              <div className="bg-linear-to-r from-red-500 to-orange-500 text-white rounded-lg shadow-md flex items-stretch overflow-hidden min-w-[120px]">
                {promotionImage ? (
                  <div className="flex">
                    <div className="w-10 h-10 p-1 flex items-center justify-center bg-white/20 border-r border-orange-400">
                      <img
                        src={promotionImage}
                        alt={promotionName}
                        className="w-full h-full object-cover rounded border border-white"
                      />
                    </div>
                    <div className="px-2 py-1 flex flex-col justify-center">
                      <span className="font-bold text-xs block leading-tight max-w-20 truncate">
                        {promotionName}
                      </span>
                      <span className="text-[10px] font-bold bg-white text-red-600 px-1 py-0.5 rounded-full mt-1 w-fit">
                        {discountRate}% OFF
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="flex">
                    <div className="w-10 h-10 p-1.5 flex items-center justify-center bg-white/20 border-r border-orange-400">
                      <div className="w-full h-full rounded bg-orange-400/30 border border-dashed border-white flex items-center justify-center">
                        <FaFireAlt className="text-white text-sm" />
                      </div>
                    </div>
                    <div className="px-2 py-1 flex flex-col justify-center">
                      <span className="font-bold text-xs block leading-tight">
                        {promotionName}
                      </span>
                      <span className="text-[10px] font-bold bg-white text-red-600 px-1 py-0.5 rounded-full mt-1 w-fit">
                        {discountRate}% OFF
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Wishlist Button */}
        <div className="absolute top-2 right-2">
          <button
            onClick={debouncedWishlistToggle}
            disabled={isToggling}
            className={`p-1.5 rounded-full transition-all duration-300 ${
              isWishlisted
                ? "text-red-500 bg-white/80 shadow-sm"
                : "text-gray-400 hover:text-red-500 bg-white/80 hover:bg-white/90"
            } ${isToggling ? "opacity-50 cursor-not-allowed" : ""}`}
            aria-label={
              isWishlisted
                ? t("productCard.wishlist.remove")
                : t("productCard.wishlist.add")
            }>
            {isToggling ? (
              <span className="loading loading-spinner loading-xs"></span>
            ) : isWishlisted ? (
              <IoMdHeart className="w-4 h-4 fill-current" />
            ) : (
              <IoMdHeartEmpty className="w-4 h-4 group-hover:scale-110 transition-transform" />
            )}
          </button>
        </div>
      </div>

      <div className="p-3 grow flex flex-col">
        <Link to={`/products/${product._id}`} className="block mb-1 grow">
          <h3 className="font-medium text-gray-900 line-clamp-2 hover:text-[#4C0ADA] transition-colors text-sm h-10 flex items-center">
            {truncatedName}
          </h3>
        </Link>

        {/* Rating */}
        <div className="flex items-center mb-1.5">
          <div className="flex mr-1">{renderStars()}</div>
          <span className="text-xs text-gray-500 ml-1">
            {averageRating.toFixed(1)} ({reviewCount}{" "}
            {reviewCount === 1
              ? t("productCard.reviews.single")
              : t("productCard.reviews.multiple")}
            )
          </span>
        </div>

        {/* Price & Add to Cart */}
        <div className="flex items-center justify-between mt-auto">
          <div className="flex items-baseline gap-1.5">
            <div className="text-base font-bold text-gray-900">${newPrice}</div>
            {hasActivePromotion && (
              <div className="text-xs text-gray-500 line-through">${oldPrice}</div>
            )}
          </div>
          <button
            onClick={handleAddToCart}
            className={`px-2 py-1.5 rounded-md text-xs flex items-center gap-1 transition-all duration-200 ${
              stock > 0
                ? "bg-[#4C0ADA] text-white hover:bg-[#3A0AA5] shadow-md hover:shadow-lg active:scale-95"
                : "bg-gray-200 text-gray-500 cursor-not-allowed"
            }`}
            disabled={stock <= 0}
            aria-label={t("productCard.cart.add")}>
            <FaShoppingCart className="w-3 h-3" />
            <span className="hidden sm:inline">
              {stock > 0
                ? t("productCard.cart.add")
                : t("productCard.cart.soldOut")}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
