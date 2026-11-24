export interface DashboardSummary {
  completedOrders: number;
  revenue: number;
  grossProfit: number;
  cost: number;
  averageTicket: number;
}

export interface DashboardDailySales {
  date: string;
  salesCount: number;
  revenue: number;
  grossProfit: number;
  cost: number;
}

export interface DashboardProductSales {
  dishId: number;
  dishName: string;
  quantitySold: number;
  revenue: number;
  cost: number;
  grossProfit: number;
}

export interface DashboardCurrentStatus {
  availableTables: number;
  occupiedTables: number;
  activeOrders: number;
  lowStockIngredients: number;
}

export interface DashboardResponse {
  fromDate: string | null;
  toDate: string | null;
  summary: DashboardSummary;
  dailySales: DashboardDailySales[];
  topFiveDishes: DashboardProductSales[];
  productSales: DashboardProductSales[];
  currentStatus: DashboardCurrentStatus;
}

export interface TableResponse {
  id: number;
  tableNumber: number;
  capacity: number;
  status: string;
}

export interface CategoryResponse {
  id: number;
  name: string;
  isActive: boolean;
}

export interface DishResponse {
  id: number;
  categoryId: number;
  categoryName: string;
  name: string;
  description: string | null;
  price: number;
  isAvailable: boolean;
}

export interface OrderDetailResponse {
  id: number;
  dishId: number;
  dishName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface OrderResponse {
  id: number;
  tableId: number | null;
  tableNumber: number | null;
  waiterId: number;
  waiterUsername: string;
  orderedAt: string;
  closedAt: string | null;
  status: string;
  total: number;
  details: OrderDetailResponse[];
}

export interface SaleConfirmationResponse {
  id: number;
  orderId: number;
  soldAt: string;
  totalAmount: number;
}

export interface ProblemDetails {
  title?: string;
  detail?: string;
  status?: number;
}
