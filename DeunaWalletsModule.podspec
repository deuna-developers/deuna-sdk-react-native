require "json"

package = JSON.parse(File.read(File.join(__dir__, "package.json")))

Pod::Spec.new do |s|
  s.name           = "DeunaWalletsModule"
  s.version        = package["version"]
  s.summary        = "Native wallet support (Apple Pay / Google Pay) for @deuna/react-native-sdk"
  s.homepage       = package["homepage"]
  s.license        = package["license"]
  s.authors        = package["author"]
  s.platforms      = { :ios => "13.0" }
  s.source         = { :git => package["repository"]["url"], :tag => "v#{s.version}" }
  s.source_files   = "ios/**/*.{swift,m}"
  s.swift_versions = ["5.0"]

  s.dependency "React-Core"
  s.dependency "DeunaSDK", "~> 2.11.2"
end
