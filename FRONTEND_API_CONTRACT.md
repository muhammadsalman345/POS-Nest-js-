# POS Backend API Contract For Frontend

Base URL:

```txt
http://localhost:3000/api
```

Protected APIs require:

```http
Authorization: Bearer <token>
Content-Type: application/json
```

Public APIs:

- `POST /auth/register`
- `POST /auth/login`
- `GET /marketplace/shops`
- `GET /marketplace/shops/:shopId`
- `GET /marketplace/products`
- `GET /marketplace/products/:id`

## Common Types

Enums:

```ts
type UserRole = "ADMIN" | "SHOPKEEPER" | "CUSTOMER";
type ProductStatus = "IN_STOCK" | "RESERVED" | "SOLD" | "RETURNED" | "DAMAGED" | "UNDER_REPAIR";
type SaleType = "ONLINE" | "OFFLINE";
type PaymentMethod = "CASH" | "BANK" | "JAZZCASH" | "EASYPAISA" | "CARD";
type PtaStatus = "APPROVED" | "NOT_APPROVED" | "PATCHED" | "UNKNOWN";
type ProductCondition = "LIKE_NEW" | "EXCELLENT" | "GOOD" | "FAIR" | "DAMAGED";
type SortOrder = "asc" | "desc";
```

Pagination query for list APIs:

```json
{
  "page": 1,
  "limit": 20,
  "search": "optional search text",
  "sortBy": "createdAt",
  "sortOrder": "desc"
}
```

Paginated response shape:

```json
{
  "items": [],
  "meta": {
    "total": 0,
    "page": 1,
    "limit": 20,
    "totalPages": 0
  }
}
```

Error response shape:

```json
{
  "success": false,
  "statusCode": 400,
  "path": "/api/example",
  "timestamp": "2026-04-25T12:00:00.000Z",
  "error": "Error message or validation object"
}
```

## Entity Response Shapes

User:

```json
{
  "id": 1,
  "name": "Hafeez Mobile Center Owner",
  "email": "owner@example.com",
  "phone": "03331234567",
  "role": "SHOPKEEPER",
  "isActive": true,
  "createdAt": "2026-04-25T12:00:00.000Z",
  "updatedAt": "2026-04-25T12:00:00.000Z",
  "deletedAt": null
}
```

Shop:

```json
{
  "id": 1,
  "ownerId": 1,
  "name": "Hafeez Mobile Center",
  "address": "Shop 12, Hafeez Center, Gulberg",
  "city": "Lahore",
  "area": "Gulberg",
  "phone": "04235700000",
  "logo": null,
  "description": "Trusted second-hand mobile shop in Lahore",
  "isActive": true,
  "createdAt": "2026-04-25T12:00:00.000Z",
  "updatedAt": "2026-04-25T12:00:00.000Z",
  "deletedAt": null
}
```

Seller:

```json
{
  "id": 1,
  "shopId": 1,
  "name": "Muhammad Usman",
  "fatherName": "Abdul Rehman",
  "cnic": "35202-1234567-1",
  "phone": "03011234567",
  "address": "Model Town, Lahore",
  "cnicFrontImage": "private/cnic/front-usman.jpg",
  "cnicBackImage": "private/cnic/back-usman.jpg",
  "photo": null,
  "createdAt": "2026-04-25T12:00:00.000Z",
  "updatedAt": "2026-04-25T12:00:00.000Z",
  "deletedAt": null
}
```

Customer:

```json
{
  "id": 1,
  "userId": null,
  "name": "Bilal Khan",
  "phone": "03211234567",
  "cnic": "35202-7654321-2",
  "address": "Johar Town, Lahore",
  "createdAt": "2026-04-25T12:00:00.000Z",
  "updatedAt": "2026-04-25T12:00:00.000Z",
  "deletedAt": null
}
```

Product:

```json
{
  "id": 1,
  "shopId": 1,
  "sellerId": 1,
  "brand": "Apple",
  "model": "iPhone 13 Pro",
  "variant": "Pro",
  "imei1": "356789123456789",
  "imei2": "356789123456780",
  "storage": "256GB",
  "ram": "6GB",
  "color": "Graphite",
  "condition": "EXCELLENT",
  "batteryHealth": 91,
  "accessories": "Box, cable",
  "purchasePrice": "165000",
  "expectedSalePrice": "185000",
  "finalSalePrice": null,
  "status": "IN_STOCK",
  "ptaStatus": "APPROVED",
  "description": "Clean device with original display.",
  "purchaseDate": "2026-04-25T00:00:00.000Z",
  "createdAt": "2026-04-25T12:00:00.000Z",
  "updatedAt": "2026-04-25T12:00:00.000Z",
  "deletedAt": null,
  "images": [],
  "seller": {}
}
```

Product image:

```json
{
  "id": 1,
  "productId": 1,
  "imageUrl": "private/products/iphone.jpg",
  "isPrimary": true,
  "createdAt": "2026-04-25T12:00:00.000Z",
  "deletedAt": null
}
```

Purchase:

```json
{
  "id": 1,
  "shopId": 1,
  "sellerId": 1,
  "productId": 1,
  "purchasePrice": "112000",
  "purchaseDate": "2026-04-25T00:00:00.000Z",
  "notes": "Bought with charger",
  "receiptNumber": "PUR-POSTMAN-001",
  "createdAt": "2026-04-25T12:00:00.000Z",
  "updatedAt": "2026-04-25T12:00:00.000Z",
  "deletedAt": null,
  "seller": {},
  "product": {},
  "shop": {}
}
```

Sale:

```json
{
  "id": 1,
  "shopId": 1,
  "productId": 1,
  "customerId": 1,
  "salePrice": "128000",
  "paymentMethod": "CASH",
  "saleType": "OFFLINE",
  "warrantyDays": 7,
  "invoiceNumber": "INV-POSTMAN-001",
  "notes": "Sold from shop counter",
  "createdAt": "2026-04-25T12:00:00.000Z",
  "updatedAt": "2026-04-25T12:00:00.000Z",
  "deletedAt": null,
  "shop": {},
  "customer": {},
  "product": {}
}
```

Expense:

```json
{
  "id": 1,
  "shopId": 1,
  "productId": 1,
  "title": "Tempered glass",
  "amount": "1000",
  "type": "ACCESSORY",
  "description": "Installed before sale",
  "createdAt": "2026-04-25T12:00:00.000Z",
  "updatedAt": "2026-04-25T12:00:00.000Z",
  "deletedAt": null
}
```

Note: Prisma decimal values may come as strings in JSON. Frontend should convert price/amount fields with `Number(value)` when needed.

## Auth APIs

### Register

`POST /auth/register`

Request:

```json
{
  "name": "Hafeez Mobile Center Owner",
  "phone": "03331234567",
  "email": "owner@example.com",
  "password": "Shop@123",
  "confirmPassword": "Shop@123",
  "role": "SHOPKEEPER"
}
```

Response:

```json
{
  "token": "jwt-token",
  "user": {
    "id": 1,
    "name": "Hafeez Mobile Center Owner",
    "email": "owner@example.com",
    "phone": "03331234567",
    "role": "SHOPKEEPER",
    "isActive": true,
    "createdAt": "2026-04-25T12:00:00.000Z",
    "updatedAt": "2026-04-25T12:00:00.000Z",
    "deletedAt": null
  }
}
```

Rules:

- Public admin registration is blocked.
- `role` can be `SHOPKEEPER` or `CUSTOMER`.
- `password` minimum length is 6.
- `confirmPassword` is optional, but if sent it must match `password`.

### Login

`POST /auth/login`

Request with phone:

```json
{
  "phone": "03331234567",
  "password": "Shop@123"
}
```

Request with email:

```json
{
  "email": "owner@example.com",
  "password": "Shop@123"
}
```

Response:

```json
{
  "token": "jwt-token",
  "user": {
    "id": 1,
    "name": "Hafeez Mobile Center Owner",
    "email": "owner@example.com",
    "phone": "03331234567",
    "role": "SHOPKEEPER",
    "isActive": true,
    "createdAt": "2026-04-25T12:00:00.000Z",
    "updatedAt": "2026-04-25T12:00:00.000Z",
    "deletedAt": null
  }
}
```

### Profile

`GET /auth/profile`

Auth required.

Response: `User`

### Change Password

`POST /auth/change-password`

Auth required.

Request:

```json
{
  "currentPassword": "Shop@123",
  "newPassword": "Shop@456"
}
```

Response:

```json
{
  "message": "Password changed successfully"
}
```

## Users APIs

All users APIs require auth. `GET /users`, `DELETE /users/:id`, and `PATCH /users/:id/status` require admin.

### List Users

`GET /users?page=1&limit=20&search=hafeez&sortBy=createdAt&sortOrder=desc`

Response: paginated `User[]`

### Get User

`GET /users/:id`

Response: `User`

### Update User

`PATCH /users/:id`

Request:

```json
{
  "name": "Updated Name",
  "email": "updated@example.com",
  "phone": "03330000000"
}
```

Response: `User`

### Delete User

`DELETE /users/:id`

Response:

```json
{
  "message": "User deleted"
}
```

### Update User Status

`PATCH /users/:id/status`

Request:

```json
{
  "isActive": false
}
```

Response: `User`

## Shops APIs

All shops APIs require auth.

### Create Shop

`POST /shops`

Roles: `SHOPKEEPER`, `ADMIN`

Request:

```json
{
  "name": "Hafeez Mobile Center",
  "address": "Shop 12, Hafeez Center, Gulberg",
  "city": "Lahore",
  "area": "Gulberg",
  "phone": "04235700000",
  "logo": "private/logos/shop.png",
  "description": "Trusted second-hand mobile shop in Lahore"
}
```

Response: `Shop`

### My Shops

`GET /shops/my?page=1&limit=20`

Role: `SHOPKEEPER`

Response: paginated `Shop[]`

### List Shops

`GET /shops?page=1&limit=20&search=lahore`

Response: paginated `Shop[]`

### Get Shop

`GET /shops/:id`

Response: `Shop`

### Update Shop

`PATCH /shops/:id`

Request: same fields as create shop, all optional.

```json
{
  "name": "Updated Shop Name",
  "city": "Lahore",
  "area": "Gulberg"
}
```

Response: `Shop`

### Delete Shop

`DELETE /shops/:id`

Response:

```json
{
  "message": "Shop deleted"
}
```

## Sellers APIs

All sellers APIs require auth.

### Create Seller

`POST /shops/:shopId/sellers`

Request:

```json
{
  "name": "Muhammad Usman",
  "fatherName": "Abdul Rehman",
  "cnic": "35202-1234567-1",
  "phone": "03011234567",
  "address": "Model Town, Lahore",
  "cnicFrontImage": "private/cnic/front-usman.jpg",
  "cnicBackImage": "private/cnic/back-usman.jpg",
  "photo": "private/sellers/usman.jpg"
}
```

Response: `Seller`

### List Sellers

`GET /shops/:shopId/sellers?page=1&limit=20&search=usman`

Response: paginated `Seller[]`

### Get Seller

`GET /sellers/:id`

Response: `Seller`

### Update Seller

`PATCH /sellers/:id`

Request: same fields as create seller, all optional.

```json
{
  "phone": "03019876543",
  "address": "Updated address"
}
```

Response: `Seller`

### Delete Seller

`DELETE /sellers/:id`

Response:

```json
{
  "message": "Seller deleted"
}
```

### Seller Purchases

`GET /sellers/:id/purchases`

Response: `Purchase[]` with product included.

## Customers APIs

All customers APIs require auth.

### Create Customer

`POST /customers`

Request:

```json
{
  "userId": 10,
  "name": "Bilal Khan",
  "phone": "03211234567",
  "cnic": "35202-7654321-2",
  "address": "Johar Town, Lahore"
}
```

Response: `Customer`

Note: `userId` is optional. If logged-in user role is `CUSTOMER`, backend can link customer to current user.

### List Customers

`GET /customers?page=1&limit=20&search=bilal`

Response: paginated `Customer[]`

### Get Customer

`GET /customers/:id`

Response: `Customer`

### Update Customer

`PATCH /customers/:id`

Request: same fields as create customer, all optional.

```json
{
  "phone": "03210000000",
  "address": "Updated address"
}
```

Response: `Customer`

### Delete Customer

`DELETE /customers/:id`

Response:

```json
{
  "message": "Customer deleted"
}
```

## Products APIs

All products APIs require auth.

### Create Product

`POST /shops/:shopId/products`

Request:

```json
{
  "sellerId": 1,
  "brand": "Apple",
  "model": "iPhone 13 Pro",
  "variant": "Pro",
  "imei1": "356789123456789",
  "imei2": "356789123456780",
  "storage": "256GB",
  "ram": "6GB",
  "color": "Graphite",
  "condition": "EXCELLENT",
  "batteryHealth": 91,
  "accessories": "Box, cable",
  "purchasePrice": 165000,
  "expectedSalePrice": 185000,
  "status": "IN_STOCK",
  "ptaStatus": "APPROVED",
  "description": "Clean device with original display.",
  "purchaseDate": "2026-04-25T00:00:00.000Z"
}
```

Response: `Product` with `images` and `seller`.

### List Products

`GET /shops/:shopId/products?page=1&limit=20&brand=Apple&model=iPhone&imei=356&status=IN_STOCK&condition=EXCELLENT&ptaStatus=APPROVED&minPrice=100000&maxPrice=200000&search=iPhone`

Response: paginated `Product[]` with `images` and `shop`.

### Get Product

`GET /products/:id`

Response: `Product` with `images`, `seller`, and `shop`.

### Update Product

`PATCH /products/:id`

Request: same fields as create product, all optional.

```json
{
  "expectedSalePrice": 180000,
  "status": "RESERVED",
  "description": "Updated description"
}
```

Response: `Product`

### Delete Product

`DELETE /products/:id`

Response:

```json
{
  "message": "Product deleted"
}
```

### Add Product Image

`POST /products/:id/images`

Request:

```json
{
  "imageUrl": "private/products/iphone-13-pro-front.jpg",
  "isPrimary": true
}
```

Response: `ProductImage`

### Delete Product Image

`DELETE /products/:id/images/:imageId`

Response:

```json
{
  "message": "Image deleted"
}
```

### Update Product Status

`PATCH /products/:id/status`

Request:

```json
{
  "status": "SOLD"
}
```

Response: `Product`

## Purchases APIs

All purchases APIs require auth.

### Create Purchase With Existing Seller

`POST /shops/:shopId/purchases`

Request:

```json
{
  "sellerId": 1,
  "product": {
    "sellerId": 1,
    "brand": "Samsung",
    "model": "Galaxy S22",
    "imei1": "351111123456789",
    "storage": "128GB",
    "ram": "8GB",
    "color": "Black",
    "condition": "GOOD",
    "batteryHealth": 88,
    "purchasePrice": 112000,
    "expectedSalePrice": 128000,
    "ptaStatus": "APPROVED",
    "purchaseDate": "2026-04-25T00:00:00.000Z"
  },
  "purchase": {
    "purchasePrice": 112000,
    "purchaseDate": "2026-04-25T00:00:00.000Z",
    "notes": "Bought with charger",
    "receiptNumber": "PUR-POSTMAN-001"
  }
}
```

### Create Purchase With New Seller

`POST /shops/:shopId/purchases`

Request:

```json
{
  "seller": {
    "name": "Adeel Ahmed",
    "fatherName": "Sajjad Ahmed",
    "cnic": "35202-2234567-1",
    "phone": "03019876543",
    "address": "Ichra, Lahore"
  },
  "product": {
    "sellerId": 0,
    "brand": "Samsung",
    "model": "Galaxy S22",
    "imei1": "351111123456789",
    "storage": "128GB",
    "ram": "8GB",
    "color": "Black",
    "condition": "GOOD",
    "batteryHealth": 88,
    "purchasePrice": 112000,
    "expectedSalePrice": 128000,
    "ptaStatus": "APPROVED",
    "purchaseDate": "2026-04-25T00:00:00.000Z"
  },
  "purchase": {
    "purchasePrice": 112000,
    "purchaseDate": "2026-04-25T00:00:00.000Z",
    "notes": "Bought with charger",
    "receiptNumber": "PUR-POSTMAN-001"
  }
}
```

Response: `Purchase` with `seller`, `product`, and `shop`.

### List Purchases

`GET /shops/:shopId/purchases?page=1&limit=20`

Response: paginated `Purchase[]` with `seller` and `product`.

### Get Purchase

`GET /purchases/:id`

Response: `Purchase` with `shop`, `seller`, and `product`.

### Update Purchase

`PATCH /purchases/:id`

Request:

```json
{
  "purchasePrice": 110000,
  "purchaseDate": "2026-04-25T00:00:00.000Z",
  "notes": "Updated note",
  "receiptNumber": "PUR-UPDATED-001"
}
```

Response: `Purchase`

### Delete Purchase

`DELETE /purchases/:id`

Response:

```json
{
  "message": "Purchase deleted"
}
```

### Purchase Receipt

`GET /purchases/:id/receipt`

Response: same as get purchase.

## Inventory APIs

All inventory APIs require auth.

### Inventory List

`GET /shops/:shopId/inventory?page=1&limit=20&status=IN_STOCK&brand=Apple`

Response: same as product list.

### Inventory Summary

`GET /shops/:shopId/inventory/summary`

Response:

```json
{
  "totalProducts": 10,
  "inStock": 6,
  "sold": 2,
  "reserved": 1,
  "damaged": 1,
  "returned": 0,
  "totalPurchaseValue": "1000000",
  "totalExpectedSaleValue": "1250000"
}
```

### Inventory Product Status

`PATCH /inventory/products/:productId/status`

Request:

```json
{
  "status": "RESERVED"
}
```

Response: `Product`

## Sales APIs

All sales APIs require auth.

### Create Offline Sale

`POST /shops/:shopId/sales/offline`

Request:

```json
{
  "productId": 1,
  "customerId": 1,
  "salePrice": 128000,
  "paymentMethod": "CASH",
  "warrantyDays": 7,
  "invoiceNumber": "INV-POSTMAN-001",
  "notes": "Sold from shop counter"
}
```

Response: `Sale` with `shop`, `customer`, and `product`.

### Create Online Sale

`POST /shops/:shopId/sales/online`

Request with existing customer:

```json
{
  "productId": 1,
  "customerId": 1,
  "salePrice": 128000,
  "paymentMethod": "BANK",
  "warrantyDays": 7,
  "invoiceNumber": "INV-ONLINE-001",
  "notes": "Online order"
}
```

Request with new customer:

```json
{
  "productId": 1,
  "customer": {
    "name": "Ali Khan",
    "phone": "03000000000",
    "cnic": "35202-0000000-0",
    "address": "Lahore"
  },
  "salePrice": 128000,
  "paymentMethod": "JAZZCASH",
  "warrantyDays": 7
}
```

Response: `Sale` with `shop`, `customer`, and `product`.

### List Sales

`GET /shops/:shopId/sales?page=1&limit=20`

Response: paginated `Sale[]` with `customer` and `product`.

### Get Sale

`GET /sales/:id`

Response: `Sale` with `shop`, `customer`, and `product`.

### Update Sale

`PATCH /sales/:id`

Request:

```json
{
  "salePrice": 130000,
  "paymentMethod": "CASH",
  "warrantyDays": 10,
  "notes": "Updated sale note"
}
```

Response: `Sale`

### Delete Sale

`DELETE /sales/:id`

Response:

```json
{
  "message": "Sale deleted"
}
```

### Sale Invoice

`GET /sales/:id/invoice`

Response: same as get sale.

## Expenses APIs

All expenses APIs require auth.

### Create Expense

`POST /shops/:shopId/expenses`

Request:

```json
{
  "productId": 1,
  "title": "Tempered glass",
  "amount": 1000,
  "type": "ACCESSORY",
  "description": "Installed before sale"
}
```

Response: `Expense`

### List Expenses

`GET /shops/:shopId/expenses?page=1&limit=20&productId=1&type=ACCESSORY&dateFrom=2026-04-01T00:00:00.000Z&dateTo=2026-04-30T23:59:59.000Z`

Response: paginated `Expense[]`

### Get Expense

`GET /expenses/:id`

Response: `Expense` with `product` and `shop`.

### Update Expense

`PATCH /expenses/:id`

Request:

```json
{
  "title": "Updated expense",
  "amount": 1200,
  "type": "REPAIR",
  "description": "Updated description"
}
```

Response: `Expense`

### Delete Expense

`DELETE /expenses/:id`

Response:

```json
{
  "message": "Expense deleted"
}
```

## Reports APIs

All reports APIs require auth.

### Dashboard

`GET /shops/:shopId/reports/dashboard`

Response:

```json
{
  "todaySales": "128000",
  "monthlySales": "500000",
  "totalProfit": 45000,
  "totalExpenses": "12000",
  "stockValue": "800000",
  "totalProducts": 20,
  "lowStock": 3,
  "recentSales": [],
  "recentPurchases": []
}
```

### Daily Sales

`GET /shops/:shopId/reports/daily-sales`

Response: `Sale[]` with `product` and `customer`.

### Monthly Sales

`GET /shops/:shopId/reports/monthly-sales`

Response: `Sale[]` with `product` and `customer`.

### Profit Loss

`GET /shops/:shopId/reports/profit-loss`

Response:

```json
{
  "rows": [
    {
      "saleId": 1,
      "productId": 1,
      "salePrice": "128000",
      "purchasePrice": "112000",
      "expenses": 1000,
      "profit": 15000
    }
  ],
  "grossSales": 128000,
  "netProfit": 15000
}
```

### Stock Value

`GET /shops/:shopId/reports/stock-value`

Response:

```json
{
  "_count": 6,
  "_sum": {
    "purchasePrice": "800000",
    "expectedSalePrice": "950000"
  }
}
```

### Sold Products

`GET /shops/:shopId/reports/sold-products`

Response: `Product[]` with `sales`.

### Seller Compliance

`GET /shops/:shopId/reports/seller-compliance`

Response: `Seller[]` with `purchases`.

### IMEI History

`GET /shops/:shopId/reports/imei-history/:imei`

Response: `Product[]` with `purchase`, `sales`, `seller`, and `expenses`.

## Marketplace APIs

Marketplace APIs are public and do not require token.

### Public Shops

`GET /marketplace/shops?page=1&limit=20&city=Lahore&area=Gulberg`

Response:

```json
{
  "items": [
    {
      "id": 1,
      "name": "Hafeez Mobile Center",
      "address": "Shop 12, Hafeez Center, Gulberg",
      "city": "Lahore",
      "area": "Gulberg",
      "phone": "04235700000",
      "logo": null,
      "description": "Trusted second-hand mobile shop in Lahore"
    }
  ],
  "meta": {
    "total": 1,
    "page": 1,
    "limit": 20,
    "totalPages": 1
  }
}
```

### Public Shop Detail

`GET /marketplace/shops/:shopId`

Response:

```json
{
  "id": 1,
  "name": "Hafeez Mobile Center",
  "address": "Shop 12, Hafeez Center, Gulberg",
  "city": "Lahore",
  "area": "Gulberg",
  "phone": "04235700000",
  "logo": null,
  "description": "Trusted second-hand mobile shop in Lahore"
}
```

### Public Products

`GET /marketplace/products?page=1&limit=20&city=Lahore&area=Gulberg&shopId=1&brand=Apple&model=iPhone&status=IN_STOCK&condition=EXCELLENT&ptaStatus=APPROVED&minPrice=100000&maxPrice=200000&search=iPhone`

Response: paginated `Product[]` with `images` and `shop`. Only `IN_STOCK` products are returned.

### Public Product Detail

`GET /marketplace/products/:id`

Response: `Product` with `images` and public `shop` fields.

## Audit Logs APIs

Audit logs require admin.

### List Audit Logs

`GET /audit-logs?page=1&limit=20&search=CREATE&sortBy=createdAt&sortOrder=desc`

Response:

```json
{
  "items": [
    {
      "id": 1,
      "userId": 1,
      "action": "CREATE",
      "module": "SHOP",
      "recordId": "1",
      "oldData": null,
      "newData": "{\"id\":1,\"name\":\"Hafeez Mobile Center\"}",
      "createdAt": "2026-04-25T12:00:00.000Z",
      "user": {
        "id": 1,
        "name": "Hafeez Mobile Center Owner",
        "phone": "03331234567",
        "role": "SHOPKEEPER"
      }
    }
  ],
  "meta": {
    "total": 1,
    "page": 1,
    "limit": 20,
    "totalPages": 1
  }
}
```

Frontend can parse `oldData` and `newData` with `JSON.parse` when they are not null.

## Frontend Flow

Recommended shopkeeper flow:

1. `POST /auth/register`
2. Save `token`
3. `POST /shops`
4. `POST /shops/:shopId/sellers`
5. `POST /shops/:shopId/products` or `POST /shops/:shopId/purchases`
6. `GET /shops/:shopId/inventory/summary`
7. `POST /customers`
8. `POST /shops/:shopId/sales/offline` or `POST /shops/:shopId/sales/online`
9. `GET /shops/:shopId/reports/dashboard`

Recommended marketplace customer flow:

1. `GET /marketplace/shops`
2. `GET /marketplace/products`
3. `GET /marketplace/products/:id`

