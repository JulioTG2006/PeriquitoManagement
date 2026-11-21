export interface CategoryDto {
  id: number;
  name: string;
  isActive: boolean;
}

export interface AdminDishDto {
  id: number;
  categoryId: number;
  categoryName: string;
  name: string;
  description: string | null;
  price: number;
  cost: number;
  isAvailable: boolean;
}

export interface TableDto {
  id: number;
  tableNumber: number;
  capacity: number;
  status: string;
}

export interface AdminOrderDetailDto {
  id: number;
  dishId: number;
  dishName: string;
  quantity: number;
  unitPrice: number;
  unitCost: number;
  subtotal: number;
}

export interface AdminOrderDto {
  id: number;
  tableId: number | null;
  tableNumber: number | null;
  waiterId: number;
  waiterUsername: string;
  orderedAt: string;
  closedAt: string | null;
  status: string;
  total: number;
  totalCost: number;
  details: AdminOrderDetailDto[];
}

export interface SaleDto {
  id: number;
  orderId: number;
  soldAt: string;
  totalAmount: number;
  grossProfit: number;
  totalCost: number;
  tableNumber: number | null;
  waiterName: string;
  details: SaleDetailDto[];
}

export interface SaleDetailDto {
  dishId: number;
  dishName: string;
  quantity: number;
  unitPrice: number;
  unitCost: number;
  subtotal: number;
}

export interface IngredientDto {
  id: number;
  name: string;
  unitOfMeasure: string;
  currentStock: number;
  minimumStock: number;
  isActive: boolean;
  isLowStock: boolean;
}

export interface InventoryMovementDto {
  id: number;
  ingredientId: number;
  ingredientName: string;
  unitOfMeasure: string;
  movementType: "Entrada" | "Salida";
  quantity: number;
  occurredAt: string;
  reason: string | null;
  userId: number | null;
  responsibleUsername: string | null;
}

export interface InventoryMovementResultDto {
  movement: InventoryMovementDto;
  currentStock: number;
}

export interface UserDto {
  id: number;
  username: string;
  fullName: string;
  role: string;
  isActive: boolean;
  createdAt: string;
}

export interface SaleReportQuery {
  fromUtc?: string;
  toUtc?: string;
}

export interface InventoryMovementQuery extends SaleReportQuery {
  ingredientId?: number;
  movementType?: "Entrada" | "Salida";
}
