export const saleResource = (sale: any) => {
  if (!sale) return sale;
  return {
    id: sale.id,
    shopId: sale.shopId,
    customerId: sale.customerId,
    invoiceNo: sale.invoiceNo || sale.invoiceNumber,
    saleDate: sale.saleDate,
    saleType: sale.saleType,
    subtotal: sale.subtotal,
    discountType: sale.discountType,
    discountAmount: sale.discountAmount,
    taxAmount: sale.taxAmount,
    totalAmount: sale.totalAmount ?? sale.salePrice,
    paidAmount: sale.paidAmount,
    dueAmount: sale.dueAmount,
    paymentStatus: sale.paymentStatus,
    paymentMethod: sale.paymentMethod,
    status: sale.status,
    notes: sale.notes,
    customer: sale.customer,
    items: sale.items,
    payments: sale.payments,
    createdAt: sale.createdAt,
    updatedAt: sale.updatedAt,
  };
};

export const saleCollection = (items: any[]) => items.map(saleResource);
