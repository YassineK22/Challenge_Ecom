import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  FiPackage,
  FiCheckCircle,
  FiTruck,
  FiClock,
  FiFilter,
  FiSearch,
  FiRefreshCw,
} from "react-icons/fi";
import {
  FaExchangeAlt,
  FaTimes,
  FaChevronDown,
  FaChevronUp,
} from "react-icons/fa";
import { BsBoxSeam } from "react-icons/bs";
import { format } from "date-fns";

const API_BASE_URL = "http://localhost:8000/api";

const statusColors = {
  pending: "bg-yellow-100 text-yellow-800",
  processing: "bg-blue-100 text-blue-800",
  shipped: "bg-indigo-100 text-indigo-800",
  delivered: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
  returned: "bg-purple-100 text-purple-800",
};

const statusIcons = {
  pending: <FiClock className="mr-1" />,
  processing: <FiRefreshCw className="mr-1" />,
  shipped: <FiTruck className="mr-1" />,
  delivered: <FiCheckCircle className="mr-1" />,
  cancelled: <FaTimes className="mr-1" />,
  returned: <FaExchangeAlt className="mr-1" />,
};

const paymentStatusColors = {
  pending: "bg-yellow-100 text-yellow-800",
  paid: "bg-green-100 text-green-800",
  failed: "bg-red-100 text-red-800",
  refunded: "bg-purple-100 text-purple-800",
};

const statsConfig = [
  {
    key: "totalOrders",
    label: "Total Orders",
    icon: <FiPackage className="w-6 h-6" />,
    bgColor: "bg-indigo-100",
    textColor: "text-indigo-600",
  },
  {
    key: "pending",
    label: "Pending",
    icon: <FiClock className="w-6 h-6" />,
    bgColor: "bg-yellow-100",
    textColor: "text-yellow-600",
  },
  {
    key: "processing",
    label: "Processing",
    icon: <FiRefreshCw className="w-6 h-6" />,
    bgColor: "bg-blue-100",
    textColor: "text-blue-600",
  },
  {
    key: "shipped",
    label: "Shipped",
    icon: <FiTruck className="w-6 h-6" />,
    bgColor: "bg-indigo-100",
    textColor: "text-indigo-600",
  },
  {
    key: "delivered",
    label: "Delivered",
    icon: <FiCheckCircle className="w-6 h-6" />,
    bgColor: "bg-green-100",
    textColor: "text-green-600",
  },
];

const DashOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({
    status: "",
    paymentStatus: "",
    dateRange: "",
  });
  const [showFilters, setShowFilters] = useState(false);
  const [stats, setStats] = useState({
    totalOrders: 0,
    pending: 0,
    processing: 0,
    shipped: 0,
    delivered: 0,
  });

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    // Compute stats from orders array
    const newStats = {
      totalOrders: orders.length,
      pending: orders.filter((o) => o.status === "pending").length,
      processing: orders.filter((o) => o.status === "processing").length,
      shipped: orders.filter((o) => o.status === "shipped").length,
      delivered: orders.filter((o) => o.status === "delivered").length,
    };
    setStats(newStats);
  }, [orders]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/orders`);
      const ordersWithUiStatus = response.data.orders.map((order) => ({
        ...order,
        uiStatus: order.uiStatus || order.status,
      }));
      setOrders(ordersWithUiStatus);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch orders");
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (e) => setSearchTerm(e.target.value);
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };
  const resetFilters = () => {
    setFilters({ status: "", paymentStatus: "", dateRange: "" });
    setSearchTerm("");
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      await axios.put(`${API_BASE_URL}/orders/${orderId}/status`, {
        status: newStatus,
      });
      setOrders((prev) =>
        prev.map((order) =>
          order._id === orderId
            ? { ...order, status: newStatus, uiStatus: newStatus }
            : order
        )
      );
      setSuccessMessage("Order status updated successfully");
      setTimeout(() => setSuccessMessage(""), 5000);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update order status");
    }
  };

  const filteredOrders = orders
    .map((order) => ({
      ...order,
      displayStatus: order.uiStatus,
      buyer: order.userId,
    }))
    .filter((order) => {
      const matchesSearch =
        order._id.includes(searchTerm) ||
        order.buyer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.buyer.email.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = filters.status
        ? order.status === filters.status
        : true;
      const matchesPaymentStatus = filters.paymentStatus
        ? order.paymentStatus === filters.paymentStatus
        : true;
      return matchesSearch && matchesStatus && matchesPaymentStatus;
    });

  if (loading && orders.length === 0) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
          Order Management
        </h1>
        <p className="text-gray-500 mt-1">
          Manage and track all customer orders
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        {statsConfig.map(({ key, label, icon, bgColor, textColor }) => (
          <div
            key={key}
            className="bg-white rounded-xl shadow-sm border border-gray-100 p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">{label}</p>
                <p className="text-2xl font-bold text-gray-800 mt-1">
                  {stats[key] || 0}
                </p>
              </div>
              <div className={`p-3 rounded-lg ${bgColor} ${textColor}`}>
                {icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Messages */}
      {successMessage && (
        <div className="p-4 bg-green-50 border-l-4 border-green-500 text-green-700 rounded-md shadow-sm mb-6">
          {successMessage}
        </div>
      )}
      {error && (
        <div className="p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-md shadow-sm mb-6">
          {error}
        </div>
      )}

      {/* Search & Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-6">
        <div className="p-4 border-b border-gray-100 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FiSearch className="text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search orders..."
              className="block w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-lg bg-gray-50 focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500 focus:bg-white transition-all"
              value={searchTerm}
              onChange={handleSearchChange}
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
          >
            <FiFilter className="mr-2" /> Filters{" "}
            {showFilters ? (
              <FaChevronUp className="ml-2" />
            ) : (
              <FaChevronDown className="ml-2" />
            )}
          </button>
        </div>

        {showFilters && (
          <div className="p-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <select
              name="status"
              value={filters.status}
              onChange={handleFilterChange}
              className="border border-gray-200 rounded-lg p-2"
            >
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
              <option value="returned">Returned</option>
            </select>
            <select
              name="paymentStatus"
              value={filters.paymentStatus}
              onChange={handleFilterChange}
              className="border border-gray-200 rounded-lg p-2"
            >
              <option value="">All Payment Statuses</option>
              <option value="pending">Pending</option>
              <option value="paid">Paid</option>
              <option value="failed">Failed</option>
              <option value="refunded">Refunded</option>
            </select>
            <button
              onClick={resetFilters}
              className="bg-red-100 text-red-700 px-4 py-2 rounded-lg hover:bg-red-200"
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>

      {/* Orders Table */}
      <div className="overflow-x-auto">
        {filteredOrders.length > 0 ? (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Order ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Items
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Order Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Payment
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredOrders.map((order) => {
                const amount =
                  order.items.reduce(
                    (acc, item) => acc + item.price * item.quantity,
                    0
                  ) +
                  (order.tax || 0) +
                  (order.shipping || 0);
                return (
                  <tr
                    key={order._id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-indigo-600 font-medium">
                      #{order._id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="shrink-0 h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
                          {order.buyer.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {order.buyer.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {order.buyer.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        {order.items.slice(0, 3).map((item, idx) => (
                          <div key={idx} className="relative h-12 w-12 mr-2">
                            <img
                              className="h-full w-full object-cover rounded"
                              src={
                                item.productId?.images?.[0]?.url ||
                                "/placeholder-product.jpg"
                              }
                              alt={item.productId?.name || "Product"}
                            />
                            {idx === 2 && order.items.length > 3 && (
                              <div className="absolute inset-0 bg-black bg-opacity-50 text-white flex items-center justify-center rounded">
                                +{order.items.length - 3}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-900">
                      ${amount.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          statusColors[order.displayStatus]
                        }`}
                      >
                        {statusIcons[order.displayStatus]}
                        {order.displayStatus.charAt(0).toUpperCase() +
                          order.displayStatus.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          paymentStatusColors[order.paymentStatus]
                        }`}
                      >
                        {order.paymentStatus.charAt(0).toUpperCase() +
                          order.paymentStatus.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {format(new Date(order.createdAt), "MMM d, yyyy")}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        {[
                          "processing",
                          "shipped",
                          "delivered",
                          "cancelled",
                        ].map((statusOption) => (
                          <button
                            key={statusOption}
                            onClick={() =>
                              updateOrderStatus(order._id, statusOption)
                            }
                            disabled={
                              (statusOption === "processing" &&
                                order.status !== "pending") ||
                              (statusOption === "shipped" &&
                                order.status !== "processing") ||
                              (statusOption === "delivered" &&
                                order.status !== "shipped") ||
                              (statusOption === "cancelled" &&
                                order.status === "delivered")
                            }
                            className={`p-1.5 rounded-md ${
                              order.status === statusOption
                                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                                : "bg-blue-100 text-blue-600 hover:bg-blue-200"
                            }`}
                            title={`Mark as ${
                              statusOption.charAt(0).toUpperCase() +
                              statusOption.slice(1)
                            }`}
                          >
                            {statusOption === "processing" && (
                              <FiRefreshCw className="h-4 w-4" />
                            )}
                            {statusOption === "shipped" && (
                              <FiTruck className="h-4 w-4" />
                            )}
                            {statusOption === "delivered" && (
                              <FiCheckCircle className="h-4 w-4" />
                            )}
                            {statusOption === "cancelled" && (
                              <FaTimes className="h-4 w-4" />
                            )}
                          </button>
                        ))}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <div className="p-8 text-center">
            <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center text-gray-400 mb-4">
              <BsBoxSeam className="w-12 h-12" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-1">
              No orders found
            </h3>
            <p className="text-gray-500 max-w-md mx-auto">
              {searchTerm || Object.values(filters).some(Boolean)
                ? "No orders match your current filters."
                : "No orders yet."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DashOrders;
