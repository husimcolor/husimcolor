import AsyncStorage from "@react-native-async-storage/async-storage";

import type { CommerceProductCode } from "@/shared/commerce";
import type { RelationType, RelationshipRole } from "@/constants/coupleData";

const COMMERCE_START_GRANTS_KEY = "@commerce_start_grants";
const COMMERCE_STARTED_ANALYSES_KEY = "@commerce_started_analyses";
const COMMERCE_ANALYSIS_DELIVERY_KEY = "@commerce_analysis_delivery";
const RELATIONSHIP_SETUP_CONFIG_KEY = "@relationship_setup_config_v1";

export type CommerceStartGrant = {
  productCode: CommerceProductCode;
  accessToken: string;
  expiresAt: string;
};

export type RelationshipSetupConfig = {
  productCode: Extract<CommerceProductCode, "couple_love_deep" | "parent_child_deep">;
  /** parent-child legacy 흐름도 재사용할 수 있도록 generic type을 유지한다. */
  relationType: RelationType;
  roleA: RelationshipRole;
  roleB: RelationshipRole;
  updatedAt: string;
};

export type CommerceAnalysisDelivery = {
  productCode: CommerceProductCode;
  analysisRunId: number;
  accessToken: string;
  expiresAt: string;
};

async function readGrants(): Promise<CommerceStartGrant[]> {
  const value = await AsyncStorage.getItem(COMMERCE_START_GRANTS_KEY);
  if (!value) return [];
  try {
    const grants = JSON.parse(value) as CommerceStartGrant[];
    return grants.filter((grant) => new Date(grant.expiresAt).getTime() > Date.now());
  } catch {
    return [];
  }
}

export async function saveCommerceStartGrant(grant: CommerceStartGrant): Promise<void> {
  const grants = (await readGrants()).filter((item) => item.productCode !== grant.productCode);
  await AsyncStorage.setItem(COMMERCE_START_GRANTS_KEY, JSON.stringify([...grants, grant]));
}

export async function getCommerceStartGrant(productCode: CommerceProductCode): Promise<CommerceStartGrant | null> {
  const grants = await readGrants();
  await AsyncStorage.setItem(COMMERCE_START_GRANTS_KEY, JSON.stringify(grants));
  return grants.find((grant) => grant.productCode === productCode) ?? null;
}

export async function removeCommerceStartGrant(productCode: CommerceProductCode): Promise<void> {
  const grants = await readGrants();
  await AsyncStorage.setItem(
    COMMERCE_START_GRANTS_KEY,
    JSON.stringify(grants.filter((grant) => grant.productCode !== productCode)),
  );
}

/** 서버가 entitlement를 소비한 뒤에만 기록하는 검사 진행 표식이다. 권한의 원본은 항상 서버 DB다. */
export async function markCommerceAnalysisStarted(productCode: CommerceProductCode): Promise<void> {
  const value = await AsyncStorage.getItem(COMMERCE_STARTED_ANALYSES_KEY);
  let products: CommerceProductCode[] = [];
  try {
    products = value ? JSON.parse(value) as CommerceProductCode[] : [];
  } catch {
    products = [];
  }
  if (!products.includes(productCode)) products.push(productCode);
  await AsyncStorage.setItem(COMMERCE_STARTED_ANALYSES_KEY, JSON.stringify(products));
}

export async function hasCommerceAnalysisStarted(productCode: CommerceProductCode): Promise<boolean> {
  const value = await AsyncStorage.getItem(COMMERCE_STARTED_ANALYSES_KEY);
  try {
    return Boolean(value && (JSON.parse(value) as CommerceProductCode[]).includes(productCode));
  } catch {
    return false;
  }
}

export async function saveCommerceAnalysisDelivery(delivery: CommerceAnalysisDelivery): Promise<void> {
  const raw = await AsyncStorage.getItem(COMMERCE_ANALYSIS_DELIVERY_KEY);
  let deliveries: CommerceAnalysisDelivery[] = [];
  try {
    deliveries = raw ? JSON.parse(raw) as CommerceAnalysisDelivery[] : [];
  } catch {
    deliveries = [];
  }
  const active = deliveries
    .filter((item) => item.productCode !== delivery.productCode)
    .filter((item) => new Date(item.expiresAt).getTime() > Date.now());
  await AsyncStorage.setItem(COMMERCE_ANALYSIS_DELIVERY_KEY, JSON.stringify([...active, delivery]));
}

export async function getCommerceAnalysisDelivery(productCode: CommerceProductCode): Promise<CommerceAnalysisDelivery | null> {
  const raw = await AsyncStorage.getItem(COMMERCE_ANALYSIS_DELIVERY_KEY);
  try {
    const deliveries = raw ? JSON.parse(raw) as CommerceAnalysisDelivery[] : [];
    const active = deliveries.filter((item) => new Date(item.expiresAt).getTime() > Date.now());
    await AsyncStorage.setItem(COMMERCE_ANALYSIS_DELIVERY_KEY, JSON.stringify(active));
    return active.find((item) => item.productCode === productCode) ?? null;
  } catch {
    return null;
  }
}


async function readRelationshipSetupConfigs(): Promise<RelationshipSetupConfig[]> {
  const raw = await AsyncStorage.getItem(RELATIONSHIP_SETUP_CONFIG_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as RelationshipSetupConfig[];
    return Array.isArray(parsed) ? parsed.filter((item) => Boolean(item?.productCode && item?.relationType && item?.roleA && item?.roleB)) : [];
  } catch {
    return [];
  }
}

/** 결제 뒤 아직 entitlement를 소비하지 않은 관계/역할 확정 초안이다. 서버 권한 근거로 사용하지 않는다. */
export async function saveRelationshipSetupConfig(config: Omit<RelationshipSetupConfig, "updatedAt">): Promise<void> {
  const existing = await readRelationshipSetupConfigs();
  const next: RelationshipSetupConfig = { ...config, updatedAt: new Date().toISOString() };
  await AsyncStorage.setItem(RELATIONSHIP_SETUP_CONFIG_KEY, JSON.stringify([...existing.filter((item) => item.productCode !== config.productCode), next]));
}

export async function getRelationshipSetupConfig(productCode: RelationshipSetupConfig["productCode"]): Promise<RelationshipSetupConfig | null> {
  const configs = await readRelationshipSetupConfigs();
  return configs.find((item) => item.productCode === productCode) ?? null;
}

export async function removeRelationshipSetupConfig(productCode: RelationshipSetupConfig["productCode"]): Promise<void> {
  const configs = await readRelationshipSetupConfigs();
  await AsyncStorage.setItem(RELATIONSHIP_SETUP_CONFIG_KEY, JSON.stringify(configs.filter((item) => item.productCode !== productCode)));
}
