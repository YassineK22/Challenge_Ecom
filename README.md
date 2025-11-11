# 🛒 E-Commerce Front-End Challenge

Modern e-commerce app built with **React** and **Node.js/Express**.

## 🚀 Setup

### Client
```bash
cd client
npm install
npm run dev
```
### Server
```bash
cd serveur
npm install
npm run start
```
Then open http://localhost:5173 in your browser.

---

## 💻 Tech Stack

- **Frontend:** React + Redux + TailwindCSS + DaisyUI  
- **Backend:** Node.js + Express + MongoDB (MERN stack)  
- **Payment:** Stripe  
- **Images:** Cloudinary  

---

## 🔑 Environment Variables

### Client
Create a `.env` file in `client`:

```
REACT_APP_STRIPE_PUBLISHABLE_KEY=<your_stripe_publishable_key>
```

### Server
Create a `.env` file in `serveur`:

```
PORT=<your_port>
DB=<your_mongodb_name>
jwt_secret=<your_jwt_secret>
CLOUDINARY_CLOUD_NAME=<your_cloudinary_name>
CLOUDINARY_API_KEY=<your_cloudinary_api_key>
CLOUDINARY_API_SECRET=<your_cloudinary_api_secret>
STRIPE_SECRET_KEY=<your_stripe_secret_key>
```

---

## 📦 Features

- **Order Management:** Admin can view, update, and delete orders.  
- **Order Status:** Supports `pending`, `processing`, `shipped`, `delivered`, `cancelled`, `returned`.  
- **Payment Integration:** Stripe payments with verification.  
- **Inventory Management:** Stock updates automatically when orders are placed or cancelled.  
- **Search & Filters:** Search orders by ID, customer name/email, and filter by status or payment status.  
- **Order Stats:** Dashboard displays total orders and breakdown by status.  
- **Responsive UI:** Uses TailwindCSS + DaisyUI for a modern and responsive design.  

---

## 🛠 Notes for Test

- Make sure to create the `.env` files for client and server with the appropriate keys.  
- The backend expects requests to `/api/orders` for CRUD operations.  
- Admin features like updating status are available through the dashboard buttons.  
- Images are stored on Cloudinary and loaded dynamically.

---

## 🛠 API Endpoints

### **Auth**
| Method | Endpoint | Description |
|--------|---------|-------------|
| POST   | `/signup` | Register a new user |
| POST   | `/signin` | Login user |
| POST   | `/google` | Login with Google |
| POST   | `/set-password` | Set or reset user password |

---

### **User**
| Method | Endpoint | Description |
|--------|---------|-------------|
| PUT    | `/user/:id` | Update user details |
| GET    | `/user/:id` | Get user by ID |
| GET    | `/users` | Get all users |
| POST   | `/signout` | Sign out user |
| GET    | `/dashboard/stats` | Get user dashboard statistics |

---

### **Wishlist**
| Method | Endpoint | Description |
|--------|---------|-------------|
| POST   | `/wishlist/add` | Add an item to wishlist |
| GET    | `/wishlist` | Get wishlist by user ID |
| DELETE | `/wishlist/item` | Delete a specific item from wishlist |
| DELETE | `/wishlist` | Delete entire wishlist |

---

### **Cart**
| Method | Endpoint | Description |
|--------|---------|-------------|
| POST   | `/cart/add` | Add an item to cart |
| GET    | `/cart` | Get cart by user ID |
| DELETE | `/cart/item` | Delete a specific item from cart |
| PUT    | `/cart/item/quantity` | Update quantity of an item in cart |
| DELETE | `/cart` | Delete entire cart |

---

### **Products**
| Method | Endpoint | Description |
|--------|---------|-------------|
| GET    | `/products` | Get all products |
| GET    | `/products/search` | Search products |
| GET    | `/products/suggestions` | Get product suggestions |
| GET    | `/products/reference/:reference` | Get product by reference |
| GET    | `/products/by-category` | Get products by category |
| GET    | `/products/:productId/related` | Get related products |
| GET    | `/products/:id` | Get product by ID |
| POST   | `/products` | Create a new product |
| PUT    | `/products/:id` | Update a product |
| DELETE | `/products/:id` | Delete a product |
| POST   | `/products/:id/images` | Add images to product |
| DELETE | `/products/:id/images/:publicId` | Delete product image |

---

### **Categories**
| Method | Endpoint | Description |
|--------|---------|-------------|
| GET    | `/api/categories` | Get all categories |
| POST   | `/api/categories` | Create a new category |
| PUT    | `/api/categories/:id` | Update category |
| DELETE | `/api/categories/:id` | Delete category |
| PATCH  | `/api/categories/:id/subcategories` | Add subcategories |

---

### **Reviews**
| Method | Endpoint | Description |
|--------|---------|-------------|
| POST   | `/reviews` | Add a review |
| GET    | `/reviews/:productId` | Get reviews for a product |
| PUT    | `/reviews/:reviewId` | Update a review |
| DELETE | `/reviews/:reviewId/:userId` | Delete a review |

---

### **Promotions**
| Method | Endpoint | Description |
|--------|---------|-------------|
| POST   | `/promotions` | Create a promotion |
| GET    | `/promotions/id/:promotionId` | Get promotion by ID |

---

### **Payments**
| Method | Endpoint | Description |
|--------|---------|-------------|
| POST   | `/payments/create-payment-intent` | Create Stripe payment intent |

---

### **Admin**
| Method | Endpoint | Description |
|--------|---------|-------------|
| DELETE | `/delete/:userId` | Delete a user |
| PATCH  | `/status/:userId` | Toggle user status |
