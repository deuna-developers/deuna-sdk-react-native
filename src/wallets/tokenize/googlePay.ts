export function buildGooglePayTokenizeBody(
  paymentData: unknown
): Record<string, unknown> {
  const pd = (paymentData ?? {}) as Record<string, unknown>;

  const paymentMethodData = (pd.paymentMethodData ?? {}) as Record<
    string,
    unknown
  >;

  const tokenizationData = (paymentMethodData.tokenizationData ?? {}) as Record<
    string,
    unknown
  >;
  const encryptedData = (tokenizationData.token ?? '') as string;

  return {
    credential_source: 'google_pay',
    credential_source_config: {
      type: 'google_pay',
      values: {
        encrypted_data: encryptedData,
        src_cx_flow_id: 'mobile',
      },
    },
  };
}
