import Foundation
import React
#if canImport(DeunaSDK)
import DeunaSDK
#endif

@objc(DeunaFraud)
class DeunaFraudModule: NSObject, RCTBridgeModule {
  static func moduleName() -> String! {
    return "DeunaFraud"
  }

  static func requiresMainQueueSetup() -> Bool {
    return false
  }

  @objc(generateFraudId:resolve:reject:)
  func generateFraudId(_ params: [String: Any],
                       resolve: @escaping RCTPromiseResolveBlock,
                       reject: @escaping RCTPromiseRejectBlock) {
    let envString = params["environment"] as? String ?? "production"
    let publicApiKey = params["publicApiKey"] as? String ?? "deuna_fraud_key"

    let providers = (params["providers"] as? [String: Any]) ?? params.filter {
      $0.key != "environment" && $0.key != "publicApiKey"
    }

    #if canImport(DeunaSDK)
    let env: Environment
    switch envString.lowercased() {
    case "staging": env = .staging
    case "sandbox": env = .sandbox
    case "development", "develop": env = .development
    default: env = .production
    }

    let sdk = DeunaSDK(environment: env, publicApiKey: publicApiKey)
    sdk.generateFraudId(params: providers) { fraudId in
      resolve(fraudId)
    }
    #else
    resolve(nil)
    #endif
  }

  @objc(initializeFraudProviders:resolve:reject:)
  func initializeFraudProviders(_ params: [String: Any],
                                resolve: @escaping RCTPromiseResolveBlock,
                                reject: @escaping RCTPromiseRejectBlock) {
    // In iOS, fraud providers execute synchronously on generateFraudId.
    // We resolve immediately for cross-platform parity with Android.
    resolve(nil)
  }
}
