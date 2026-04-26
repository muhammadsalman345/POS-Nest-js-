# Postman Testing Guide

Use base URL `http://localhost:3000/api`. For protected APIs add header:

```http
Authorization: Bearer {{token}}
Content-Type: application/json
```

## 1. Register Shopkeeper
`POST /auth/register`

```json
{
  "name": "Hafeez Mobile Center Owner",
  "phone": "03331234567",
  "email": "owner@example.com",
  "password": "Shop@123",
  "role": "SHOPKEEPER"
}
```

Expected: JWT token and user profile without password.

## 2. Login Shopkeeper
`POST /auth/login`

```json
{
  "phone": "03331234567",
  "password": "Shop@123"
}
```

Save `token` as `{{token}}`.

## 3. Create Shop
`POST /shops`

```json
{
  "name": "Hafeez Mobile Center",
  "address": "Shop 12, Hafeez Center, Gulberg",
  "city": "Lahore",
  "area": "Gulberg",
  "phone": "04235700000",
  "description": "Trusted second-hand mobile shop in Lahore"
}
```

Save `id` as `{{shopId}}`.

## 4. Create Seller
`POST /shops/{{shopId}}/sellers`

```json
{
  "name": "Muhammad Usman",
  "fatherName": "Abdul Rehman",
  "cnic": "35202-1234567-1",
  "phone": "03011234567",
  "address": "Model Town, Lahore",
  "cnicFrontImage": "private/cnic/front-usman.jpg",
  "cnicBackImage": "private/cnic/back-usman.jpg"
}
```

Save `id` as `{{sellerId}}`.

## 5. Create Product
`POST /shops/{{shopId}}/products`

```json
{
  "sellerId": "{{sellerId}}",
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
  "ptaStatus": "APPROVED",
  "description": "Clean device with original display.",
  "purchaseDate": "2026-04-25T00:00:00.000Z"
}
```

## 6. Create Purchase With New Seller And Product
`POST /shops/{{shopId}}/purchases`

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

Save returned `product.id` as `{{productId}}` and `id` as `{{purchaseId}}`.

## 7. Get Inventory Summary
`GET /shops/{{shopId}}/inventory/summary`

Expected: counts by status plus purchase and expected sale values.

## 8. Create Customer
`POST /customers`

```json
{
  "name": "Bilal Khan",
  "phone": "03211234567",
  "cnic": "35202-7654321-2",
  "address": "Johar Town, Lahore"
}
```

Save `id` as `{{customerId}}`.

## 9. Create Offline Sale
`POST /shops/{{shopId}}/sales/offline`

```json
{
  "productId": "{{productId}}",
  "customerId": "{{customerId}}",
  "salePrice": 128000,
  "paymentMethod": "CASH",
  "warrantyDays": 7,
  "invoiceNumber": "INV-POSTMAN-001",
  "notes": "Sold from shop counter"
}
```

Save `id` as `{{saleId}}`.

## 10. Get Invoice
`GET /sales/{{saleId}}/invoice`

Expected: shop, customer, product, IMEI, price, payment, warranty, invoice number, sale date.

## 11. Add Expense
`POST /shops/{{shopId}}/expenses`

```json
{
  "productId": "{{productId}}",
  "title": "Tempered glass",
  "amount": 1000,
  "type": "ACCESSORY",
  "description": "Installed before sale"
}
```

## 12. Profit/Loss Report
`GET /shops/{{shopId}}/reports/profit-loss`

Expected profit formula: `salePrice - purchasePrice - productRelatedExpenses`.

## 13. Public Marketplace Products
`GET /marketplace/products?city=Lahore&brand=Apple&page=1&limit=10`

Expected: only `IN_STOCK` products and no seller CNIC/private images.

## 14. Login Admin
`POST /auth/login`

```json
{
  "phone": "03000000000",
  "password": "Admin@123"
}
```

Save admin token as `{{adminToken}}`.

## 15. Get All Users
`GET /users`

Use `Authorization: Bearer {{adminToken}}`.

Expected: paginated users without passwords.
