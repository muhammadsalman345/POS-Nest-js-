import { PrismaClient, RecordStatus } from '@prisma/client';

type PrismaCategoryClient = Pick<PrismaClient, 'category'>;

export const DEFAULT_PRODUCT_CATEGORIES = [
  {
    name: 'Mobile & Accessories',
    slug: 'mobile-accessories',
    children: [
      { name: 'Mobile Phones', slug: 'mobile-accessories-mobile-phones' },
      { name: 'Chargers & Cables', slug: 'mobile-accessories-chargers-cables' },
      {
        name: 'Cases & Protectors',
        slug: 'mobile-accessories-cases-protectors',
      },
      {
        name: 'Earbuds & Headsets',
        slug: 'mobile-accessories-earbuds-headsets',
      },
      { name: 'Power Banks', slug: 'mobile-accessories-power-banks' },
    ],
  },
  {
    name: 'Electronics',
    slug: 'electronics',
    children: [
      { name: 'Computers & Laptops', slug: 'electronics-computers-laptops' },
      { name: 'TV & Audio', slug: 'electronics-tv-audio' },
      { name: 'Cameras', slug: 'electronics-cameras' },
      { name: 'Gaming', slug: 'electronics-gaming' },
      { name: 'Components & Parts', slug: 'electronics-components-parts' },
    ],
  },
  {
    name: 'Grocery & General Store',
    slug: 'grocery-general-store',
    children: [
      { name: 'Staples', slug: 'grocery-general-store-staples' },
      { name: 'Snacks & Drinks', slug: 'grocery-general-store-snacks-drinks' },
      { name: 'Personal Care', slug: 'grocery-general-store-personal-care' },
      {
        name: 'Cleaning Supplies',
        slug: 'grocery-general-store-cleaning-supplies',
      },
    ],
  },
  {
    name: 'Fashion & Apparel',
    slug: 'fashion-apparel',
    children: [
      { name: 'Men Clothing', slug: 'fashion-apparel-men-clothing' },
      { name: 'Women Clothing', slug: 'fashion-apparel-women-clothing' },
      { name: 'Footwear', slug: 'fashion-apparel-footwear' },
      { name: 'Bags & Accessories', slug: 'fashion-apparel-bags-accessories' },
    ],
  },
  {
    name: 'Pharmacy & Health',
    slug: 'pharmacy-health',
    children: [
      { name: 'Medicines', slug: 'pharmacy-health-medicines' },
      { name: 'Medical Devices', slug: 'pharmacy-health-medical-devices' },
      {
        name: 'Vitamins & Supplements',
        slug: 'pharmacy-health-vitamins-supplements',
      },
      { name: 'Baby Care', slug: 'pharmacy-health-baby-care' },
    ],
  },
  {
    name: 'Restaurant & Food',
    slug: 'restaurant-food',
    children: [
      { name: 'Fast Food', slug: 'restaurant-food-fast-food' },
      { name: 'Bakery', slug: 'restaurant-food-bakery' },
      { name: 'Beverages', slug: 'restaurant-food-beverages' },
      { name: 'Ready Meals', slug: 'restaurant-food-ready-meals' },
    ],
  },
  {
    name: 'Home & Household',
    slug: 'home-household',
    children: [
      { name: 'Kitchen', slug: 'home-household-kitchen' },
      { name: 'Furniture', slug: 'home-household-furniture' },
      { name: 'Decor', slug: 'home-household-decor' },
      { name: 'Appliances', slug: 'home-household-appliances' },
    ],
  },
  {
    name: 'Beauty & Cosmetics',
    slug: 'beauty-cosmetics',
    children: [
      { name: 'Makeup', slug: 'beauty-cosmetics-makeup' },
      { name: 'Skincare', slug: 'beauty-cosmetics-skincare' },
      { name: 'Hair Care', slug: 'beauty-cosmetics-hair-care' },
      { name: 'Fragrance', slug: 'beauty-cosmetics-fragrance' },
    ],
  },
  {
    name: 'Hardware & Tools',
    slug: 'hardware-tools',
    children: [
      { name: 'Hand Tools', slug: 'hardware-tools-hand-tools' },
      { name: 'Power Tools', slug: 'hardware-tools-power-tools' },
      {
        name: 'Electrical Supplies',
        slug: 'hardware-tools-electrical-supplies',
      },
      { name: 'Paint & Plumbing', slug: 'hardware-tools-paint-plumbing' },
    ],
  },
  {
    name: 'Books & Stationery',
    slug: 'books-stationery',
    children: [
      { name: 'Books', slug: 'books-stationery-books' },
      { name: 'School Supplies', slug: 'books-stationery-school-supplies' },
      { name: 'Office Supplies', slug: 'books-stationery-office-supplies' },
      { name: 'Printing', slug: 'books-stationery-printing' },
    ],
  },
  {
    name: 'Automotive',
    slug: 'automotive',
    children: [
      { name: 'Car Parts', slug: 'automotive-car-parts' },
      { name: 'Bike Parts', slug: 'automotive-bike-parts' },
      { name: 'Oils & Fluids', slug: 'automotive-oils-fluids' },
      { name: 'Accessories', slug: 'automotive-accessories' },
    ],
  },
  {
    name: 'Services',
    slug: 'services',
    children: [
      { name: 'Repair Services', slug: 'services-repair-services' },
      { name: 'Installation', slug: 'services-installation' },
      { name: 'Consulting', slug: 'services-consulting' },
      { name: 'Maintenance', slug: 'services-maintenance' },
    ],
  },
  {
    name: 'Other',
    slug: 'other',
    children: [{ name: 'Other Products', slug: 'other-products' }],
  },
];

export async function ensureDefaultCategories(prisma: PrismaCategoryClient) {
  for (const category of DEFAULT_PRODUCT_CATEGORIES) {
    const parent = await prisma.category.upsert({
      where: { slug: category.slug },
      update: {
        name: category.name,
        shopId: null,
        parentId: null,
        status: RecordStatus.ACTIVE,
        deletedAt: null,
      },
      create: {
        name: category.name,
        slug: category.slug,
        status: RecordStatus.ACTIVE,
      },
    });

    for (const child of category.children) {
      await prisma.category.upsert({
        where: { slug: child.slug },
        update: {
          name: child.name,
          shopId: null,
          parentId: parent.id,
          status: RecordStatus.ACTIVE,
          deletedAt: null,
        },
        create: {
          name: child.name,
          slug: child.slug,
          parentId: parent.id,
          status: RecordStatus.ACTIVE,
        },
      });
    }
  }
}
