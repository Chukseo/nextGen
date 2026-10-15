import prisma from './prisma';

export async function logAuditEvent({
  userId,
  action,
  entityType,
  entityId,
  details,
  ipAddress,
  userAgent,
}: {
  userId?: string | null;
  action: string;
  entityType: 'SUBMISSION' | 'USER' | 'ISSUE' | 'JOURNAL' | 'DOI' | 'SYSTEM';
  entityId?: string | null;
  details: Record<string, any>;
  ipAddress?: string | null;
  userAgent?: string | null;
}) {
  try {
    return await prisma.auditEvent.create({
      data: {
        userId: userId || null,
        action,
        entityType,
        entityId: entityId || null,
        details: JSON.stringify(details),
        ipAddress: ipAddress || null,
        userAgent: userAgent || null,
      },
    });
  } catch (error) {
    console.error('Failed to log audit event:', error);
  }
}
