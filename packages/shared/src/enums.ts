/**
 * Domain enums for the Lubdiesel Commercial Hub.
 *
 * These are the single source of truth for the frontend and the API request layer.
 * They are kept in sync manually with the Prisma schema enums (apps/api/prisma/schema.prisma).
 * When you change an enum here, update the Prisma schema (and vice-versa) and generate a migration.
 */

export const UserRole = {
  ADMIN: 'ADMIN',
  USER: 'USER',
} as const;
export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export const ContactType = {
  LEAD: 'LEAD',
  CUSTOMER: 'CUSTOMER',
  RESELLER: 'RESELLER',
  WORKSHOP: 'WORKSHOP',
  FLEET: 'FLEET',
  SUPPLIER: 'SUPPLIER',
  OTHER: 'OTHER',
} as const;
export type ContactType = (typeof ContactType)[keyof typeof ContactType];

export const CompanyType = {
  WORKSHOP: 'WORKSHOP',
  RESELLER: 'RESELLER',
  DISTRIBUTOR: 'DISTRIBUTOR',
  FLEET: 'FLEET',
  SUPPLIER: 'SUPPLIER',
  OTHER: 'OTHER',
} as const;
export type CompanyType = (typeof CompanyType)[keyof typeof CompanyType];

export const CustomerType = {
  PERSON: 'PERSON',
  COMPANY: 'COMPANY',
} as const;
export type CustomerType = (typeof CustomerType)[keyof typeof CustomerType];

export const LeadStatus = {
  NEW: 'NEW',
  CONTACTED: 'CONTACTED',
  INTERESTED: 'INTERESTED',
  NEGOTIATION: 'NEGOTIATION',
  WON: 'WON',
  WAITING: 'WAITING',
  LOST: 'LOST',
} as const;
export type LeadStatus = (typeof LeadStatus)[keyof typeof LeadStatus];

/** Origin of a lead/opportunity. Modelled as an enum now, may become a configurable table later. */
export const LeadSource = {
  TOYOCENTER: 'TOYOCENTER',
  LUBDIESEL_WEBSITE: 'LUBDIESEL_WEBSITE',
  INSTAGRAM_TOYOCENTER: 'INSTAGRAM_TOYOCENTER',
  INSTAGRAM_LUBDIESEL: 'INSTAGRAM_LUBDIESEL',
  WHATSAPP: 'WHATSAPP',
  MERCADO_LIVRE: 'MERCADO_LIVRE',
  REFERRAL: 'REFERRAL',
  PERSONAL_NETWORK: 'PERSONAL_NETWORK',
  EVENT: 'EVENT',
  RESELLER: 'RESELLER',
  OTHER: 'OTHER',
} as const;
export type LeadSource = (typeof LeadSource)[keyof typeof LeadSource];

export const LostReason = {
  PRICE: 'PRICE',
  NO_RESPONSE: 'NO_RESPONSE',
  NO_INTEREST: 'NO_INTEREST',
  COMPETITOR: 'COMPETITOR',
  NO_STOCK: 'NO_STOCK',
  TIMING: 'TIMING',
  OTHER: 'OTHER',
} as const;
export type LostReason = (typeof LostReason)[keyof typeof LostReason];

export const FollowUpType = {
  CALL: 'CALL',
  WHATSAPP: 'WHATSAPP',
  EMAIL: 'EMAIL',
  MEETING: 'MEETING',
  OTHER: 'OTHER',
} as const;
export type FollowUpType = (typeof FollowUpType)[keyof typeof FollowUpType];

export const FollowUpStatus = {
  PENDING: 'PENDING',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
} as const;
export type FollowUpStatus = (typeof FollowUpStatus)[keyof typeof FollowUpStatus];

export const InteractionType = {
  CALL: 'CALL',
  WHATSAPP: 'WHATSAPP',
  EMAIL: 'EMAIL',
  MEETING: 'MEETING',
  NOTE: 'NOTE',
  SYSTEM: 'SYSTEM',
} as const;
export type InteractionType = (typeof InteractionType)[keyof typeof InteractionType];

export const InventoryMovementType = {
  PURCHASE: 'PURCHASE',
  SALE: 'SALE',
  SAMPLE: 'SAMPLE',
  INTERNAL_USE: 'INTERNAL_USE',
  GIFT: 'GIFT',
  LOSS: 'LOSS',
  ADJUSTMENT: 'ADJUSTMENT',
  RETURN: 'RETURN',
} as const;
export type InventoryMovementType =
  (typeof InventoryMovementType)[keyof typeof InventoryMovementType];

export const OrderStatus = {
  DRAFT: 'DRAFT',
  PENDING: 'PENDING',
  PAID: 'PAID',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
} as const;
export type OrderStatus = (typeof OrderStatus)[keyof typeof OrderStatus];

export const OrderSource = {
  WHATSAPP: 'WHATSAPP',
  MERCADO_LIVRE: 'MERCADO_LIVRE',
  INSTAGRAM: 'INSTAGRAM',
  TOYOCENTER: 'TOYOCENTER',
  DIRECT: 'DIRECT',
  RESELLER: 'RESELLER',
  OTHER: 'OTHER',
} as const;
export type OrderSource = (typeof OrderSource)[keyof typeof OrderSource];
