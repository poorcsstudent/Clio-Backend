Pod::Spec.new do |s|
  s.name           = 'ClioMetaWearables'
  s.version        = '0.1.0'
  s.summary        = 'Expo bridge for Meta Wearables Device Access Toolkit'
  s.description    = 'ClioVision native registration, device-state, and camera bridge for Meta AI glasses.'
  s.license        = { :type => 'Meta Wearables Device Access Toolkit License', :file => '../LICENSE' }
  s.author         = 'ClioVision'
  s.homepage       = 'https://github.com/facebook/meta-wearables-dat-ios'
  s.platforms      = { :ios => '16.4' }
  s.swift_version  = '6.0'
  s.source         = { :git => 'https://github.com/facebook/meta-wearables-dat-ios.git', :tag => '0.7.0' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'

  s.source_files = '*.swift'
  s.vendored_frameworks = 'Frameworks/MWDATCore.xcframework', 'Frameworks/MWDATCamera.xcframework'
  s.preserve_paths = 'Frameworks/MWDATCore.xcframework', 'Frameworks/MWDATCamera.xcframework'
  s.frameworks = 'AVFoundation', 'CoreBluetooth', 'Speech', 'UIKit'
  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
    'SWIFT_COMPILATION_MODE' => 'wholemodule'
  }
end
