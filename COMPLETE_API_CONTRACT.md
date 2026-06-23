# 📚 Complete POS API Contract for Frontend

**Last Updated:** April 2026  
**Base URL:** `http://localhost:3000/api`  
**Swagger Docs:** `http://localhost:3000/api/docs`

---

## 🔑 Common Information

### Authentication
- Protected APIs require: `Authorization: Bearer <token>` header
- All protected APIs require JWT token from login endpoint
- Set `Content-Type: application/json` for all requests

### User Roles
```typescript
type UserRole = "ADMIN" | "SHOPKEEPER" | "CUSTOMER";
```

### Common Enums
```typescript
type ProductStatus = "IN_STOCK" | "RESERVED" | "SOLD" | "RETURNED" | "DAMAGED" | "UNDER_REPAIR";
type SaleType = "ONLINE" | "OFFLINE";
type PaymentMethod = "CASH" | "BANK" | "JAZZCASH" | "EASYPAISA" | "CARD";
type PtaStatus = "APPROVED" | "NOT_APPROVED" | "PATCHED" | "UNKNOWN";
type ProductCondition = "LIKE_NEW" | "EXCELLENT" | "GOOD" | "FAIR" | "DAMAGED";
type SortOrder = "asc" | "desc";
```

### Pagination Parameters (for all list endpoints)
```typescript
interface PaginationQuery {
  page?: number;              // Default: 1, Min: 1
  limit?: number;             // Default: 20, Min: 1, Max: 100
  search?: string;            // Optional search text
  sortBy?: string;            // Field to sort by (e.g., "createdAt")
  sortOrder?: "asc" | "desc"; // Default: "desc"
}
```

### Standard Response Format
```typescript
interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
  timestamp?: string;
}
```

---

## 🔐 AUTH Endpoints

### 1. Register
**Endpoint:** `POST /auth/register`  
**Authentication:** ❌ No  
**Role Required:** None

**Request Body:**
```typescript
{
  name: string;              // Required, min 1 char
  phone: string;             // Required
  email?: string;            // Optional, must be valid email
  password: string;          // Required, min 6 chars
  confirmPassword?: string;  // Optional
  role: "ADMIN" | "SHOPKEEPER" | "CUSTOMER"; // Required enum
}
```

**Response:**
```typescript
{
  id: number;
  name: string;
  phone: string;
  email?: string;
  role: "ADMIN" | "SHOPKEEPER" | "CUSTOMER";
  createdAt: string; // ISO timestamp
}
```

---

### 2. Login
**Endpoint:** `POST /auth/login`  
**Authentication:** ❌ No  
**Role Required:** None

**Request Body:**
```typescript
{
  phone?: string;     // Either phone or email required
  email?: string;     // Either phone or email required
  password: string;   // Required
}
```

**Response:**
```typescript
{
  access_token: string;  // JWT token for subsequent requests
  user: {
    id: number;
    name: string;
    phone: string;
    email?: string;
    role: "ADMIN" | "SHOPKEEPER" | "CUSTOMER";
  };
}
```

---

### 3. Get Profile
**Endpoint:** `GET /auth/profile`  
**Authentication:** ✅ Yes  
**Role Required:** All

**Response:**
```typescript
{
  id: number;
  name: string;
  phone: string;
  email?: string;
  role: "ADMIN" | "SHOPKEEPER" | "CUSTOMER";
  createdAt: string;
  updatedAt: string;
}
```

---

### 4. Change Password
**Endpoint:** `POST /auth/change-password`  
**Authentication:** ✅ Yes  
**Role Required:** All

**Request Body:**
```typescript
{
  currentPassword: string;  // Required, current password
  newPassword: string;      // Required, min 6 chars
}
```

**Response:**
```typescript
{
  success: boolean;
  message: string;
}
```

---

## 👥 USERS Endpoints (ADMIN Only)

### 1. Get All Users
**Endpoint:** `GET /users`  
**Authentication:** ✅ Yes  
**Role Required:** ADMIN

**Query Parameters:**
```typescript
{
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}
```

**Response:**
```typescript
{
  data: [
    {
      id: number;
      name: string;
      phone: string;
      email?: string;
      role: "ADMIN" | "SHOPKEEPER" | "CUSTOMER";
      status: "ACTIVE" | "INACTIVE";
      createdAt: string;
    }
  ];
  total: number;
  page: number;
  limit: number;
}
```

---

### 2. Get User by ID
**Endpoint:** `GET /users/:id`  
**Authentication:** ✅ Yes  
**Role Required:** ADMIN

**Response:**
```typescript
{
  id: number;
  name: string;
  phone: string;
  email?: string;
  role: "ADMIN" | "SHOPKEEPER" | "CUSTOMER";
  status: "ACTIVE" | "INACTIVE";
  createdAt: string;
  updatedAt: string;
}
```

---

### 3. Update User
**Endpoint:** `PATCH /users/:id`  
**Authentication:** ✅ Yes  
**Role Required:** ADMIN

**Request Body:**
```typescript
{
  name?: string;
  email?: string;
  phone?: string;
}
```

**Response:** Updated User object

---

### 4. Delete User
**Endpoint:** `DELETE /users/:id`  
**Authentication:** ✅ Yes  
**Role Required:** ADMIN

**Response:**
```typescript
{
  success: boolean;
  message: string;
}
```

---

### 5. Update User Status
**Endpoint:** `PATCH /users/:id/status`  
**Authentication:** ✅ Yes  
**Role Required:** ADMIN

**Request Body:**
```typescript
{
  status: "ACTIVE" | "INACTIVE"; // Required
}
```

**Response:** Updated User object

---

## 🏪 SHOPS Endpoints

### 1. Create Shop
**Endpoint:** `POST /shops`  
**Authentication:** ✅ Yes  
**Role Required:** SHOPKEEPER, ADMIN

**Request Body:**
```typescript
{
  name: string;           // Required
  address: string;        // Required
  city: string;           // Required
  area?: string;          // Optional
  phone?: string;         // Optional
  logo?: string;          // Optional
  description?: string;   // Optional
}
```

**Response:**
```typescript
{
  id: number;
  name: string;
  address: string;
  city: string;
  area?: string;
  phone?: string;
  logo?: string;
  description?: string;
  ownerId: number;
  createdAt: string;
  updatedAt: string;
}
```

---

### 2. Get My Shops
**Endpoint:** `GET /shops/my`  
**Authentication:** ✅ Yes  
**Role Required:** SHOPKEEPER

**Query Parameters:**
```typescript
{
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}
```

**Response:** Paginated list of shops

---

### 3. Get All Shops
**Endpoint:** `GET /shops`  
**Authentication:** ✅ Yes  
**Role Required:** All

**Query Parameters:** Same as above

**Response:** Paginated list of shops

---

### 4. Get Shop by ID
**Endpoint:** `GET /shops/:id`  
**Authentication:** ✅ Yes  
**Role Required:** All

**Response:** Single Shop object

---

### 5. Update Shop
**Endpoint:** `PATCH /shops/:id`  
**Authentication:** ✅ Yes  
**Role Required:** SHOPKEEPER (owner), ADMIN

**Request Body:**
```typescript
{
  name?: string;
  address?: string;
  city?: string;
  area?: string;
  phone?: string;
  logo?: string;
  description?: string;
}
```

**Response:** Updated Shop object

---

### 6. Delete Shop
**Endpoint:** `DELETE /shops/:id`  
**Authentication:** ✅ Yes  
**Role Required:** SHOPKEEPER (owner), ADMIN

**Response:** Success message

---

## 👨‍💼 SELLERS Endpoints

### 1. Create Seller
**Endpoint:** `POST /shops/:shopId/sellers`  
**Authentication:** ✅ Yes  
**Role Required:** SHOPKEEPER (owner), ADMIN

**Request Body:**
```typescript
{
  name: string;                   // Required
  fatherName?: string;            // Optional
  cnic: string;                   // Required, exactly 15 chars
  phone: string;                  // Required
  address: string;                // Required
  cnicFrontImage?: string;        // Optional (base64 or URL)
  cnicBackImage?: string;         // Optional (base64 or URL)
}
```

**Response:**
```typescript
{
  id: number;
  shopId: number;
  name: string;
  fatherName?: string;
  cnic: string;
  phone: string;
  address: string;
  cnicFrontImage?: string;
  cnicBackImage?: string;
  createdAt: string;
  updatedAt: string;
}
```

---

### 2. Get Sellers for Shop
**Endpoint:** `GET /shops/:shopId/sellers`  
**Authentication:** ✅ Yes  
**Role Required:** SHOPKEEPER (owner), ADMIN

**Response:** List of sellers

---

### 3. Get Seller by ID
**Endpoint:** `GET /sellers/:id`  
**Authentication:** ✅ Yes  
**Role Required:** SHOPKEEPER (owner), ADMIN

**Response:** Single Seller object

---

### 4. Update Seller
**Endpoint:** `PATCH /sellers/:id`  
**Authentication:** ✅ Yes  
**Role Required:** SHOPKEEPER (owner), ADMIN

**Request Body:** Same fields as Create Seller (all optional)

**Response:** Updated Seller object

---

### 5. Delete Seller
**Endpoint:** `DELETE /sellers/:id`  
**Authentication:** ✅ Yes  
**Role Required:** SHOPKEEPER (owner), ADMIN

**Response:** Success message

---

### 6. Get Seller Purchases
**Endpoint:** `GET /sellers/:id/purchases`  
**Authentication:** ✅ Yes  
**Role Required:** SHOPKEEPER (owner), ADMIN

**Response:** List of purchases from this seller

---

## 👤 CUSTOMERS Endpoints

### 1. Create Customer
**Endpoint:** `POST /customers`  
**Authentication:** ✅ Yes  
**Role Required:** All

**Request Body:**
```typescript
{
  userId?: number;        // Optional
  name: string;           // Required
  phone: string;          // Required
  cnic?: string;          // Optional, exactly 15 chars if provided
  address?: string;       // Optional
}
```

**Response:**
```typescript
{
  id: number;
  userId?: number;
  name: string;
  phone: string;
  cnic?: string;
  address?: string;
  createdAt: string;
  updatedAt: string;
}
```

---

### 2. Get All Customers
**Endpoint:** `GET /customers`  
**Authentication:** ✅ Yes  
**Role Required:** All

**Query Parameters:**
```typescript
{
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}
```

**Response:** Paginated list of customers

---

### 3. Get Customer by ID
**Endpoint:** `GET /customers/:id`  
**Authentication:** ✅ Yes  
**Role Required:** All

**Response:** Single Customer object

---

### 4. Update Customer
**Endpoint:** `PATCH /customers/:id`  
**Authentication:** ✅ Yes  
**Role Required:** All

**Request Body:** Same fields as Create Customer (all optional)

**Response:** Updated Customer object

---

### 5. Delete Customer
**Endpoint:** `DELETE /customers/:id`  
**Authentication:** ✅ Yes  
**Role Required:** All

**Response:** Success message

---

## 📱 PRODUCTS Endpoints

### 1. Create Product
**Endpoint:** `POST /shops/:shopId/products`  
**Authentication:** ✅ Yes  
**Role Required:** SHOPKEEPER (owner), ADMIN

**Request Body:**
```typescript
{
  sellerId: number;                              // Required, seller ID
  brand: string;                                 // Required (e.g., "Samsung")
  model: string;                                 // Required (e.g., "Galaxy S21")
  variant?: string;                              // Optional (e.g., "256GB")
  imei1: string;                                 // Required
  imei2?: string;                                // Optional (second IMEI)
  storage?: string;                              // Optional (e.g., "256GB")
  ram?: string;                                  // Optional (e.g., "8GB")
  color?: string;                                // Optional
  condition: "LIKE_NEW" | "EXCELLENT" | "GOOD" | "FAIR" | "DAMAGED"; // Required
  batteryHealth?: number;                        // Optional, 0-100
  accessories?: string;                          // Optional description
  purchasePrice: number;                         // Required, min 0
  expectedSalePrice?: number;                    // Optional, min 0
  status?: "IN_STOCK" | "RESERVED" | "SOLD" | "RETURNED" | "DAMAGED" | "UNDER_REPAIR"; // Optional, default "IN_STOCK"
  ptaStatus: "APPROVED" | "NOT_APPROVED" | "PATCHED" | "UNKNOWN"; // Required
  ptaPrice?: number;                             // Optional if PTA status available
  boxCondition?: string;                         // Optional
  warrantyCard?: boolean;                        // Optional
}
```

**Response:**
```typescript
{
  id: number;
  shopId: number;
  sellerId: number;
  brand: string;
  model: string;
  variant?: string;
  imei1: string;
  imei2?: string;
  storage?: string;
  ram?: string;
  color?: string;
  condition: string;
  batteryHealth?: number;
  accessories?: string;
  purchasePrice: number;
  expectedSalePrice?: number;
  status: string;
  ptaStatus: string;
  ptaPrice?: number;
  images: any[];
  createdAt: string;
  updatedAt: string;
}
```

---

### 2. List Products for Shop
**Endpoint:** `GET /shops/:shopId/products`  
**Authentication:** ✅ Yes  
**Role Required:** SHOPKEEPER (owner), ADMIN

**Query Parameters:**
```typescript
{
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  status?: string;           // Filter by product status
  condition?: string;        // Filter by condition
  sellerId?: number;         // Filter by seller
  ptaStatus?: string;        // Filter by PTA status
}
```

**Response:** Paginated list of products

---

### 3. Get Product by ID
**Endpoint:** `GET /products/:id`  
**Authentication:** ✅ Yes  
**Role Required:** All

**Response:** Single Product object with images

---

### 4. Update Product
**Endpoint:** `PATCH /products/:id`  
**Authentication:** ✅ Yes  
**Role Required:** SHOPKEEPER (owner), ADMIN

**Request Body:** Same fields as Create Product (all optional)

**Response:** Updated Product object

---

### 5. Delete Product
**Endpoint:** `DELETE /products/:id`  
**Authentication:** ✅ Yes  
**Role Required:** SHOPKEEPER (owner), ADMIN

**Response:** Success message

---

### 6. Add Product Image
**Endpoint:** `POST /products/:id/images`  
**Authentication:** ✅ Yes  
**Role Required:** SHOPKEEPER (owner), ADMIN

**Request Body:**
```typescript
{
  url: string;    // Required, image URL or base64
  isPrimary?: boolean; // Optional, default false
}
```

**Response:**
```typescript
{
  id: number;
  productId: number;
  url: string;
  isPrimary: boolean;
  createdAt: string;
}
```

---

### 7. Delete Product Image
**Endpoint:** `DELETE /products/:id/images/:imageId`  
**Authentication:** ✅ Yes  
**Role Required:** SHOPKEEPER (owner), ADMIN

**Response:** Success message

---

### 8. Update Product Status
**Endpoint:** `PATCH /products/:id/status`  
**Authentication:** ✅ Yes  
**Role Required:** SHOPKEEPER (owner), ADMIN

**Request Body:**
```typescript
{
  status: "IN_STOCK" | "RESERVED" | "SOLD" | "RETURNED" | "DAMAGED" | "UNDER_REPAIR"; // Required
}
```

**Response:** Updated Product object

---

## 📦 PURCHASES Endpoints

### 1. Create Purchase
**Endpoint:** `POST /shops/:shopId/purchases`  
**Authentication:** ✅ Yes  
**Role Required:** SHOPKEEPER (owner), ADMIN

**Request Body:**
```typescript
{
  sellerId: number;           // Required
  productId: number;          // Required
  purchasePrice: number;      // Required
  paymentMethod: "CASH" | "BANK" | "JAZZCASH" | "EASYPAISA" | "CARD"; // Required
  paymentStatus?: "PAID" | "PENDING" | "PARTIAL"; // Optional
  notes?: string;             // Optional
}
```

**Response:**
```typescript
{
  id: number;
  shopId: number;
  sellerId: number;
  productId: number;
  purchasePrice: number;
  paymentMethod: string;
  paymentStatus: string;
  notes?: string;
  purchaseDate: string;
  createdAt: string;
  updatedAt: string;
}
```

---

### 2. List Purchases for Shop
**Endpoint:** `GET /shops/:shopId/purchases`  
**Authentication:** ✅ Yes  
**Role Required:** SHOPKEEPER (owner), ADMIN

**Query Parameters:**
```typescript
{
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  sellerId?: number;
  paymentStatus?: string;
}
```

**Response:** Paginated list of purchases

---

### 3. Get Purchase by ID
**Endpoint:** `GET /purchases/:id`  
**Authentication:** ✅ Yes  
**Role Required:** SHOPKEEPER (owner), ADMIN

**Response:** Single Purchase object

---

### 4. Update Purchase
**Endpoint:** `PATCH /purchases/:id`  
**Authentication:** ✅ Yes  
**Role Required:** SHOPKEEPER (owner), ADMIN

**Request Body:** Same fields as Create Purchase (all optional)

**Response:** Updated Purchase object

---

### 5. Delete Purchase
**Endpoint:** `DELETE /purchases/:id`  
**Authentication:** ✅ Yes  
**Role Required:** SHOPKEEPER (owner), ADMIN

**Response:** Success message

---

### 6. Get Purchase Receipt
**Endpoint:** `GET /purchases/:id/receipt`  
**Authentication:** ✅ Yes  
**Role Required:** SHOPKEEPER (owner), ADMIN

**Response:**
```typescript
{
  id: number;
  purchaseId: number;
  receiptNumber: string;
  amount: number;
  date: string;
  seller: {
    id: number;
    name: string;
    cnic: string;
    phone: string;
  };
  product: {
    id: number;
    brand: string;
    model: string;
    imei1: string;
  };
}
```

---

## 💰 SALES Endpoints

### 1. Create Sale - Offline
**Endpoint:** `POST /shops/:shopId/sales/offline`  
**Authentication:** ✅ Yes  
**Role Required:** SHOPKEEPER (owner), ADMIN

**Request Body:**
```typescript
{
  productId: number;          // Required
  customerId?: number;        // Optional, if existing customer
  customer?: {                // Or provide new customer
    name: string;
    phone: string;
    cnic?: string;
    address?: string;
  };
  salePrice: number;          // Required
  paymentMethod: "CASH" | "BANK" | "JAZZCASH" | "EASYPAISA" | "CARD"; // Required
  saleType?: "OFFLINE";       // Optional, default OFFLINE
  notes?: string;             // Optional
}
```

**Response:**
```typescript
{
  id: number;
  shopId: number;
  productId: number;
  customerId?: number;
  salePrice: number;
  paymentMethod: string;
  saleType: string;
  notes?: string;
  saleDate: string;
  createdAt: string;
  updatedAt: string;
}
```

---

### 2. Create Sale - Online
**Endpoint:** `POST /shops/:shopId/sales/online`  
**Authentication:** ✅ Yes  
**Role Required:** SHOPKEEPER (owner), ADMIN

**Request Body:** Same as Offline Sale but `saleType` is "ONLINE"

**Response:** Same as Offline Sale

---

### 3. List Sales for Shop
**Endpoint:** `GET /shops/:shopId/sales`  
**Authentication:** ✅ Yes  
**Role Required:** SHOPKEEPER (owner), ADMIN

**Query Parameters:**
```typescript
{
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  saleType?: "ONLINE" | "OFFLINE";
  paymentMethod?: string;
}
```

**Response:** Paginated list of sales

---

### 4. Get Sale by ID
**Endpoint:** `GET /sales/:id`  
**Authentication:** ✅ Yes  
**Role Required:** SHOPKEEPER (owner), ADMIN

**Response:** Single Sale object with product and customer details

---

### 5. Update Sale
**Endpoint:** `PATCH /sales/:id`  
**Authentication:** ✅ Yes  
**Role Required:** SHOPKEEPER (owner), ADMIN

**Request Body:** Same fields as Create Sale (all optional)

**Response:** Updated Sale object

---

### 6. Delete Sale
**Endpoint:** `DELETE /sales/:id`  
**Authentication:** ✅ Yes  
**Role Required:** SHOPKEEPER (owner), ADMIN

**Response:** Success message

---

### 7. Get Sale Invoice
**Endpoint:** `GET /sales/:id/invoice`  
**Authentication:** ✅ Yes  
**Role Required:** SHOPKEEPER (owner), ADMIN

**Response:**
```typescript
{
  id: number;
  invoiceNumber: string;
  saleId: number;
  amount: number;
  date: string;
  paymentMethod: string;
  customer: {
    id: number;
    name: string;
    phone: string;
    cnic?: string;
  };
  product: {
    id: number;
    brand: string;
    model: string;
    imei1: string;
  };
  shop: {
    id: number;
    name: string;
    address: string;
    phone?: string;
  };
}
```

---

## 📊 INVENTORY Endpoints

### 1. Get Shop Inventory
**Endpoint:** `GET /shops/:shopId/inventory`  
**Authentication:** ✅ Yes  
**Role Required:** SHOPKEEPER (owner), ADMIN

**Query Parameters:**
```typescript
{
  page?: number;
  limit?: number;
  status?: string;   // Filter by product status
}
```

**Response:**
```typescript
{
  data: [
    {
      id: number;
      shopId: number;
      productId: number;
      status: string;
      quantity: number;
      product: {
        id: number;
        brand: string;
        model: string;
        imei1: string;
        purchasePrice: number;
        expectedSalePrice?: number;
      };
    }
  ];
  total: number;
  page: number;
  limit: number;
}
```

---

### 2. Get Inventory Summary
**Endpoint:** `GET /shops/:shopId/inventory/summary`  
**Authentication:** ✅ Yes  
**Role Required:** SHOPKEEPER (owner), ADMIN

**Response:**
```typescript
{
  totalProducts: number;
  inStock: number;
  reserved: number;
  sold: number;
  damaged: number;
  underRepair: number;
  totalValue: number; // Total purchase value
}
```

---

### 3. Update Product Status in Inventory
**Endpoint:** `PATCH /inventory/products/:productId/status`  
**Authentication:** ✅ Yes  
**Role Required:** SHOPKEEPER (owner), ADMIN

**Request Body:**
```typescript
{
  status: "IN_STOCK" | "RESERVED" | "SOLD" | "RETURNED" | "DAMAGED" | "UNDER_REPAIR"; // Required
}
```

**Response:** Updated inventory item

---

## 💸 EXPENSES Endpoints

### 1. Create Expense
**Endpoint:** `POST /shops/:shopId/expenses`  
**Authentication:** ✅ Yes  
**Role Required:** SHOPKEEPER (owner), ADMIN

**Request Body:**
```typescript
{
  description: string;        // Required
  category?: string;          // Optional (e.g., "Utilities", "Rent", "Salaries")
  amount: number;             // Required
  date?: string;              // Optional, ISO format
  paidBy?: string;            // Optional
  notes?: string;             // Optional
}
```

**Response:**
```typescript
{
  id: number;
  shopId: number;
  description: string;
  category?: string;
  amount: number;
  date: string;
  paidBy?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}
```

---

### 2. List Expenses for Shop
**Endpoint:** `GET /shops/:shopId/expenses`  
**Authentication:** ✅ Yes  
**Role Required:** SHOPKEEPER (owner), ADMIN

**Query Parameters:**
```typescript
{
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  category?: string;
  startDate?: string; // ISO format
  endDate?: string;   // ISO format
}
```

**Response:** Paginated list of expenses

---

### 3. Get Expense by ID
**Endpoint:** `GET /expenses/:id`  
**Authentication:** ✅ Yes  
**Role Required:** SHOPKEEPER (owner), ADMIN

**Response:** Single Expense object

---

### 4. Update Expense
**Endpoint:** `PATCH /expenses/:id`  
**Authentication:** ✅ Yes  
**Role Required:** SHOPKEEPER (owner), ADMIN

**Request Body:** Same fields as Create Expense (all optional)

**Response:** Updated Expense object

---

### 5. Delete Expense
**Endpoint:** `DELETE /expenses/:id`  
**Authentication:** ✅ Yes  
**Role Required:** SHOPKEEPER (owner), ADMIN

**Response:** Success message

---

## 📈 REPORTS Endpoints

### 1. Get Dashboard Report
**Endpoint:** `GET /shops/:shopId/reports/dashboard`  
**Authentication:** ✅ Yes  
**Role Required:** SHOPKEEPER (owner), ADMIN

**Query Parameters:**
```typescript
{
  startDate?: string; // ISO format
  endDate?: string;   // ISO format
}
```

**Response:**
```typescript
{
  totalProducts: number;
  totalSales: number;
  totalRevenue: number;
  totalExpenses: number;
  totalProfit: number;
  inStockProducts: number;
  recentSales: any[];
  topProducts: any[];
}
```

---

### 2. Get Daily Sales Report
**Endpoint:** `GET /shops/:shopId/reports/daily-sales`  
**Authentication:** ✅ Yes  
**Role Required:** SHOPKEEPER (owner), ADMIN

**Query Parameters:**
```typescript
{
  date?: string;      // ISO format, default today
}
```

**Response:**
```typescript
{
  date: string;
  totalSales: number;
  totalRevenue: number;
  paymentMethods: {
    [key: string]: number; // Count per method
  };
  sales: any[]; // List of sales for that day
}
```

---

### 3. Get Monthly Sales Report
**Endpoint:** `GET /shops/:shopId/reports/monthly-sales`  
**Authentication:** ✅ Yes  
**Role Required:** SHOPKEEPER (owner), ADMIN

**Query Parameters:**
```typescript
{
  year?: number;
  month?: number; // 1-12
}
```

**Response:**
```typescript
{
  month: string;
  totalSales: number;
  totalRevenue: number;
  averagePrice: number;
  dailyBreakdown: any[];
}
```

---

### 4. Get Profit & Loss Report
**Endpoint:** `GET /shops/:shopId/reports/profit-loss`  
**Authentication:** ✅ Yes  
**Role Required:** SHOPKEEPER (owner), ADMIN

**Query Parameters:**
```typescript
{
  startDate?: string;
  endDate?: string;
}
```

**Response:**
```typescript
{
  period: string;
  totalRevenue: number;
  totalExpenses: number;
  costOfGoodsSold: number;
  grossProfit: number;
  netProfit: number;
  profitMargin: string; // Percentage
}
```

---

### 5. Get Stock Value Report
**Endpoint:** `GET /shops/:shopId/reports/stock-value`  
**Authentication:** ✅ Yes  
**Role Required:** SHOPKEEPER (owner), ADMIN

**Response:**
```typescript
{
  totalProducts: number;
  totalValue: number;
  byStatus: {
    IN_STOCK: number;
    RESERVED: number;
    SOLD: number;
    DAMAGED: number;
    UNDER_REPAIR: number;
  };
  byCondition: {
    LIKE_NEW: number;
    EXCELLENT: number;
    GOOD: number;
    FAIR: number;
    DAMAGED: number;
  };
}
```

---

### 6. Get Sold Products Report
**Endpoint:** `GET /shops/:shopId/reports/sold-products`  
**Authentication:** ✅ Yes  
**Role Required:** SHOPKEEPER (owner), ADMIN

**Query Parameters:**
```typescript
{
  page?: number;
  limit?: number;
  startDate?: string;
  endDate?: string;
}
```

**Response:**
```typescript
{
  data: [
    {
      id: number;
      brand: string;
      model: string;
      imei1: string;
      purchasePrice: number;
      salePrice: number;
      profit: number;
      saleDate: string;
      customer: {
        name: string;
        phone: string;
      };
    }
  ];
  total: number;
  totalProfit: number;
}
```

---

### 7. Get Seller Compliance Report
**Endpoint:** `GET /shops/:shopId/reports/seller-compliance`  
**Authentication:** ✅ Yes  
**Role Required:** SHOPKEEPER (owner), ADMIN

**Response:**
```typescript
{
  sellers: [
    {
      id: number;
      name: string;
      totalProducts: number;
      soldProducts: number;
      damagedProducts: number;
      returnedProducts: number;
      complianceRate: string; // Percentage
    }
  ];
}
```

---

### 8. Get IMEI History Report
**Endpoint:** `GET /shops/:shopId/reports/imei-history/:imei`  
**Authentication:** ✅ Yes  
**Role Required:** SHOPKEEPER (owner), ADMIN

**Response:**
```typescript
{
  imei: string;
  product: {
    id: number;
    brand: string;
    model: string;
  };
  currentStatus: string;
  seller: {
    name: string;
    phone: string;
  };
  purchase: {
    date: string;
    price: number;
  };
  sale?: {
    date: string;
    price: number;
    customer: {
      name: string;
      phone: string;
    };
  };
}
```

---

## 🌐 MARKETPLACE Endpoints (Public)

### 1. Get All Shops
**Endpoint:** `GET /marketplace/shops`  
**Authentication:** ❌ No  
**Role Required:** None

**Query Parameters:**
```typescript
{
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  city?: string;
}
```

**Response:** Paginated list of shops (public info only)

---

### 2. Get Shop Details
**Endpoint:** `GET /marketplace/shops/:shopId`  
**Authentication:** ❌ No  
**Role Required:** None

**Response:** Shop details with product count and reviews

---

### 3. Get All Products
**Endpoint:** `GET /marketplace/products`  
**Authentication:** ❌ No  
**Role Required:** None

**Query Parameters:**
```typescript
{
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  brand?: string;
  condition?: string;
  priceMin?: number;
  priceMax?: number;
}
```

**Response:** Paginated list of products (IN_STOCK only)

---

### 4. Get Product Details
**Endpoint:** `GET /marketplace/products/:id`  
**Authentication:** ❌ No  
**Role Required:** None

**Response:** Detailed product information with shop and seller details

---

## 🔍 AUDIT LOGS Endpoints (ADMIN Only)

### 1. Get Audit Logs
**Endpoint:** `GET /audit-logs`  
**Authentication:** ✅ Yes  
**Role Required:** ADMIN

**Query Parameters:**
```typescript
{
  page?: number;
  limit?: number;
  userId?: number;
  action?: string;      // e.g., "CREATE", "UPDATE", "DELETE"
  entityType?: string;  // e.g., "PRODUCT", "SALE"
  startDate?: string;
  endDate?: string;
}
```

**Response:**
```typescript
{
  data: [
    {
      id: number;
      userId: number;
      action: string;
      entityType: string;
      entityId: number;
      changes?: any; // Object of changed fields
      timestamp: string;
    }
  ];
  total: number;
  page: number;
  limit: number;
}
```

---

## ⚠️ Error Responses

All endpoints follow this error format:

```typescript
{
  success: false;
  message: string;
  error: string;
  statusCode: number;
}
```

### Common HTTP Status Codes
- `200 OK` - Successful GET, PATCH
- `201 Created` - Successful POST
- `204 No Content` - Successful DELETE
- `400 Bad Request` - Invalid input data
- `401 Unauthorized` - Missing or invalid token
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource not found
- `409 Conflict` - Resource already exists or conflict
- `500 Internal Server Error` - Server error

---

## 📝 Frontend Integration Guide

### TypeScript Interfaces
Create these interfaces in your frontend:

```typescript
// Auth
interface LoginRequest {
  phone?: string;
  email?: string;
  password: string;
}

interface LoginResponse {
  access_token: string;
  user: User;
}

// Common
interface User {
  id: number;
  name: string;
  phone: string;
  email?: string;
  role: "ADMIN" | "SHOPKEEPER" | "CUSTOMER";
}

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

// Entities
interface Shop {
  id: number;
  name: string;
  address: string;
  city: string;
  area?: string;
  phone?: string;
  logo?: string;
  description?: string;
  ownerId: number;
  createdAt: string;
  updatedAt: string;
}

interface Product {
  id: number;
  shopId: number;
  sellerId: number;
  brand: string;
  model: string;
  variant?: string;
  imei1: string;
  imei2?: string;
  storage?: string;
  ram?: string;
  color?: string;
  condition: string;
  batteryHealth?: number;
  accessories?: string;
  purchasePrice: number;
  expectedSalePrice?: number;
  status: string;
  ptaStatus: string;
  ptaPrice?: number;
  images: ProductImage[];
  createdAt: string;
  updatedAt: string;
}

interface ProductImage {
  id: number;
  productId: number;
  url: string;
  isPrimary: boolean;
  createdAt: string;
}

interface Sale {
  id: number;
  shopId: number;
  productId: number;
  customerId?: number;
  salePrice: number;
  paymentMethod: string;
  saleType: string;
  notes?: string;
  saleDate: string;
  product?: Product;
  customer?: Customer;
  createdAt: string;
  updatedAt: string;
}

interface Customer {
  id: number;
  userId?: number;
  name: string;
  phone: string;
  cnic?: string;
  address?: string;
  createdAt: string;
  updatedAt: string;
}
```

### API Service Example (React/Angular)

```typescript
class PosApiService {
  private baseUrl = 'http://localhost:3000/api';
  private token: string | null = null;

  setToken(token: string) {
    this.token = token;
  }

  private getHeaders() {
    return {
      'Content-Type': 'application/json',
      ...(this.token ? { 'Authorization': `Bearer ${this.token}` } : {}),
    };
  }

  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await fetch(`${this.baseUrl}/auth/login`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(credentials),
    });
    return response.json();
  }

  async register(data: RegisterDto): Promise<User> {
    const response = await fetch(`${this.baseUrl}/auth/register`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });
    return response.json();
  }

  async getProfile(): Promise<ApiResponse<User>> {
    const response = await fetch(`${this.baseUrl}/auth/profile`, {
      headers: this.getHeaders(),
    });
    return response.json();
  }

  async getShops(page = 1, limit = 20): Promise<ApiResponse<PaginatedResponse<Shop>>> {
    const response = await fetch(
      `${this.baseUrl}/shops?page=${page}&limit=${limit}`,
      { headers: this.getHeaders() }
    );
    return response.json();
  }

  // Add more methods for other endpoints...
}
```

---

## 🚀 Testing with Postman/cURL

### 1. Register
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "phone": "03001234567",
    "email": "john@example.com",
    "password": "password123",
    "role": "SHOPKEEPER"
  }'
```

### 2. Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "03001234567",
    "password": "password123"
  }'
```

### 3. Create Shop (Protected)
```bash
curl -X POST http://localhost:3000/api/shops \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "name": "Tech Haven",
    "address": "123 Main St",
    "city": "Karachi",
    "area": "Defence",
    "phone": "02134567890"
  }'
```

---

## 📞 Support Notes

- All timestamps are in ISO 8601 format
- All numeric IDs are integers
- Prices are in the system's default currency (likely PKR)
- CNIC must be exactly 15 characters
- Phone numbers should include country code
- Search is case-insensitive and searches across multiple fields
- Pagination starts at page 1
- Maximum limit is 100 items per page

---

**Generated:** April 2026  
**API Version:** 1.0.0
