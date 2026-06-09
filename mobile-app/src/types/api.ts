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
  tenantId: string;
  name: string;
  logo?: string;
  requireVisitorPhoto?: boolean;
  requireVehiclePhoto?: boolean;
  requireSignature?: boolean;
  requireVehicleInfo?: boolean;
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
  checkedInAt: string;
  checkedOutAt?: string;
}

export interface OnSiteVisitor extends Visit {
  visitor: Visitor;
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

export interface ErrorResponse {
  error: string;
  message?: string;
  code?: string;
}
