import Foundation
import React
import DeunaSDK
import UIKit

@objc(DeunaWallets)
class DeunaWalletsModule: RCTEventEmitter {
  private var loadingOverlayView: UIView?

  override static func requiresMainQueueSetup() -> Bool { false }

  override func supportedEvents() -> [String]! {
    return ["onWalletSuccess", "onWalletError", "onWalletClosed"]
  }

  @objc(checkAvailableProviders:resolve:reject:)
  func checkAvailableProviders(_ params: [String: Any],
                                resolve: @escaping RCTPromiseResolveBlock,
                                reject: @escaping RCTPromiseRejectBlock) {
    let providers = params["providers"] as? [String] ?? []
    let available = providers.filter { DeunaWalletLauncher.isAvailable(provider: $0) }
    resolve(available)
  }

  @objc(launchWallet:resolve:reject:)
  func launchWallet(_ params: [String: Any],
                    resolve: @escaping RCTPromiseResolveBlock,
                    reject: @escaping RCTPromiseRejectBlock) {
    guard
      let provider = params["provider"] as? String,
      let credentials = params["credentials"] as? [String: Any]
    else {
      reject("INVALID_PARAMS", "provider and credentials are required", nil)
      return
    }

    let environment = params["environment"] as? String ?? "develop"

    var settled = false

    // Apple Pay PKPaymentAuthorizationController requires main thread presentation
    DispatchQueue.main.async {
      DeunaWalletLauncher.launch(
        provider: provider,
        credentials: credentials
      ) { [weak self] result in
        guard !settled else { return }
        settled = true
        switch result {
        case .success(let data):
          self?.sendEvent(withName: "onWalletSuccess", body: ["data": data])
          resolve(data)
        case .error(let code, let msg):
          self?.sendEvent(withName: "onWalletError", body: ["code": code, "message": msg])
          reject(code, msg, nil)
        case .closed:
          self?.sendEvent(withName: "onWalletClosed", body: ["action": "userAction"])
          resolve("closed")
        }
      }
    }
  }

  @objc(setLoading:)
  func setLoading(_ visible: Bool) {
    DispatchQueue.main.async { [weak self] in
      guard let self else { return }
      if visible {
        self.showLoadingDialog()
      } else {
        self.hideLoadingDialog()
      }
    }
  }

  private func showLoadingDialog() {
    guard loadingOverlayView == nil else { return }
    guard let presenter = topViewController() else { return }

    let overlay = UIView(frame: presenter.view.bounds)
    overlay.backgroundColor = UIColor.black.withAlphaComponent(0.12)
    overlay.autoresizingMask = [.flexibleWidth, .flexibleHeight]

    let size: CGFloat = 72
    let container = UIView(frame: CGRect(x: 0, y: 0, width: size, height: size))
    container.backgroundColor = .white
    container.layer.cornerRadius = size / 2
    container.translatesAutoresizingMaskIntoConstraints = false

    let spinner = UIActivityIndicatorView(style: .medium)
    spinner.translatesAutoresizingMaskIntoConstraints = false
    spinner.startAnimating()
    container.addSubview(spinner)
    overlay.addSubview(container)

    NSLayoutConstraint.activate([
      container.centerXAnchor.constraint(equalTo: overlay.centerXAnchor),
      container.centerYAnchor.constraint(equalTo: overlay.centerYAnchor),
      container.widthAnchor.constraint(equalToConstant: size),
      container.heightAnchor.constraint(equalToConstant: size),
      spinner.centerXAnchor.constraint(equalTo: container.centerXAnchor),
      spinner.centerYAnchor.constraint(equalTo: container.centerYAnchor)
    ])

    presenter.view.addSubview(overlay)
    loadingOverlayView = overlay
  }

  private func hideLoadingDialog() {
    loadingOverlayView?.removeFromSuperview()
    loadingOverlayView = nil
  }

  private func topViewController(
    from controller: UIViewController? = UIApplication.shared.connectedScenes
      .compactMap { $0 as? UIWindowScene }
      .flatMap { $0.windows }
      .first(where: { $0.isKeyWindow })?
      .rootViewController
  ) -> UIViewController? {
    if let nav = controller as? UINavigationController {
      return topViewController(from: nav.visibleViewController)
    }
    if let tab = controller as? UITabBarController {
      return topViewController(from: tab.selectedViewController)
    }
    if let presented = controller?.presentedViewController {
      return topViewController(from: presented)
    }
    return controller
  }
}
