// API Response types aligned with VMS SaaS backend

export interface Visitor {
  id: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  company: string | null;
  visitorTypeId: string | null;
  visitorTypeName: string | null;
  photoUrl?: string;
  isOnSite?: boolean;
}

export interface Host {
  id: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  email?: string;
  phone?: string;
  departmentId?: string;
  photoUrl?: string | null;
  department?: Department | null;
}

export interface Department {
  id: string;
  name: string;
}

export interface Service {
  id: string;
  name: string;
}

export interface VisitorType {
  id: string;
  name: string;
}

export interface BusinessSettings {
  id: string;
  name: string | null;
  logoUrl: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  address: string | null;
  city: string | null;
  country: string | null;
  industry: string | null;
  taxId: string | null;
}

export interface Visit {
  id: string;
  visitorId?: string;
  newVisitor?: {
    firstName: string;
    lastName: string;
    phone?: string;
    company?: string;
    visitorTypeId: string;
  };
  hostId?: string;
  departmentId?: string;
  serviceId?: string;
  purpose?: string;
  signatureData?: string;
  visitorPhotoUrl?: string;
  vehiclePhotoUrl?: string;
  vehicle?: {
    plateNumber: string;
    type: 'CAR' | 'TRUCK' | 'MOTORCYCLE' | 'OTHER';
    brand?: string;
    color?: string;
  };
  passengerCount?: number;
  checkInAt: string;
  checkOutAt?: string;
}

export interface VisitorDetail extends Visitor {
  isOnSite: boolean;
}

export interface VisitDetail {
  id: string;
  visitNumber: string | null;
  visitorId: string;
  hostId: string | null;
  departmentId: string | null;
  serviceId: string | null;
  vehicleId: string | null;
  passengerCount: number | null;
  visitType: string;
  visitDate: string;
  purpose: string | null;
  checkInAt: string | null;
  checkOutAt: string | null;
  durationMinutes: number | null;
  status: 'IN' | 'OUT' | 'CANCELLED' | 'SCHEDULED';
  visitorPhotoUrl: string | null;
  vehiclePhotoUrl: string | null;
  visitor: Visitor;
  host: Host | null;
  department: Department | null;
  service: Service | null;
  vehicle: {
    id: string;
    plateNumber: string;
    type: string;
    brand: string | null;
    color: string | null;
  } | null;
}

export interface VisitHistoryEntry {
  id: string;
  visitNumber: string | null;
  visitDate: string;
  purpose: string | null;
  checkInAt: string | null;
  checkOutAt: string | null;
  durationMinutes: number | null;
  status: 'IN' | 'OUT' | 'CANCELLED' | 'SCHEDULED';
  visitor: Visitor;
  host: Host | null;
  department: Department | null;
  service: Service | null;
  vehicle: {
    id: string;
    plateNumber: string;
    type: string;
  } | null;
}

export interface OnSiteVisitor extends Visit {
  visitor: Visitor;
  host: Host | null;
}

export interface RecentActivity {
  id: string;
  visitorName: string;
  hostName: string;
  type: 'CHECK_IN' | 'CHECK_OUT';
  time: string;
  visitorPhotoUrl?: string | null;
}

export interface DashboardKpiStats {
  arrivedToday: number;
  onSite: number;
  departedToday: number;
  monthlyVisits: number;
  weeklyAverage: number;
  weeklyTrend: { day: string; count: number }[];
  vehiclesOnSite: number;
  visitsToday: number;
  recentActivities: RecentActivity[];
}

export interface DashboardData extends DashboardKpiStats {
  onSiteVisitors: OnSiteVisitor[];
}

export interface VisitorKpisResponse {
  onSite: number;
  outToday: number;
  totalToday: number;
}

export interface UploadResponse {
  url: string;
  size: number;
  contentType: string;
}

export interface PairingCodeResponse {
  pairingCode: string;
  code?: string;
  deviceId?: string;
  expiresAt?: string;
  diviceId?: string;
}


export interface PairingStatusResponse {
  ok?: boolean;
  isPaired: boolean;
  deviceToken?: string;
}

export interface DeviceVerifyResponse {
  ok: boolean;
  deviceId?: string;
  isPaired?: boolean;
  lastActiveAt?: string;
}

export interface DevicePingResponse {
  ok: boolean;
  timestamp: string;
}

export interface KioskSettings {
  requireSignature: number;
  requireVisitorPhoto: number;
  requireVehiclePhoto: number;
  requireVehicleCheck: number;
  ndaPolicyText: string | null;
}

export interface ErrorResponse {
  error: string;
  message?: string;
  code?: string;
}

export type CommandType =
  | "CONFIG_UPDATE"
  | "REBOOT"
  | "EMERGENCY_MESSAGE"
  | "CLEAR_CACHE"
  | "REFRESH_SETTINGS";

export type CommandPriority = "low" | "medium" | "high" | "critical";

export type CommandStatus = "pending" | "acked" | "applied" | "failed";

export interface Command {
  id: string;
  deviceId: string;
  type: CommandType;
  payload: Record<string, any> | null;
  status: CommandStatus;
  priority: CommandPriority;
  ackAt: string | null;
  appliedAt: string | null;
  error: string | null;
  expiresAt: string | null;
  createdAt: string;
}

export interface CommandsQueueResponse {
  commands: Command[];
}
