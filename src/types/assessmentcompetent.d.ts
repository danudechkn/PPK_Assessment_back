export type AssessmentMode = "SELF" | "HEAD" | "AGREEMENT";

export type AssessmentStatus =
  | "PENDING"
  | "SELF_SUBMITTED"
  | "HEAD_SUBMITTED"
  | "WAITING_AGREEMENT"
  | "COMPLETED";

export interface ScoreItemPayload {
  quest: number;
  user_value?: number | null;
  head_value?: number | null;
  submit_value?: number | null;
  score?: number | null;
}

export interface TypeOrderItemPayload {
  type_order_id: number; // 1 = KPI, 2 = Competency
  value: ScoreItemPayload[];
}

export interface DevelopmentPlanPayload {
  need_development: string;
  development_method: string;
  development_period: string;
  sort_order?: string;
}

export interface SignaturePayload {
  signer_id?: number;
  signer_type_id?: number;
  signer_name?: string;
  signer_position?: string;
  signature_id?: number;
  id?: number;
  comment?: string;
  signed_at?: Date | string;
  ip_address?: string;
}

export interface SaveScoresParams {
  orderId?: unknown;
  items?: unknown;
  item?: TypeOrderItemPayload[] | unknown;
  userId?: unknown;
  headId?: number;
  mode?: AssessmentMode | string;
  isHead?: boolean;
  development_plans?: DevelopmentPlanPayload[] | unknown;
  signature?: SignaturePayload | unknown;
  clientIp?: string;
}

export interface SaveSelfScoresParams {
  orderId?: unknown;
  items?: unknown;
  item?: unknown;
  userId?: unknown;
}

export interface SaveHeadScoresParams {
  orderId?: unknown;
  items?: unknown;
  item?: unknown;
  targetUserId?: unknown;
  headId?: number;
}

export interface SaveAgreementScoresParams {
  orderId?: unknown;
  items?: unknown;
  item?: unknown;
  userId?: unknown;
  headId?: number;
  development_plans?: DevelopmentPlanPayload[] | unknown;
  signature?: SignaturePayload | unknown;
  clientIp?: string;
}
