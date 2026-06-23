# POS NestJS Application - Complete API Endpoints Documentation

**Last Updated:** April 30, 2026

---

## Table of Contents
1. [Auth Module](#auth-module)
2. [Users Module](#users-module)
3. [Shops Module](#shops-module)
4. [Sellers Module](#sellers-module)
5. [Customers Module](#customers-module)
6. [Products Module](#products-module)
7. [Purchases Module](#purchases-module)
8. [Sales Module](#sales-module)
9. [Inventory Module](#inventory-module)
10. [Expenses Module](#expenses-module)
11. [Reports Module](#reports-module)
12. [Marketplace Module](#marketplace-module)
13. [Audit Logs Module](#audit-logs-module)

---

## Auth Module

**Base Path:** `/auth`  
**Auth Required:** No for register/login, Yes for profile/change-password  
**Tags:** `Auth`

### Endpoints

#### 1. Register User
- **HTTP Method:** `POST`
- **Route:** `/auth/register`
- **Auth Required:** No
- **Request Body (DTO):** `RegisterDto`
  ```typescript
  {
    name: string (required)
    phone: string (required)
    email?: string (optional, must be valid email)
    password: string (required, min length 6)
    confirmPassword?: string (optional)
    role: UserRole enum (required) - ADMIN | SHOPKEEPER | CUSTOMER
  }
  ```
- **Response Type:** User object with JWT token
- **Query Parameters:** None

#### 2. Login
- **HTTP Method:** `POST`
- **Route:** `/auth/login`
- **Auth Required:** No
- **Request Body (DTO):** `LoginDto`
  ```typescript
  {
    phone?: string (optional)
    email?: string (optional)
    password: string (required)
  }
  ```
- **Response Type:** User object with JWT token
- **Query Parameters:** None

#### 3. Get Profile
- **HTTP Method:** `GET`
- **Route:** `/auth/profile`
- **Auth Required:** Yes (JWT Bearer Token)
- **Request Body:** None
- **Response Type:** User profile object with auth details
- **Query Parameters:** None

#### 4. Change Password
- **HTTP Method:** `POST`
- **Route:** `/auth/change-password`
- **Auth Required:** Yes (JWT Bearer Token)
- **Request Body (DTO):** `ChangePasswordDto`
  ```typescript
  {
    currentPassword: string (required)
    newPassword: string (required, min length 6)
  }
  ```
- **Response Type:** Success message with updated user object
- **Query Parameters:** None

---

## Users Module

**Base Path:** `/users`  
**Auth Required:** Yes (JWT Bearer Token)  
**Tags:** `Users`  
**Guards:** `JwtAuthGuard`, `RolesGuard`

### Endpoints

#### 1. Get All Users
- **HTTP Method:** `GET`
- **Route:** `/users`
- **Auth Required:** Yes
- **Roles Required:** ADMIN only
- **Request Body:** None
- **Response Type:** Paginated list of User objects
- **Query Parameters (DTO):** `PaginationDto`
  ```typescript
  {
    page?: number (optional, default: 1, min: 1)
    limit?: number (optional, default: 20, min: 1, max: 100)
    search?: string (optional)
    sortBy?: string (optional)
    sortOrder?: 'asc' | 'desc' (optional, default: 'desc')
  }
  ```

#### 2. Get User by ID
- **HTTP Method:** `GET`
- **Route:** `/users/:id`
- **Auth Required:** Yes
- **Roles Required:** None (any authenticated user)
- **Request Body:** None
- **Response Type:** User object
- **Path Parameters:**
  - `id`: number (user ID)
- **Query Parameters:** None

#### 3. Update User
- **HTTP Method:** `PATCH`
- **Route:** `/users/:id`
- **Auth Required:** Yes
- **Roles Required:** None
- **Request Body (DTO):** `UpdateUserDto`
  ```typescript
  {
    name?: string (optional)
    email?: string (optional, must be valid email)
    phone?: string (optional)
  }
  ```
- **Response Type:** Updated User object
- **Path Parameters:**
  - `id`: number (user ID)
- **Query Parameters:** None

#### 4. Delete User
- **HTTP Method:** `DELETE`
- **Route:** `/users/:id`
- **Auth Required:** Yes
- **Roles Required:** ADMIN only
- **Request Body:** None
- **Response Type:** Success message
- **Path Parameters:**
  - `id`: number (user ID)
- **Query Parameters:** None

#### 5. Update User Status
- **HTTP Method:** `PATCH`
- **Route:** `/users/:id/status`
- **Auth Required:** Yes
- **Roles Required:** ADMIN only
- **Request Body (DTO):** `UpdateUserStatusDto`
  ```typescript
  {
    isActive: boolean (required)
  }
  ```
- **Response Type:** Updated User object
- **Path Parameters:**
  - `id`: number (user ID)
- **Query Parameters:** None

---

## Shops Module

**Base Path:** `/shops`  
**Auth Required:** Yes (JWT Bearer Token)  
**Tags:** `Shops`  
**Guards:** `JwtAuthGuard`, `RolesGuard`

### Endpoints

#### 1. Create Shop
- **HTTP Method:** `POST`
- **Route:** `/shops`
- **Auth Required:** Yes
- **Roles Required:** SHOPKEEPER, ADMIN
- **Request Body (DTO):** `CreateShopDto`
  ```typescript
  {
    name: string (required)
    address: string (required)
    city: string (required)
    area?: string (optional)
    phone?: string (optional)
    logo?: string (optional)
    description?: string (optional)
  }
  ```
- **Response Type:** Created Shop object
- **Query Parameters:** None

#### 2. Get My Shops
- **HTTP Method:** `GET`
- **Route:** `/shops/my`
- **Auth Required:** Yes
- **Roles Required:** SHOPKEEPER
- **Request Body:** None
- **Response Type:** Paginated list of Shop objects
- **Query Parameters (DTO):** `PaginationDto`
  ```typescript
  {
    page?: number
    limit?: number
    search?: string
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
  }
  ```

#### 3. Get All Shops
- **HTTP Method:** `GET`
- **Route:** `/shops`
- **Auth Required:** Yes
- **Roles Required:** None
- **Request Body:** None
- **Response Type:** Paginated list of Shop objects
- **Query Parameters (DTO):** `PaginationDto`
  ```typescript
  {
    page?: number
    limit?: number
    search?: string
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
  }
  ```

#### 4. Get Shop by ID
- **HTTP Method:** `GET`
- **Route:** `/shops/:id`
- **Auth Required:** Yes
- **Roles Required:** None
- **Request Body:** None
- **Response Type:** Shop object with related data
- **Path Parameters:**
  - `id`: number (shop ID)
- **Query Parameters:** None

#### 5. Update Shop
- **HTTP Method:** `PATCH`
- **Route:** `/shops/:id`
- **Auth Required:** Yes
- **Roles Required:** None
- **Request Body (DTO):** `UpdateShopDto` (partial CreateShopDto)
  ```typescript
  {
    name?: string
    address?: string
    city?: string
    area?: string
    phone?: string
    logo?: string
    description?: string
  }
  ```
- **Response Type:** Updated Shop object
- **Path Parameters:**
  - `id`: number (shop ID)
- **Query Parameters:** None

#### 6. Delete Shop
- **HTTP Method:** `DELETE`
- **Route:** `/shops/:id`
- **Auth Required:** Yes
- **Roles Required:** None
- **Request Body:** None
- **Response Type:** Success message
- **Path Parameters:**
  - `id`: number (shop ID)
- **Query Parameters:** None

---

## Sellers Module

**Base Path:** Dynamic (no single base path)  
**Auth Required:** Yes (JWT Bearer Token)  
**Tags:** `Sellers`  
**Guards:** `JwtAuthGuard`, `RolesGuard`

### Endpoints

#### 1. Create Seller
- **HTTP Method:** `POST`
- **Route:** `/shops/:shopId/sellers`
- **Auth Required:** Yes
- **Roles Required:** None
- **Request Body (DTO):** `CreateSellerDto`
  ```typescript
  {
    name: string (required)
    fatherName?: string (optional)
    cnic: string (required, length exactly 15)
    phone: string (required)
    address: string (required)
    cnicFrontImage?: string (optional)
    cnicBackImage?: string (optional)
    photo?: string (optional)
  }
  ```
- **Response Type:** Created Seller object
- **Path Parameters:**
  - `shopId`: number (shop ID)
- **Query Parameters:** None

#### 2. List Sellers
- **HTTP Method:** `GET`
- **Route:** `/shops/:shopId/sellers`
- **Auth Required:** Yes
- **Roles Required:** None
- **Request Body:** None
- **Response Type:** Paginated list of Seller objects
- **Path Parameters:**
  - `shopId`: number (shop ID)
- **Query Parameters (DTO):** `PaginationDto`
  ```typescript
  {
    page?: number
    limit?: number
    search?: string
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
  }
  ```

#### 3. Get Seller by ID
- **HTTP Method:** `GET`
- **Route:** `/sellers/:id`
- **Auth Required:** Yes
- **Roles Required:** None
- **Request Body:** None
- **Response Type:** Seller object with details
- **Path Parameters:**
  - `id`: number (seller ID)
- **Query Parameters:** None

#### 4. Update Seller
- **HTTP Method:** `PATCH`
- **Route:** `/sellers/:id`
- **Auth Required:** Yes
- **Roles Required:** None
- **Request Body (DTO):** `UpdateSellerDto` (partial CreateSellerDto)
  ```typescript
  {
    name?: string
    fatherName?: string
    cnic?: string
    phone?: string
    address?: string
    cnicFrontImage?: string
    cnicBackImage?: string
    photo?: string
  }
  ```
- **Response Type:** Updated Seller object
- **Path Parameters:**
  - `id`: number (seller ID)
- **Query Parameters:** None

#### 5. Delete Seller
- **HTTP Method:** `DELETE`
- **Route:** `/sellers/:id`
- **Auth Required:** Yes
- **Roles Required:** None
- **Request Body:** None
- **Response Type:** Success message
- **Path Parameters:**
  - `id`: number (seller ID)
- **Query Parameters:** None

#### 6. Get Seller Purchases
- **HTTP Method:** `GET`
- **Route:** `/sellers/:id/purchases`
- **Auth Required:** Yes
- **Roles Required:** None
- **Request Body:** None
- **Response Type:** List of Purchase objects for seller
- **Path Parameters:**
  - `id`: number (seller ID)
- **Query Parameters:** None

---

## Customers Module

**Base Path:** `/customers`  
**Auth Required:** Yes (JWT Bearer Token)  
**Tags:** `Customers`  
**Guards:** `JwtAuthGuard`

### Endpoints

#### 1. Create Customer
- **HTTP Method:** `POST`
- **Route:** `/customers`
- **Auth Required:** Yes
- **Request Body (DTO):** `CreateCustomerDto`
  ```typescript
  {
    userId?: number (optional)
    name: string (required)
    phone: string (required)
    cnic?: string (optional, length exactly 15)
    address?: string (optional)
  }
  ```
- **Response Type:** Created Customer object
- **Query Parameters:** None

#### 2. List Customers
- **HTTP Method:** `GET`
- **Route:** `/customers`
- **Auth Required:** Yes
- **Request Body:** None
- **Response Type:** Paginated list of Customer objects
- **Query Parameters (DTO):** `PaginationDto`
  ```typescript
  {
    page?: number
    limit?: number
    search?: string
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
  }
  ```

#### 3. Get Customer by ID
- **HTTP Method:** `GET`
- **Route:** `/customers/:id`
- **Auth Required:** Yes
- **Request Body:** None
- **Response Type:** Customer object with details
- **Path Parameters:**
  - `id`: number (customer ID)
- **Query Parameters:** None

#### 4. Update Customer
- **HTTP Method:** `PATCH`
- **Route:** `/customers/:id`
- **Auth Required:** Yes
- **Request Body (DTO):** `UpdateCustomerDto` (partial CreateCustomerDto)
  ```typescript
  {
    userId?: number
    name?: string
    phone?: string
    cnic?: string
    address?: string
  }
  ```
- **Response Type:** Updated Customer object
- **Path Parameters:**
  - `id`: number (customer ID)
- **Query Parameters:** None

#### 5. Delete Customer
- **HTTP Method:** `DELETE`
- **Route:** `/customers/:id`
- **Auth Required:** Yes
- **Request Body:** None
- **Response Type:** Success message
- **Path Parameters:**
  - `id`: number (customer ID)
- **Query Parameters:** None

---

## Products Module

**Base Path:** Dynamic  
**Auth Required:** Yes (JWT Bearer Token)  
**Tags:** `Products`  
**Guards:** `JwtAuthGuard`, `RolesGuard`

### Endpoints

#### 1. Create Product
- **HTTP Method:** `POST`
- **Route:** `/shops/:shopId/products`
- **Auth Required:** Yes
- **Request Body (DTO):** `CreateProductDto`
  ```typescript
  {
    sellerId: number (required)
    brand: string (required)
    model: string (required)
    variant?: string (optional)
    imei1: string (required)
    imei2?: string (optional)
    storage?: string (optional)
    ram?: string (optional)
    color?: string (optional)
    condition: ProductCondition enum (required) 
      - LIKE_NEW | EXCELLENT | GOOD | FAIR | DAMAGED
    batteryHealth?: number (optional, 0-100)
    accessories?: string (optional)
    purchasePrice: number (required, min: 0)
    expectedSalePrice?: number (optional, min: 0)
    status?: ProductStatus (optional)
      - IN_STOCK | RESERVED | SOLD | RETURNED | DAMAGED | UNDER_REPAIR
    ptaStatus: PtaStatus enum (required)
      - APPROVED | NOT_APPROVED | PATCHED | UNKNOWN
    description?: string (optional)
    purchaseDate: ISO date string (required)
  }
  ```
- **Response Type:** Created Product object
- **Path Parameters:**
  - `shopId`: number (shop ID)
- **Query Parameters:** None

#### 2. List Products
- **HTTP Method:** `GET`
- **Route:** `/shops/:shopId/products`
- **Auth Required:** Yes
- **Request Body:** None
- **Response Type:** Paginated list of Product objects
- **Path Parameters:**
  - `shopId`: number (shop ID)
- **Query Parameters (DTO):** `ProductFilterDto`
  ```typescript
  {
    page?: number
    limit?: number
    search?: string
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
    brand?: string (optional)
    model?: string (optional)
    imei?: string (optional)
    status?: ProductStatus enum (optional)
    condition?: ProductCondition enum (optional)
    ptaStatus?: PtaStatus enum (optional)
    minPrice?: number (optional, min: 0)
    maxPrice?: number (optional, min: 0)
  }
  ```

#### 3. Get Product by ID
- **HTTP Method:** `GET`
- **Route:** `/products/:id`
- **Auth Required:** Yes
- **Request Body:** None
- **Response Type:** Product object with images and related data
- **Path Parameters:**
  - `id`: number (product ID)
- **Query Parameters:** None

#### 4. Update Product
- **HTTP Method:** `PATCH`
- **Route:** `/products/:id`
- **Auth Required:** Yes
- **Request Body (DTO):** `UpdateProductDto` (partial CreateProductDto)
  ```typescript
  {
    sellerId?: number
    brand?: string
    model?: string
    variant?: string
    imei1?: string
    imei2?: string
    storage?: string
    ram?: string
    color?: string
    condition?: ProductCondition
    batteryHealth?: number
    accessories?: string
    purchasePrice?: number
    expectedSalePrice?: number
    status?: ProductStatus
    ptaStatus?: PtaStatus
    description?: string
    purchaseDate?: ISO date string
  }
  ```
- **Response Type:** Updated Product object
- **Path Parameters:**
  - `id`: number (product ID)
- **Query Parameters:** None

#### 5. Delete Product
- **HTTP Method:** `DELETE`
- **Route:** `/products/:id`
- **Auth Required:** Yes
- **Request Body:** None
- **Response Type:** Success message
- **Path Parameters:**
  - `id`: number (product ID)
- **Query Parameters:** None

#### 6. Add Product Image
- **HTTP Method:** `POST`
- **Route:** `/products/:id/images`
- **Auth Required:** Yes
- **Request Body (DTO):** `ProductImageDto`
  ```typescript
  {
    imageUrl: string (required)
    isPrimary?: boolean (optional)
  }
  ```
- **Response Type:** Created ProductImage object
- **Path Parameters:**
  - `id`: number (product ID)
- **Query Parameters:** None

#### 7. Delete Product Image
- **HTTP Method:** `DELETE`
- **Route:** `/products/:id/images/:imageId`
- **Auth Required:** Yes
- **Request Body:** None
- **Response Type:** Success message
- **Path Parameters:**
  - `id`: number (product ID)
  - `imageId`: number (image ID)
- **Query Parameters:** None

#### 8. Update Product Status
- **HTTP Method:** `PATCH`
- **Route:** `/products/:id/status`
- **Auth Required:** Yes
- **Request Body (DTO):** `UpdateProductStatusDto`
  ```typescript
  {
    status: ProductStatus enum (required)
      - IN_STOCK | RESERVED | SOLD | RETURNED | DAMAGED | UNDER_REPAIR
  }
  ```
- **Response Type:** Updated Product object
- **Path Parameters:**
  - `id`: number (product ID)
- **Query Parameters:** None

---

## Purchases Module

**Base Path:** Dynamic  
**Auth Required:** Yes (JWT Bearer Token)  
**Tags:** `Purchases`  
**Guards:** `JwtAuthGuard`

### Endpoints

#### 1. Create Purchase
- **HTTP Method:** `POST`
- **Route:** `/shops/:shopId/purchases`
- **Auth Required:** Yes
- **Request Body (DTO):** `CreatePurchaseDto`
  ```typescript
  {
    sellerId?: number (optional)
    seller?: CreateSellerDto (optional, nested object)
    product: CreateProductDto (required, nested object)
    purchase: PurchaseMetaDto (required, nested object)
      {
        purchasePrice: number (required, min: 0)
        purchaseDate: ISO date string (required)
        notes?: string (optional)
        receiptNumber?: string (optional)
      }
  }
  ```
- **Response Type:** Created Purchase object with Product
- **Path Parameters:**
  - `shopId`: number (shop ID)
- **Query Parameters:** None

#### 2. List Purchases
- **HTTP Method:** `GET`
- **Route:** `/shops/:shopId/purchases`
- **Auth Required:** Yes
- **Request Body:** None
- **Response Type:** Paginated list of Purchase objects
- **Path Parameters:**
  - `shopId`: number (shop ID)
- **Query Parameters (DTO):** `PaginationDto`
  ```typescript
  {
    page?: number
    limit?: number
    search?: string
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
  }
  ```

#### 3. Get Purchase by ID
- **HTTP Method:** `GET`
- **Route:** `/purchases/:id`
- **Auth Required:** Yes
- **Request Body:** None
- **Response Type:** Purchase object with related Product and Seller
- **Path Parameters:**
  - `id`: number (purchase ID)
- **Query Parameters:** None

#### 4. Update Purchase
- **HTTP Method:** `PATCH`
- **Route:** `/purchases/:id`
- **Auth Required:** Yes
- **Request Body (DTO):** `UpdatePurchaseDto` (partial PurchaseMetaDto)
  ```typescript
  {
    purchasePrice?: number
    purchaseDate?: ISO date string
    notes?: string
    receiptNumber?: string
  }
  ```
- **Response Type:** Updated Purchase object
- **Path Parameters:**
  - `id`: number (purchase ID)
- **Query Parameters:** None

#### 5. Delete Purchase
- **HTTP Method:** `DELETE`
- **Route:** `/purchases/:id`
- **Auth Required:** Yes
- **Request Body:** None
- **Response Type:** Success message
- **Path Parameters:**
  - `id`: number (purchase ID)
- **Query Parameters:** None

#### 6. Get Purchase Receipt
- **HTTP Method:** `GET`
- **Route:** `/purchases/:id/receipt`
- **Auth Required:** Yes
- **Request Body:** None
- **Response Type:** Receipt data for purchase (PDF or JSON)
- **Path Parameters:**
  - `id`: number (purchase ID)
- **Query Parameters:** None

---

## Sales Module

**Base Path:** Dynamic  
**Auth Required:** Yes (JWT Bearer Token)  
**Tags:** `Sales`  
**Guards:** `JwtAuthGuard`

### Endpoints

#### 1. Create Offline Sale
- **HTTP Method:** `POST`
- **Route:** `/shops/:shopId/sales/offline`
- **Auth Required:** Yes
- **Request Body (DTO):** `CreateSaleDto`
  ```typescript
  {
    productId: number (required)
    customerId?: number (optional)
    customer?: CreateCustomerDto (optional, nested object)
    salePrice: number (required, min: 0)
    paymentMethod: PaymentMethod enum (required)
      - CASH | BANK | JAZZCASH | EASYPAISA | CARD
    saleType?: SaleType (optional) - will be set to OFFLINE
      - ONLINE | OFFLINE
    warrantyDays?: number (optional, min: 0)
    invoiceNumber?: string (optional)
    notes?: string (optional)
  }
  ```
- **Response Type:** Created Sale object
- **Path Parameters:**
  - `shopId`: number (shop ID)
- **Query Parameters:** None

#### 2. Create Online Sale
- **HTTP Method:** `POST`
- **Route:** `/shops/:shopId/sales/online`
- **Auth Required:** Yes
- **Request Body (DTO):** `CreateSaleDto` (same as above)
- **Response Type:** Created Sale object
- **Path Parameters:**
  - `shopId`: number (shop ID)
- **Query Parameters:** None

#### 3. List Sales
- **HTTP Method:** `GET`
- **Route:** `/shops/:shopId/sales`
- **Auth Required:** Yes
- **Request Body:** None
- **Response Type:** Paginated list of Sale objects
- **Path Parameters:**
  - `shopId`: number (shop ID)
- **Query Parameters (DTO):** `PaginationDto`
  ```typescript
  {
    page?: number
    limit?: number
    search?: string
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
  }
  ```

#### 4. Get Sale by ID
- **HTTP Method:** `GET`
- **Route:** `/sales/:id`
- **Auth Required:** Yes
- **Request Body:** None
- **Response Type:** Sale object with Product and Customer details
- **Path Parameters:**
  - `id`: number (sale ID)
- **Query Parameters:** None

#### 5. Update Sale
- **HTTP Method:** `PATCH`
- **Route:** `/sales/:id`
- **Auth Required:** Yes
- **Request Body (DTO):** `UpdateSaleDto` (partial CreateSaleDto)
  ```typescript
  {
    productId?: number
    customerId?: number
    customer?: CreateCustomerDto
    salePrice?: number
    paymentMethod?: PaymentMethod
    saleType?: SaleType
    warrantyDays?: number
    invoiceNumber?: string
    notes?: string
  }
  ```
- **Response Type:** Updated Sale object
- **Path Parameters:**
  - `id`: number (sale ID)
- **Query Parameters:** None

#### 6. Delete Sale
- **HTTP Method:** `DELETE`
- **Route:** `/sales/:id`
- **Auth Required:** Yes
- **Request Body:** None
- **Response Type:** Success message
- **Path Parameters:**
  - `id`: number (sale ID)
- **Query Parameters:** None

#### 7. Get Sale Invoice
- **HTTP Method:** `GET`
- **Route:** `/sales/:id/invoice`
- **Auth Required:** Yes
- **Request Body:** None
- **Response Type:** Invoice data for sale (PDF or JSON)
- **Path Parameters:**
  - `id`: number (sale ID)
- **Query Parameters:** None

---

## Inventory Module

**Base Path:** Dynamic  
**Auth Required:** Yes (JWT Bearer Token)  
**Tags:** `Inventory`  
**Guards:** `JwtAuthGuard`

### Endpoints

#### 1. Get Inventory List
- **HTTP Method:** `GET`
- **Route:** `/shops/:shopId/inventory`
- **Auth Required:** Yes
- **Request Body:** None
- **Response Type:** Paginated list of Product objects (inventory view)
- **Path Parameters:**
  - `shopId`: number (shop ID)
- **Query Parameters (DTO):** `ProductFilterDto`
  ```typescript
  {
    page?: number
    limit?: number
    search?: string
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
    brand?: string
    model?: string
    imei?: string
    status?: ProductStatus enum
    condition?: ProductCondition enum
    ptaStatus?: PtaStatus enum
    minPrice?: number
    maxPrice?: number
  }
  ```

#### 2. Get Inventory Summary
- **HTTP Method:** `GET`
- **Route:** `/shops/:shopId/inventory/summary`
- **Auth Required:** Yes
- **Request Body:** None
- **Response Type:** Inventory summary object (counts, totals, etc.)
- **Path Parameters:**
  - `shopId`: number (shop ID)
- **Query Parameters:** None

#### 3. Update Product Status (from Inventory)
- **HTTP Method:** `PATCH`
- **Route:** `/inventory/products/:productId/status`
- **Auth Required:** Yes
- **Request Body (DTO):** `UpdateProductStatusDto`
  ```typescript
  {
    status: ProductStatus enum (required)
      - IN_STOCK | RESERVED | SOLD | RETURNED | DAMAGED | UNDER_REPAIR
  }
  ```
- **Response Type:** Updated Product object
- **Path Parameters:**
  - `productId`: number (product ID)
- **Query Parameters:** None

---

## Expenses Module

**Base Path:** Dynamic  
**Auth Required:** Yes (JWT Bearer Token)  
**Tags:** `Expenses`  
**Guards:** `JwtAuthGuard`

### Endpoints

#### 1. Create Expense
- **HTTP Method:** `POST`
- **Route:** `/shops/:shopId/expenses`
- **Auth Required:** Yes
- **Request Body (DTO):** `CreateExpenseDto`
  ```typescript
  {
    productId?: number (optional)
    title: string (required)
    amount: number (required, min: 0)
    type: string (required)
    description?: string (optional)
  }
  ```
- **Response Type:** Created Expense object
- **Path Parameters:**
  - `shopId`: number (shop ID)
- **Query Parameters:** None

#### 2. List Expenses
- **HTTP Method:** `GET`
- **Route:** `/shops/:shopId/expenses`
- **Auth Required:** Yes
- **Request Body:** None
- **Response Type:** Paginated list of Expense objects
- **Path Parameters:**
  - `shopId`: number (shop ID)
- **Query Parameters (DTO):** `ExpenseFilterDto`
  ```typescript
  {
    page?: number
    limit?: number
    search?: string
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
    productId?: number (optional)
    type?: string (optional)
    dateFrom?: ISO date string (optional)
    dateTo?: ISO date string (optional)
  }
  ```

#### 3. Get Expense by ID
- **HTTP Method:** `GET`
- **Route:** `/expenses/:id`
- **Auth Required:** Yes
- **Request Body:** None
- **Response Type:** Expense object with details
- **Path Parameters:**
  - `id`: number (expense ID)
- **Query Parameters:** None

#### 4. Update Expense
- **HTTP Method:** `PATCH`
- **Route:** `/expenses/:id`
- **Auth Required:** Yes
- **Request Body (DTO):** `UpdateExpenseDto` (partial CreateExpenseDto)
  ```typescript
  {
    productId?: number
    title?: string
    amount?: number
    type?: string
    description?: string
  }
  ```
- **Response Type:** Updated Expense object
- **Path Parameters:**
  - `id`: number (expense ID)
- **Query Parameters:** None

#### 5. Delete Expense
- **HTTP Method:** `DELETE`
- **Route:** `/expenses/:id`
- **Auth Required:** Yes
- **Request Body:** None
- **Response Type:** Success message
- **Path Parameters:**
  - `id`: number (expense ID)
- **Query Parameters:** None

---

## Reports Module

**Base Path:** `/shops/:shopId/reports`  
**Auth Required:** Yes (JWT Bearer Token)  
**Tags:** `Reports`  
**Guards:** `JwtAuthGuard`

### Endpoints

#### 1. Get Dashboard Report
- **HTTP Method:** `GET`
- **Route:** `/shops/:shopId/reports/dashboard`
- **Auth Required:** Yes
- **Request Body:** None
- **Response Type:** Dashboard summary object (KPIs, metrics, charts data)
- **Path Parameters:**
  - `shopId`: number (shop ID)
- **Query Parameters:** None

#### 2. Get Daily Sales Report
- **HTTP Method:** `GET`
- **Route:** `/shops/:shopId/reports/daily-sales`
- **Auth Required:** Yes
- **Request Body:** None
- **Response Type:** Daily sales data with breakdown
- **Path Parameters:**
  - `shopId`: number (shop ID)
- **Query Parameters:** None

#### 3. Get Monthly Sales Report
- **HTTP Method:** `GET`
- **Route:** `/shops/:shopId/reports/monthly-sales`
- **Auth Required:** Yes
- **Request Body:** None
- **Response Type:** Monthly sales data with trends
- **Path Parameters:**
  - `shopId`: number (shop ID)
- **Query Parameters:** None

#### 4. Get Profit/Loss Report
- **HTTP Method:** `GET`
- **Route:** `/shops/:shopId/reports/profit-loss`
- **Auth Required:** Yes
- **Request Body:** None
- **Response Type:** Profit and loss statement data
- **Path Parameters:**
  - `shopId`: number (shop ID)
- **Query Parameters:** None

#### 5. Get Stock Value Report
- **HTTP Method:** `GET`
- **Route:** `/shops/:shopId/reports/stock-value`
- **Auth Required:** Yes
- **Request Body:** None
- **Response Type:** Inventory value and composition data
- **Path Parameters:**
  - `shopId`: number (shop ID)
- **Query Parameters:** None

#### 6. Get Sold Products Report
- **HTTP Method:** `GET`
- **Route:** `/shops/:shopId/reports/sold-products`
- **Auth Required:** Yes
- **Request Body:** None
- **Response Type:** List of sold products with details
- **Path Parameters:**
  - `shopId`: number (shop ID)
- **Query Parameters:** None

#### 7. Get Seller Compliance Report
- **HTTP Method:** `GET`
- **Route:** `/shops/:shopId/reports/seller-compliance`
- **Auth Required:** Yes
- **Request Body:** None
- **Response Type:** Seller performance and compliance metrics
- **Path Parameters:**
  - `shopId`: number (shop ID)
- **Query Parameters:** None

#### 8. Get IMEI History Report
- **HTTP Method:** `GET`
- **Route:** `/shops/:shopId/reports/imei-history/:imei`
- **Auth Required:** Yes
- **Request Body:** None
- **Response Type:** Complete history of IMEI (device lifecycle)
- **Path Parameters:**
  - `shopId`: number (shop ID)
  - `imei`: string (IMEI number)
- **Query Parameters:** None

---

## Marketplace Module

**Base Path:** `/marketplace`  
**Auth Required:** No  
**Tags:** `Marketplace`

### Endpoints

#### 1. Get Marketplace Shops
- **HTTP Method:** `GET`
- **Route:** `/marketplace/shops`
- **Auth Required:** No
- **Request Body:** None
- **Response Type:** Paginated list of Shop objects
- **Query Parameters:** `PaginationDto` with optional filters
  ```typescript
  {
    page?: number
    limit?: number
    search?: string
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
    city?: string (optional, filter by city)
    area?: string (optional, filter by area)
  }
  ```

#### 2. Get Marketplace Shop by ID
- **HTTP Method:** `GET`
- **Route:** `/marketplace/shops/:shopId`
- **Auth Required:** No
- **Request Body:** None
- **Response Type:** Shop object with public details
- **Path Parameters:**
  - `shopId`: number (shop ID)
- **Query Parameters:** None

#### 3. Get Marketplace Products
- **HTTP Method:** `GET`
- **Route:** `/marketplace/products`
- **Auth Required:** No
- **Request Body:** None
- **Response Type:** Paginated list of Product objects
- **Query Parameters:** `ProductFilterDto` with optional filters
  ```typescript
  {
    page?: number
    limit?: number
    search?: string
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
    brand?: string
    model?: string
    imei?: string
    status?: ProductStatus enum
    condition?: ProductCondition enum
    ptaStatus?: PtaStatus enum
    minPrice?: number
    maxPrice?: number
    city?: string (optional)
    area?: string (optional)
    shopId?: number (optional)
  }
  ```

#### 4. Get Marketplace Product by ID
- **HTTP Method:** `GET`
- **Route:** `/marketplace/products/:id`
- **Auth Required:** No
- **Request Body:** None
- **Response Type:** Product object with public details and images
- **Path Parameters:**
  - `id`: number (product ID)
- **Query Parameters:** None

---

## Audit Logs Module

**Base Path:** `/audit-logs`  
**Auth Required:** Yes (JWT Bearer Token)  
**Tags:** `Audit Logs`  
**Guards:** `JwtAuthGuard`, `RolesGuard`  
**Roles Required:** ADMIN only

### Endpoints

#### 1. List Audit Logs
- **HTTP Method:** `GET`
- **Route:** `/audit-logs`
- **Auth Required:** Yes
- **Roles Required:** ADMIN
- **Request Body:** None
- **Response Type:** Paginated list of AuditLog objects
- **Query Parameters (DTO):** `PaginationDto`
  ```typescript
  {
    page?: number (default: 1)
    limit?: number (default: 20)
    search?: string
    sortBy?: string
    sortOrder?: 'asc' | 'desc' (default: 'desc')
  }
  ```

---

## Common DTOs

### PaginationDto
Used for all list endpoints with pagination support:
```typescript
{
  page?: number (optional, default: 1, min: 1)
  limit?: number (optional, default: 20, min: 1, max: 100)
  search?: string (optional)
  sortBy?: string (optional)
  sortOrder?: 'asc' | 'desc' (optional, default: 'desc')
}
```

### AuthUser Type
Used to represent authenticated user in responses:
```typescript
{
  id: number
  phone: string
  email?: string | null
  role: UserRole enum (ADMIN | SHOPKEEPER | CUSTOMER)
}
```

---

## Enums Reference

### UserRole
- `ADMIN`
- `SHOPKEEPER`
- `CUSTOMER`

### ProductStatus
- `IN_STOCK`
- `RESERVED`
- `SOLD`
- `RETURNED`
- `DAMAGED`
- `UNDER_REPAIR`

### SaleType
- `ONLINE`
- `OFFLINE`

### PaymentMethod
- `CASH`
- `BANK`
- `JAZZCASH`
- `EASYPAISA`
- `CARD`

### PtaStatus
- `APPROVED`
- `NOT_APPROVED`
- `PATCHED`
- `UNKNOWN`

### ProductCondition
- `LIKE_NEW`
- `EXCELLENT`
- `GOOD`
- `FAIR`
- `DAMAGED`

---

## Authentication

All protected endpoints require a JWT Bearer Token in the `Authorization` header:
```
Authorization: Bearer <jwt_token>
```

JWT tokens are obtained from:
- `POST /auth/register` - for new users
- `POST /auth/login` - for existing users

---

## Response Format

All responses follow a consistent format with:
- `data`: The actual response object or array
- `message`: Success or error message
- `statusCode`: HTTP status code
- `timestamp`: Response timestamp (optional)

Example success response:
```json
{
  "data": { /* response object */ },
  "message": "Operation successful",
  "statusCode": 200
}
```

Example error response:
```json
{
  "data": null,
  "message": "Error description",
  "statusCode": 400 | 401 | 403 | 404 | 500
}
```

---

## Error Codes

- `400` - Bad Request (validation errors)
- `401` - Unauthorized (missing or invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found (resource doesn't exist)
- `409` - Conflict (duplicate entry)
- `500` - Internal Server Error

---

**End of Documentation**
