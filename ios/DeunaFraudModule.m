#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(DeunaFraud, NSObject)

RCT_EXTERN_METHOD(generateFraudId:(NSDictionary *)params
                  resolve:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(initializeFraudProviders:(NSDictionary *)params
                  resolve:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject)

@end
