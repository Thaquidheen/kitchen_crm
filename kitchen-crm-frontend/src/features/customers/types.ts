/**
 * Customers feature types
 */

import type { PaginatedResponse } from '../../types/common.types';

// Customer Status as per backend enum
export type CustomerStatus =
  | 'LEAD'
  | 'POTENTIAL'
  | 'PLANNING'
  | 'CONFIRMED';

export type LeadSourceType = 'NONE' | 'ARCHITECT' | 'MANUAL';

export interface Customer {
  id: number;
  name: string;
  email?: string;
  contact?: string;
  address?: string;
  kitchenTypes?: string;
  status: CustomerStatus;
  // Lead tracking fields
  architectId?: number;
  architectName?: string;
  leadSourceType?: LeadSourceType;
  manualLeadName?: string;
  manualLeadContact?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CustomerCreate {
  name: string;
  email?: string;
  contact?: string;
  address?: string;
  kitchenTypes?: string;
  // Lead tracking fields
  architectId?: number;
  manualLeadName?: string;
  manualLeadContact?: string;
}

export type CustomerUpdate = Partial<Omit<Customer, 'id'>> & { id: number };

export interface CustomerListParams {
  page?: number;
  size?: number;
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
  name?: string;
  email?: string;
  status?: CustomerStatus;
}

export interface CustomerStatistics {
  total: number;
  lead?: number;
  potential?: number;
  planning?: number;
  confirmed?: number;
  [key: string]: number | undefined;
}

// Pipeline
export interface PipelineStage {
  stage: string; // e.g., "CONTACTED", "QUALIFIED", etc.
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
  notes?: string;
  updatedAt?: string;
}

export interface PipelineDto {
  customerId: number;
  stages: PipelineStage[];
  currentStage?: string;
  updatedBy?: string;
  updatedAt?: string;
}

// Workflow History
export interface WorkflowHistoryDto {
  id: number;
  customerId: number;
  previousState: string;
  newState: string;
  changedBy: string;
  changeReason?: string;
  timestamp: string;
}

export type CustomersPage = PaginatedResponse<Customer>;

// Customer Requirements
export interface CustomerRequirements {
  id?: number;
  customerId: number;
  
  // 1. Cabinet Type (2 fields)
  cabinetWpc?: boolean;
  cabinetSs?: boolean;
  
  // 2. Door Material (2 fields)
  doorWpc?: boolean;
  doorSs?: boolean;
  
  // 3. Finish Options (5 fields)
  finishGlax?: boolean;
  finishCeramic?: boolean;
  finishGlass?: boolean;
  finishPu?: boolean;
  finishLaminate?: boolean;
  
  // 4. Layout Options (7 fields)
  layoutLShape?: boolean;
  layoutUShape?: boolean;
  layoutCShape?: boolean;
  layoutGShape?: boolean;
  layoutIsland?: boolean;
  layoutLinear?: boolean;
  layoutParallel?: boolean;
  
  // 5. Design Features (4 fields)
  designIsland?: boolean;
  designBreakfast?: boolean;
  designBarUnit?: boolean;
  designPantryUnit?: boolean;
  
  // 6. Cabinets and Storage (4 fields)
  cabinetTallUnits?: boolean;
  cabinetBaseUnits?: boolean;
  cabinetWallUnits?: boolean;
  cabinetLoftUnits?: boolean;
  
  // 7. Base Units (4 fields)
  baseDrawers?: boolean;
  baseHingeDoors?: boolean;
  basePullouts?: boolean;
  baseWickerBasket?: boolean;
  
  // 8. Wall Unit Options (6 fields)
  wallUnitImove?: boolean;
  wallHingeDoors?: boolean;
  wallBifoldLiftup?: boolean;
  wallBifoldMotorised?: boolean;
  wallFlapup?: boolean;
  wallRollingShutter?: boolean;
  
  // 9. Tall Unit Options (4 fields)
  tallUnitPantryPullout?: boolean;
  lavidoPullout?: boolean;
  tallUnitSsShelves?: boolean;
  tallUnitGlassShelf?: boolean;
  
  // 10. Handles (6 fields)
  handleG?: boolean;
  handleJ?: boolean;
  handleGola?: boolean;
  handleLipProfile?: boolean;
  handleExposeHandless?: boolean;
  inbuiltHandles?: boolean;
  
  // 11. Handle Colors (4 fields)
  handleColorRoseGold?: boolean;
  handleColorSilver?: boolean;
  handleColorGold?: boolean;
  handleColorBlack?: boolean;
  
  // 12. Lighting (1 field)
  profileLights?: boolean;
  
  // 13. Ovens (2 fields)
  ovenBuiltIn?: boolean;
  ovenFreeStanding?: boolean;
  
  // 14. Refrigerators (2 fields)
  refrigeratorBuiltIn?: boolean;
  refrigeratorFreeStanding?: boolean;
  
  // 15. Dishwashers (2 fields)
  dishwasherBuiltIn?: boolean;
  dishwasherFreeStanding?: boolean;
  
  // 16. Coffee Makers (2 fields)
  coffeeMakerBuiltIn?: boolean;
  coffeeMakerFreeStanding?: boolean;
  
  // 17. Cook Tops (3 fields)
  cookTop90?: boolean;
  cookTop60?: boolean;
  cookTop120?: boolean;
  
  // 18. Sinks and Faucets (4 fields)
  sinkDoubleBowl?: boolean;
  sinkSingleBowl?: boolean;
  sinkDoubleWithDrain?: boolean;
  sinkMultifunction?: boolean;
  
  // 19. Sinks and Faucets Base Unit (6 fields)
  sinkBaseDrawers?: boolean;
  sinkBaseDoors?: boolean;
  sinkBaseWasteBin?: boolean;
  sinkBaseDetergentHolder?: boolean;
  sinkBaseDetergentPullouts?: boolean;
  sinkBaseWastebinPullout?: boolean;
  
  // 20. Corner Solutions (3 fields)
  cornerSolutionLemans?: boolean;
  cornerSolutionMagicCorner?: boolean;
  cornerSolutionShelves?: boolean;
  
  // 21. Built-in Sinks (2 fields)
  builtInSinkOverCounter?: boolean;
  builtInSinkUnderCounter?: boolean;
  
  // 22. Countertops (3 fields)
  countertopQuartz?: boolean;
  countertopGranite?: boolean;
  countertopTiles?: boolean;
  
  // 23. Timeline (3 fields)
  timeline4560Days?: boolean;
  timeline6090Days?: boolean;
  timelineAbove90Days?: boolean;
  
  // 24. Text Fields (3 fields)
  aestheticsAndColors?: string;
  interiorDesigner?: string;
  comments?: string;
  
  // Audit fields
  createdAt?: string;
  updatedAt?: string;
}

export type CustomerRequirementsCreate = Omit<CustomerRequirements, 'id' | 'customerId' | 'createdAt' | 'updatedAt'>;
export type CustomerRequirementsUpdate = Omit<CustomerRequirements, 'id' | 'customerId' | 'createdAt' | 'updatedAt'>;


