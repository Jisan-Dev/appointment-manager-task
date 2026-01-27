// User Types
export interface User {
  _id: string;
  email: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthResponse {
  userId: string;
  email: string;
  name: string;
}

// Staff Types
export interface Staff {
  _id: string;
  userId: string;
  name: string;
  serviceType: string;
  dailyCapacity: number;
  availability: 'available' | 'on_leave';
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateStaffInput {
  name: string;
  serviceType: string;
  dailyCapacity?: number;
  availability?: 'available' | 'on_leave';
}

// Service Types
export interface Service {
  _id: string;
  userId: string;
  name: string;
  duration: 15 | 30 | 60;
  requiredStaffType: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateServiceInput {
  name: string;
  duration: 15 | 30 | 60;
  requiredStaffType: string;
}

// Appointment Types
export type AppointmentStatus = 'scheduled' | 'completed' | 'cancelled' | 'no_show' | 'waiting';

export interface Appointment {
  _id: string;
  userId: string;
  customerName: string;
  serviceId: string | Service;
  staffId?: string | Staff | null;
  appointmentDate: Date;
  status: AppointmentStatus;
  queuePosition?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateAppointmentInput {
  customerName: string;
  serviceId: string;
  staffId?: string;
  appointmentDate: Date;
}

export interface UpdateAppointmentInput {
  status?: AppointmentStatus;
  staffId?: string | null;
  appointmentDate?: Date;
}

// Activity Log Types
export type ActivityAction = 'auto_assigned' | 'scheduled' | 'queued' | 'completed' | 'cancelled' | 'status_changed';

export interface ActivityLog {
  _id: string;
  userId: string;
  appointmentId: string | Appointment;
  action: ActivityAction;
  description: string;
  timestamp: Date;
}

// Dashboard Types
export interface DashboardStats {
  totalAppointmentsToday: number;
  completedAppointments: number;
  pendingAppointments: number;
  waitingQueueCount: number;
}

export interface StaffLoadItem {
  staffId: string;
  name: string;
  capacity: number;
  scheduled: number;
  percentage: number;
}

export interface DashboardData extends DashboardStats {
  staffLoad: StaffLoadItem[];
}

// API Response Types
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
  status: number;
}

export interface ApiError {
  error: string;
  status: number;
}

// Conflict Detection Types
export interface ConflictCheckResult {
  hasConflict: boolean;
  message?: string;
  conflictingAppointment?: Appointment;
}

// Queue Types
export interface QueueItem {
  appointmentId: string;
  customerName: string;
  appointmentDate: Date;
  queuePosition: number;
  waitingTime: number; // in minutes
}

// Form Types
export interface LoginFormData {
  email: string;
  password: string;
}

export interface SignupFormData {
  name: string;
  email: string;
  password: string;
  confirmPassword?: string;
}

export interface CreateAppointmentFormData {
  customerName: string;
  serviceId: string;
  staffId?: string;
  appointmentDate: string;
  appointmentTime: string;
}

// Utility Types
export interface PaginationParams {
  page?: number;
  limit?: number;
  sort?: string;
}

export interface FilterParams {
  staffId?: string;
  date?: string;
  status?: AppointmentStatus;
}
