# API Routes

Base URL: `http://localhost:3000/api`

Swagger: `http://localhost:3000/api/docs`

## Auth
- `POST /auth/register`
- `POST /auth/login`
- `GET /auth/profile`
- `POST /auth/change-password`

## Users
- `GET /users`
- `GET /users/:id`
- `PATCH /users/:id`
- `DELETE /users/:id`
- `PATCH /users/:id/status`

## Shops
- `POST /shops`
- `GET /shops/my`
- `GET /shops`
- `GET /shops/:id`
- `PATCH /shops/:id`
- `DELETE /shops/:id`

## Sellers
- `POST /shops/:shopId/sellers`
- `GET /shops/:shopId/sellers`
- `GET /sellers/:id`
- `PATCH /sellers/:id`
- `DELETE /sellers/:id`
- `GET /sellers/:id/purchases`

## Customers
- `POST /customers`
- `GET /customers`
- `GET /customers/:id`
- `PATCH /customers/:id`
- `DELETE /customers/:id`

## Products
- `POST /shops/:shopId/products`
- `GET /shops/:shopId/products`
- `GET /products/:id`
- `PATCH /products/:id`
- `DELETE /products/:id`
- `POST /products/:id/images`
- `DELETE /products/:id/images/:imageId`
- `PATCH /products/:id/status`

## Purchases
- `POST /shops/:shopId/purchases`
- `GET /shops/:shopId/purchases`
- `GET /purchases/:id`
- `PATCH /purchases/:id`
- `DELETE /purchases/:id`
- `GET /purchases/:id/receipt`

## Inventory
- `GET /shops/:shopId/inventory`
- `GET /shops/:shopId/inventory/summary`
- `PATCH /inventory/products/:productId/status`

## Sales
- `POST /shops/:shopId/sales/offline`
- `POST /shops/:shopId/sales/online`
- `GET /shops/:shopId/sales`
- `GET /sales/:id`
- `PATCH /sales/:id`
- `DELETE /sales/:id`
- `GET /sales/:id/invoice`

## Expenses
- `POST /shops/:shopId/expenses`
- `GET /shops/:shopId/expenses`
- `GET /expenses/:id`
- `PATCH /expenses/:id`
- `DELETE /expenses/:id`

## Reports
- `GET /shops/:shopId/reports/dashboard`
- `GET /shops/:shopId/reports/daily-sales`
- `GET /shops/:shopId/reports/monthly-sales`
- `GET /shops/:shopId/reports/profit-loss`
- `GET /shops/:shopId/reports/stock-value`
- `GET /shops/:shopId/reports/sold-products`
- `GET /shops/:shopId/reports/seller-compliance`
- `GET /shops/:shopId/reports/imei-history/:imei`

## Marketplace
- `GET /marketplace/shops`
- `GET /marketplace/shops/:shopId`
- `GET /marketplace/products`
- `GET /marketplace/products/:id`

## Audit Logs
- `GET /audit-logs`
