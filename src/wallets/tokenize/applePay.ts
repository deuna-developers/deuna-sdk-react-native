export function buildApplePayTokenizeBody(paymentData: unknown): Record<string, unknown> {
  const pd = (paymentData ?? {}) as Record<string, unknown>;
  const header = (pd['header'] ?? {}) as Record<string, unknown>;

  return {
    credential_source: 'apple_pay',
    credential_source_config: {
      type: 'apple_pay',
      values: {
        system: pd['version'] ?? '',
        merchant_transaction_id: header['transactionId'] ?? '',
        encrypted_data: pd['data'] ?? '',
        encryption_header: {
          signature: pd['signature'] ?? '',
          public_key_hash: header['publicKeyHash'] ?? '',
          ephemeral_public_key: header['ephemeralPublicKey'] ?? '',
        },
        src_cx_flow_id: 'mobile',
      },
    },
  };
}
