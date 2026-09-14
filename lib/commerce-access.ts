import AsyncStorage from "@react-native-async-storage/async-storage";

import type { CommerceProductCode } from "@/shared/commerce";

const COMMERCE_START_GRANTS_KEY = "@commerce_start_grants";
const COMMERCE_STARTED_ANALYSES_KEY = "@commerce_started_analyses";
const COMMERCE_ANALYSIS_DELIVERY_KEY = "@commerce_analysis_delivery";

export type CommerceStartGrant = {
  productCode: CommerceProductCode;
  accessToken: string;
  expiresAt: string;
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
