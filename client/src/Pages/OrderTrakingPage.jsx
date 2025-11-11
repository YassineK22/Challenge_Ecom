import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import axios from "axios";
import { toast } from "react-toastify";
import {
  FaCheckCircle,
  FaTruck,
  FaBoxOpen,
  FaHome,
  FaClock,
  FaSyncAlt,
  FaMapMarkerAlt,
  FaCreditCard,
  FaShoppingBag,
} from "react-icons/fa";
import { motion } from "framer-motion";

const OrderTrackingPage = () => {
  const { t } = useTranslation();
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchOrder = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `http://localhost:8000/api/orders/${id}`
      );
      setOrder(response.data.order);
      setError(null);
    } catch (err) {
      setError(
        err.response?.data?.message || t("orderTracking.errors.fetchError")
      );
      toast.error(t("orderTracking.errors.fetchError"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();
  }, [id, t]);

  const subtotal = order?.items?.reduce(
    (sum, item) => sum + (item.price ?? 0) * (item.quantity ?? 1),
    0
  );

  const statusSteps = [
    {
      id: "pending",
      title: t("orderTracking.status.pending"),
      icon: <FaClock className="text-yellow-500" />,
      description: t("orderTracking.status.pendingDescription"),
    },
    {
      id: "processing",
      title: t("orderTracking.status.processing"),
      icon: <FaBoxOpen className="text-blue-500" />,
      description: t("orderTracking.status.processingDescription"),
    },
    {
      id: "shipped",
      title: t("orderTracking.status.shipped"),
      icon: <FaTruck className="text-purple-500" />,
      description: t("orderTracking.status.shippedDescription"),
    },
    {
      id: "delivered",
      title: t("orderTracking.status.delivered"),
      icon: <FaHome className="text-green-500" />,
      description: t("orderTracking.status.deliveredDescription"),
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-white p-6 rounded-lg shadow-md text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <Link to="/" className="btn btn-primary">
            {t("orderTracking.buttons.backToHome")}
          </Link>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-white p-6 rounded-lg shadow-md text-center">
          <p className="text-gray-500 mb-4">
            {t("orderTracking.errors.orderNotFound")}
          </p>
          <Link to="/" className="btn btn-primary">
            {t("orderTracking.buttons.backToHome")}
          </Link>
        </div>
      </div>
    );
  }

  const currentStatusIndex = statusSteps.findIndex(
    (step) => step.id === order.status
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6"
    >
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">
            {t("orderTracking.title")} #
            {order.orderNumber || order._id.slice(-8).toUpperCase()}
          </h1>
          <p className="text-gray-500">
            {t("orderTracking.placedOn")}{" "}
            {new Date(order.createdAt).toLocaleDateString()}
          </p>

          <div className="mt-4 inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
            {statusSteps[currentStatusIndex]?.icon}
            <span className="ml-2">
              {statusSteps[currentStatusIndex]?.title}
            </span>
          </div>
        </div>

        {/* Order Items */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
          <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
            <FaShoppingBag className="mr-2 text-purple-500" />{" "}
            {t("orderTracking.items")} ({order.items.length})
          </h2>
          <div className="space-y-4">
            {order.items.map((item) => (
              <div
                key={item._id}
                className="flex gap-4 p-3 bg-gray-50 rounded-lg"
              >
                <div className="w-16 h-16 shrink-0 rounded-md overflow-hidden border border-gray-200">
                  <img
                    src={
                      item.productId?.images?.[0]?.url ||
                      "https://via.placeholder.com/150"
                    }
                    alt={item.productId?.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-gray-800">
                    {item.productId?.name}
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {t("orderTracking.quantity")}: {item.quantity}
                  </p>
                  <p className="text-sm font-medium mt-1">
                    ${item.price.toFixed(2)}
                  </p>
                </div>
                <div className="flex flex-col items-end">
                  <Link
                    to={`/products/${item.productId?._id}`}
                    className="text-xs text-purple-600 hover:underline"
                  >
                    {t("orderTracking.viewProduct")}
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Shipping, Payment, and Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Shipping Info */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center mb-4">
              <FaMapMarkerAlt className="text-purple-500 mr-2" />
              <h3 className="font-bold text-gray-800">
                {t("orderTracking.shippingInfo")}
              </h3>
            </div>
            <div className="text-sm text-gray-600 space-y-2">
              <p className="font-medium">
                {order.shippingInfo.firstName} {order.shippingInfo.lastName}
              </p>
              <p>{order.shippingInfo.address.street}</p>
              <p>
                {order.shippingInfo.address.city},{" "}
                {order.shippingInfo.address.governorate}
              </p>
              <p>
                {t("orderTracking.phone")}: {order.shippingInfo.phone}
              </p>
              <p>
                {t("orderTracking.email")}: {order.shippingInfo.email}
              </p>
            </div>
          </div>

          {/* Payment Info */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center mb-4">
              <FaCreditCard className="text-purple-500 mr-2" />
              <h3 className="font-bold text-gray-800">
                {t("orderTracking.paymentInfo")}
              </h3>
            </div>
            <div className="text-sm text-gray-600 space-y-2">
              <p>
                <span className="font-medium">
                  {t("orderTracking.paymentMethod")}:{" "}
                </span>
                {t(`orderTracking.paymentMethods.${order.paymentMethod}`)}
              </p>
              <p>
                <span className="font-medium">
                  {t("orderTracking.paymentStatus")}:{" "}
                </span>
                {t(
                  `orderTracking.paymentStatuses.${
                    order.paymentStatus || "pending"
                  }`
                )}
              </p>
            </div>
          </div>

          {/* Summary */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="font-bold text-gray-800 mb-4">
              {t("orderTracking.orderSummary")}
            </h3>
            <div className="space-y-2 text-sm">
              {/* Calculate subtotal dynamically */}
              <div className="flex justify-between">
                <span>{t("orderTracking.subtotal")}</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>{t("orderTracking.shipping")}</span>
                <span>
                  {(order.shipping ?? 0) === 0
                    ? t("orderTracking.free")
                    : `$${(order.shipping ?? 0).toFixed(2)}`}
                </span>
              </div>
              <div className="flex justify-between">
                <span>{t("orderTracking.tax")}</span>
                <span>${(order.tax ?? 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold border-t pt-2 mt-2">
                <span>{t("orderTracking.total")}</span>
                <span className="text-purple-600">
                  $
                  {(
                    (subtotal ?? 0) +
                    (order.shipping ?? 0) +
                    (order.tax ?? 0)
                  ).toFixed(2)}
                </span>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              <Link to="/" className="btn btn-outline btn-primary w-full">
                {t("orderTracking.buttons.continueShopping")}
              </Link>
              <button
                onClick={fetchOrder}
                className="btn btn-outline w-full flex items-center justify-center gap-2"
              >
                <FaSyncAlt />
                {t("orderTracking.buttons.refreshStatus")}
              </button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default OrderTrackingPage;
