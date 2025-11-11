# 🛒 E-Commerce Front-End Challenge (E-Challenge)

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

# Visitor Dashbord

## Sign In
![alt text](image-14.png)

## Create an Account
![alt text](image-15.png)

## Home
![alt text](image-7.png)

## Language Translate dropdown
![alt text](image-8.png)

## Search By Category
![alt text](image-9.png)

## Search by product
![alt text](image-11.png)

## Recent Search
![alt text](image-10.png)

## Flash Sale (Promo Prducts)
![alt text](image-12.png)

## Featured Products
![alt text](image-13.png)

## Similar Products
![alt text](image-29.png)

---

# User Dashbord

## Wishlist Page
![alt text](image-16.png)

## Cart DropDown
![alt text](image-17.png)

## Personal Information
![alt text](image-18.png)

## Edit Personal Information
![alt text](image-19.png)

## WishlistProfil
![alt text](image-20.png)

## Manage Orders
![alt text](image-21.png)

## ChekoutPage
![alt text](image-22.png)

## ChekoutSteps
![alt text](image-23.png)

![alt text](image-24.png)

![alt text](image-25.png)

![alt text](image-26.png)

## Order Tracking
![alt text](image-27.png)


---

# 🛠 Admin Dashbord

## Main Dashbord
![alt text](image-5.png)

## Users Dashbord
![alt text](image-4.png)

## Products Dashbord
![alt text](image-3.png)

## Add Product
![alt text](image-6.png)

## Create Promotion
![alt text](image-1.png)

## Manage Orders
![alt text](image.png)

# Third-party Services (API)

# Stripe: Payment processing and checkout API
![alt text](image-2.png)

# Cloudinary: Media storage (Cloud)
![alt text](image-28.png)