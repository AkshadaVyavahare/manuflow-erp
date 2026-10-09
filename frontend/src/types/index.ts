export interface Allocation {
  id: number;
  item: number;
  item_sku: string;
  item_name: string;
  quantity: string;
  status: 'RESERVED' | 'CONSUMED' | 'RELEASED';
}

export interface WorkOrder {
  id: number;
  wo_number: string;
  bom: number;
  quantity: string;
  status: 'DRAFT' | 'ALLOCATED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  created_at: string;
  allocations: Allocation[];
}

export interface AuthTokens {
  access: string;
  refresh: string;
}
