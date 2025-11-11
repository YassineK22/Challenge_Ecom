import { Navigate, Route, Routes } from "react-router-dom";
import { BrowserRouter } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./App.css";
import { Home } from "./Pages/Home";
import Header from "./components/Header";
import SignIn from "./Pages/SignIn";
import AuthentificationRoute from "./components/AuthentificationRoute";
import SignUp from "./Pages/SignUp";
import AdminDashboard from "./Pages/AdminDashboard";
import PrivateRoute from "./components/PrivateRoute";
import ProductCategoryPage from "./Pages/ProductCategoryPage";
import WishlistPage from "./Pages/WishlistPage";
import CartPage from "./Pages/CartPage";
import ProductDetailsPage from "./Pages/ProductDetailsPage";
import CheckoutPage from "./Pages/CheckoutPage";
import OrderTrakingPage from "./Pages/OrderTrakingPage";
import ProfilePage from "./Pages/ProfilePage";
import SearchPage from "./Pages/SearchPage";

function App() {
  return (
    <BrowserRouter>
      <Header />

      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<Navigate to="/homePage" />} />
        <Route path="/homePage" element={<Home />} />
        <Route path="/products" element={<ProductCategoryPage />} />
        <Route path="/wishlist" element={<WishlistPage />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/products/:id" element={<ProductDetailsPage />} />
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/Search" element={<SearchPage />} />

        {/* Protected routes for buyers */}
        <Route element={<PrivateRoute allowedRoles={["buyer"]} />}>
          <Route path="/trackOrder/:id" element={<OrderTrakingPage />} />
          <Route path="/Profile" element={<ProfilePage />} />
        </Route>

        {/* Authentication routes (only for non-logged in users) */}
        <Route element={<AuthentificationRoute />}>
          <Route path="/login" element={<SignIn />} />
          <Route path="/signup" element={<SignUp />} />
        </Route>

        <Route element={<PrivateRoute allowedRoles={["admin"]} />}>
          <Route path="/admin-dashboard" element={<AdminDashboard />} />
        </Route>

        {/* Fallback for unknown routes */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
