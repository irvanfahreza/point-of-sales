// Core domain models for POS frontend

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  errors: any;
}

export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  tokenType: string;
  expiresIn: number;
  username: string;
  fullName: string;
}

export interface Category {
  id: number;
  name: string;
  description: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Product {
  id: number;
  categoryId: number;
  categoryName: string;
  name: string;
  sku: string;
  description: string;
  unit: string;
  purchasePrice: number;
  sellingPrice: number;
  stock: number;
  lowStockThreshold: number;
  isActive: boolean;
  isLowStock: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Discount {
  id: number;
  name: string;
  type: 'PERSENTASE' | 'NOMINAL';
  value: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TransactionItem {
  id: number;
  productId: number;
  productName: string;
  productSku: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface Transaction {
  id: number;
  transactionNumber: string;
  customerName: string;
  cashierName: string;
  paymentMethod: 'TUNAI' | 'QRIS' | 'DEBIT' | 'KARTU_KREDIT';
  status: 'SELESAI' | 'VOID';
  subtotal: number;
  discountType: 'PERSENTASE' | 'NOMINAL' | null;
  discountValue: number;
  discountAmount: number;
  taxRate: number;
  taxAmount: number;
  grandTotal: number;
  amountPaid: number;
  changeAmount: number;
  voidReason: string;
  voidedAt: string;
  transactionDate: string;
  items: TransactionItem[];
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface StoreSetting {
  id: number;
  storeName: string;
  address: string;
  phone: string;
  logoPath: string;
  taxRate: number;
  lowStockThreshold: number;
  receiptFooter: string;
  updatedAt: string;
}

export interface DashboardData {
  totalRevenueToday: number;
  totalTransactionsToday: number;
  totalLowStockProducts: number;
  totalActiveProducts: number;
  topProductsToday: TopProduct[];
  revenueChart7Days: ChartData[];
  revenueChart30Days: ChartData[];
  lowStockProducts: Product[];
}

export interface TopProduct {
  productName: string;
  totalQuantity: number;
  totalRevenue: number;
}

export interface ChartData {
  date: string;
  revenue: number;
}
