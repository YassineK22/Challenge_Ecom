import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  FaHome,
  FaUsers,
  FaCog,
  FaSignOutAlt,
  FaUserCircle,
  FaBell,
  FaBars,
  FaTimes,
  FaUserShield,
  FaBox,
  FaBoxes,
  FaGift,
  FaClipboardList,
} from "react-icons/fa";
import { useSelector, useDispatch } from "react-redux";
import axios from "axios";
import { signoutSuccess } from "../redux/user/userSlice";
import DashOverview from "../components/Admin/DashOverview";
import DashUsers from "../components/Admin/DashUsers";
import DashSettings from "../components/Admin/DashSettings";
import DashAddInventory from "../components/Admin/DashNewProduct";
import DashProducts from "../components/Admin/DashProducts";
import DashPromotion from "../components/Admin/DashPromotion";
import DashOrders from "../components/Admin/DashOrders";
import { useTranslation } from "react-i18next";

const AdminDashboard = () => {
  const { t, i18n } = useTranslation();
  const currentUser = useSelector((state) => state.user.currentUser);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const tabFromUrl = urlParams.get("tab");
    setActiveTab(tabFromUrl || "dashboard");
  }, [location.search]);

  const signOut = async () => {
    try {
      await axios.post("http://localhost:8000/signout");
      dispatch(signoutSuccess());
      navigate("/");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const stats = {
    totalUsers: 142,
    newUsers: 8,
    revenue: "$12,845",
  };

  const recentUsers = [
    { id: 1, name: "Alex Johnson", email: "alex@example.com", role: "customer", status: "active" },
    { id: 2, name: "Sarah Williams", email: "sarah@example.com", role: "customer", status: "active" },
    { id: 3, name: "Mike Chen", email: "mike@example.com", role: "customer", status: "pending" },
  ];

  const username = currentUser?.email.split("@")[0] || "Admin";

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar */}
      <div
        className={`fixed top-0 left-0 h-full bg-linear-to-b from-gray-900 to-gray-800 text-white flex flex-col p-0 shadow-xl z-20 transition-all duration-300 ease-in-out ${
          sidebarOpen ? "w-64" : "w-20"
        }`}
      >
        {/* Sidebar Header */}
        <div className="p-6 pb-4 border-b border-gray-700 flex items-center justify-between">
          {sidebarOpen ? (
            <div className="flex items-center space-x-3">
              <FaUserShield className="text-2xl text-gray-300" />
              <h1 className="text-xl font-bold">{t("adminDashboard.title")}</h1>
            </div>
          ) : (
            <div className="flex justify-center w-full">
              <FaUserShield className="text-2xl text-gray-300" />
            </div>
          )}
          <button
            onClick={toggleSidebar}
            className="text-gray-300 hover:text-white transition-colors"
          >
            {sidebarOpen ? <FaTimes /> : ""}
          </button>
        </div>

        {/* Sidebar Navigation */}
        <nav className="flex-1 p-4">
          <ul className="space-y-1">
            <li>
              <Link
                to="/admin-dashboard?tab=dashboard"
                className={`flex items-center px-4 py-3 rounded-lg ${
                  activeTab === "dashboard"
                    ? "bg-gray-700 text-white font-medium"
                    : "hover:bg-gray-700 hover:text-white"
                } transition`}
              >
                <FaHome className={`${sidebarOpen ? "mr-3" : "mx-auto"} text-gray-300`} />
                {sidebarOpen && t("adminDashboard.sidebar.dashboard")}
              </Link>
            </li>
            <li>
              <Link
                to="/admin-dashboard?tab=users"
                className={`flex items-center px-4 py-3 rounded-lg ${
                  activeTab === "users"
                    ? "bg-gray-700 text-white font-medium"
                    : "hover:bg-gray-700 hover:text-white"
                } transition`}
              >
                <FaUsers className={`${sidebarOpen ? "mr-3" : "mx-auto"} text-gray-300`} />
                {sidebarOpen && t("adminDashboard.sidebar.users")}
              </Link>
            </li>
            <li>
              <Link
                to="/admin-dashboard?tab=products"
                className={`flex items-center px-4 py-3 rounded-lg ${
                  activeTab === "products"
                    ? "bg-gray-700 text-white font-medium"
                    : "hover:bg-gray-700 hover:text-white"
                } transition`}
              >
                <FaBox className={`${sidebarOpen ? "mr-3" : "mx-auto"} text-gray-300`} />
                {sidebarOpen && t("adminDashboard.sidebar.products")}
              </Link>
            </li>
            <li>
              <Link
                to="/admin-dashboard?tab=add-inventory"
                className={`flex items-center px-4 py-3 rounded-lg ${
                  activeTab === "add-inventory"
                    ? "bg-gray-700 text-white font-medium"
                    : "hover:bg-gray-700 hover:text-white"
                } transition`}
              >
                <FaBoxes className={`${sidebarOpen ? "mr-3" : "mx-auto"} text-gray-300`} />
                {sidebarOpen && t("adminDashboard.sidebar.addInventory")}
              </Link>
            </li>
            <li>
              <Link
                to="/admin-dashboard?tab=promotions"
                className={`flex items-center px-4 py-3 rounded-lg ${
                  activeTab === "promotions"
                    ? "bg-gray-700 text-white font-medium"
                    : "hover:bg-gray-700 hover:text-white"
                } transition`}
              >
                <FaGift className={`${sidebarOpen ? "mr-3" : "mx-auto"} text-gray-300`} />
                {sidebarOpen && t("adminDashboard.sidebar.promotions")}
              </Link>
            </li>
            <li>
              <Link
                to="/admin-dashboard?tab=orders"
                className={`flex items-center px-4 py-3 rounded-lg ${
                  activeTab === "orders"
                    ? "bg-gray-700 text-white font-medium"
                    : "hover:bg-gray-700 hover:text-white"
                } transition`}
              >
                <FaClipboardList className={`${sidebarOpen ? "mr-3" : "mx-auto"} text-gray-300`} />
                {sidebarOpen && t("adminDashboard.sidebar.orders")}
              </Link>
            </li>
            <li>
              <Link
                to="/admin-dashboard?tab=settings"
                className={`flex items-center px-4 py-3 rounded-lg ${
                  activeTab === "settings"
                    ? "bg-gray-700 text-white font-medium"
                    : "hover:bg-gray-700 hover:text-white"
                } transition`}
              >
                <FaCog className={`${sidebarOpen ? "mr-3" : "mx-auto"} text-gray-300`} />
                {sidebarOpen && t("adminDashboard.sidebar.settings")}
              </Link>
            </li>
          </ul>
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-gray-700">
          <button
            onClick={signOut}
            className="flex items-center w-full px-4 py-2 text-sm text-gray-300 hover:text-white rounded-lg hover:bg-gray-700 transition"
          >
            <FaSignOutAlt className={`${sidebarOpen ? "mr-3" : "mx-auto"}`} />
            {sidebarOpen && t("adminDashboard.sidebar.signOut")}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className={`flex-1 flex flex-col transition-all duration-300 ease-in-out ${sidebarOpen ? "ml-64" : "ml-20"}`}>
        <header className="fixed top-0 right-0 bg-white shadow-sm z-10" style={{ left: sidebarOpen ? "16rem" : "5rem" }}>
          <div className="flex items-center justify-between px-6 py-4">
            {!sidebarOpen && (
              <button onClick={toggleSidebar} className="p-2 text-gray-500 hover:text-gray-700 rounded-full hover:bg-gray-100 mr-4">
                <FaBars className="text-xl" />
              </button>
            )}
            <div className="relative w-64">{/* Optional Search */}</div>
            <div className="flex items-center space-x-4">
              {/* Language Toggle */}
              <div className="dropdown dropdown-end">
                <label tabIndex={0} className="btn btn-ghost btn-sm gap-1 normal-case">
                  {i18n.language === "en" ? (
                    <>
                      <span className="fi fi-us fis"></span>
                      <span className="hidden sm:inline">EN</span>
                    </>
                  ) : (
                    <>
                      <span className="fi fi-fr fis"></span>
                      <span className="hidden sm:inline">FR</span>
                    </>
                  )}
                  <svg className="fill-current" xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24">
                    <path d="M7 10l5 5 5-5z" />
                  </svg>
                </label>
                <ul tabIndex={0} className="dropdown-content menu p-2 shadow bg-white rounded-box w-40 border border-gray-100 mt-2">
                  <li>
                    <button className={`flex items-center ${i18n.language === "en" ? "active bg-gray-100" : ""}`} onClick={() => changeLanguage("en")}>
                      <span className="fi fi-us fis mr-2"></span>English (US)
                    </button>
                  </li>
                  <li>
                    <button className={`flex items-center ${i18n.language === "fr" ? "active bg-gray-100" : ""}`} onClick={() => changeLanguage("fr")}>
                      <span className="fi fi-fr fis mr-2"></span>Français
                    </button>
                  </li>
                </ul>
              </div>

              <button className="relative p-2 text-gray-500 hover:text-gray-700 rounded-full hover:bg-gray-100" aria-label={t("adminDashboard.notifications.new")}>
                <FaBell className="text-xl" />
                <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>

              <div className="flex items-center space-x-2">
                <div className="text-right hidden md:block">
                  <div className="font-medium text-gray-800">{username}</div>
                  <div className="text-xs text-gray-500">{t("adminDashboard.role")}</div>
                </div>
                <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                  <FaUserCircle className="text-2xl text-gray-700" />
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 mt-16 p-6 bg-gray-100 overflow-y-auto">
          {activeTab === "dashboard" && <DashOverview stats={stats} recentUsers={recentUsers} />}
          {activeTab === "users" && <DashUsers />}
          {activeTab === "settings" && <DashSettings />}
          {activeTab === "products" && <DashProducts />}
          {activeTab === "add-inventory" && <DashAddInventory />}
          {activeTab === "promotions" && <DashPromotion />}
          {activeTab === "orders" && <DashOrders />}
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;
