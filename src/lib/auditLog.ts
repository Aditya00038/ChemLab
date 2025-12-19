import { db } from './firebase';
import { collection, addDoc, Timestamp, query, orderBy, limit, getDocs } from 'firebase/firestore';

export type AuditAction = 
  | 'create' 
  | 'update' 
  | 'delete' 
  | 'bulk_delete' 
  | 'import' 
  | 'export'
  | 'login'
  | 'logout';

export type AuditResource = 
  | 'chemical' 
  | 'equipment' 
  | 'user' 
  | 'settings' 
  | 'auth';

export interface AuditLog {
  id?: string;
  userId: string;
  userEmail: string;
  action: AuditAction;
  resource: AuditResource;
  resourceId?: string;
  resourceName?: string;
  changes?: {
    before?: any;
    after?: any;
  };
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  timestamp: Timestamp;
  success: boolean;
  errorMessage?: string;
}

/**
 * Log an admin action to the audit trail
 */
export async function logAuditAction(log: Omit<AuditLog, 'timestamp' | 'id'>): Promise<void> {
  try {
    // Add browser metadata
    const enrichedLog: AuditLog = {
      ...log,
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'unknown',
      timestamp: Timestamp.now(),
    };

    await addDoc(collection(db, 'auditLogs'), enrichedLog);
    
    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log('[Audit Log]', enrichedLog);
    }
  } catch (error) {
    console.error('Failed to log audit action:', error);
    // Don't throw - audit logging failure shouldn't break the app
  }
}

/**
 * Get recent audit logs (admin only)
 */
export async function getRecentAuditLogs(limitCount: number = 50): Promise<AuditLog[]> {
  try {
    const q = query(
      collection(db, 'auditLogs'),
      orderBy('timestamp', 'desc'),
      limit(limitCount)
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    } as AuditLog));
  } catch (error) {
    console.error('Failed to fetch audit logs:', error);
    return [];
  }
}

/**
 * Helper to create audit log for chemical changes
 */
export function createChemicalAuditLog(
  action: AuditAction,
  userId: string,
  userEmail: string,
  chemicalId: string,
  chemicalName: string,
  before?: any,
  after?: any
): Omit<AuditLog, 'timestamp' | 'id'> {
  return {
    userId,
    userEmail,
    action,
    resource: 'chemical',
    resourceId: chemicalId,
    resourceName: chemicalName,
    changes: before || after ? { before, after } : undefined,
    success: true,
  };
}

/**
 * Helper to create audit log for equipment changes
 */
export function createEquipmentAuditLog(
  action: AuditAction,
  userId: string,
  userEmail: string,
  equipmentId: string,
  equipmentName: string,
  before?: any,
  after?: any
): Omit<AuditLog, 'timestamp' | 'id'> {
  return {
    userId,
    userEmail,
    action,
    resource: 'equipment',
    resourceId: equipmentId,
    resourceName: equipmentName,
    changes: before || after ? { before, after } : undefined,
    success: true,
  };
}
