const { withAppDelegate, WarningAggregator } = require("@expo/config-plugins");
const { mergeContents } = require("@expo/config-plugins/build/utils/generateCode");

// Objective-C implementation
const objcDefinition = `@interface RocketSimLoader : NSObject

- (void)loadRocketSimConnect;

@end

@implementation RocketSimLoader

- (void)loadRocketSimConnect {
#if DEBUG
  NSString *frameworkPath = @"/Applications/RocketSim.app/Contents/Frameworks/RocketSimConnectLinker.nocache.framework";
  NSBundle *frameworkBundle = [NSBundle bundleWithPath:frameworkPath];
  NSError *error = nil;

  if (![frameworkBundle loadAndReturnError:&error]) {
    NSLog(@"Failed to load linker framework: %@", error);
    return;
  }

  NSLog(@"RocketSim Connect successfully linked");
#endif
}

@end`;

const objcInvocation = `RocketSimLoader *loader = [[RocketSimLoader alloc] init];
  [loader loadRocketSimConnect];`;

// Swift implementation
const swiftDefinition = `
class RocketSimLoader {
    func loadRocketSimConnect() {
        #if DEBUG
        let frameworkPath = "/Applications/RocketSim.app/Contents/Frameworks/RocketSimConnectLinker.nocache.framework"
        guard let frameworkBundle = Bundle(path: frameworkPath) else {
            print("Failed to find RocketSim framework")
            return
        }

        do {
            try frameworkBundle.loadAndReturnError()
            print("RocketSim Connect successfully linked")
        } catch {
            print("Failed to load linker framework: \\(error)")
        }
        #endif
    }
}`;

const swiftInvocation = `
    let loader = RocketSimLoader()
    loader.loadRocketSimConnect()`;

const objcMethodMatcher =
  /-\s*\(BOOL\)\s*application:\s*\(UIApplication\s*\*\s*\)\s*\w+\s+didFinishLaunchingWithOptions:/g;
const swiftMethodMatcher = /bindReactNativeFactory\(factory\)|reactNativeFactory = factory/g;

const modifyObjCAppDelegate = (appDelegate) => {
  let contents = appDelegate;

  if (contents.includes(objcInvocation)) {
    return contents;
  }

  // Reset regex state
  objcMethodMatcher.lastIndex = 0;

  if (!objcMethodMatcher.test(contents)) {
    WarningAggregator.addWarningIOS(
      "withRocketSimConnect",
      "Unable to determine correct insertion point in Objective-C AppDelegate.",
    );
    return contents;
  }

  // Reset regex state for replacement
  objcMethodMatcher.lastIndex = 0;

  if (!contents.includes(objcDefinition)) {
    contents = mergeContents({
      src: contents,
      anchor: objcMethodMatcher,
      newSrc: objcDefinition,
      offset: -2,
      tag: "withRocketSimConnect - definition",
      comment: "//",
    }).contents;
  }

  // Reset regex state again
  objcMethodMatcher.lastIndex = 0;

  contents = mergeContents({
    src: contents,
    anchor: objcMethodMatcher,
    newSrc: objcInvocation,
    offset: 2,
    tag: "withRocketSimConnect - didFinishLaunchingWithOptions",
    comment: "//",
  }).contents;

  return contents;
};

const modifySwiftAppDelegate = (appDelegate) => {
  let contents = appDelegate;

  if (contents.includes(swiftInvocation)) {
    return contents;
  }

  // Reset regex state
  swiftMethodMatcher.lastIndex = 0;

  if (!swiftMethodMatcher.test(contents)) {
    WarningAggregator.addWarningIOS(
      "withRocketSimConnect",
      "Unable to determine correct insertion point in Swift AppDelegate.",
    );
    return contents;
  }

  // Reset regex state for replacement
  swiftMethodMatcher.lastIndex = 0;

  if (!contents.includes("class RocketSimLoader")) {
    const classAnchor = /class ReactNativeDelegate: ExpoReactNativeFactoryDelegate/g;
    contents = mergeContents({
      src: contents,
      anchor: classAnchor,
      newSrc: swiftDefinition,
      offset: -1,
      tag: "withRocketSimConnect - swift definition",
      comment: "//",
    }).contents;
  }

  // Reset regex state again
  swiftMethodMatcher.lastIndex = 0;

  contents = mergeContents({
    src: contents,
    anchor: swiftMethodMatcher,
    newSrc: swiftInvocation,
    offset: 1,
    tag: "withRocketSimConnect - swift didFinishLaunchingWithOptions",
    comment: "//",
  }).contents;

  return contents;
};

const withRocketSimConnect = (config) => {
  return withAppDelegate(config, (config) => {
    if (config.modResults.language === "objc" || config.modResults.language === "objcpp") {
      config.modResults.contents = modifyObjCAppDelegate(config.modResults.contents);
    } else if (config.modResults.language === "swift") {
      config.modResults.contents = modifySwiftAppDelegate(config.modResults.contents);
    } else {
      WarningAggregator.addWarningIOS(
        "withRocketSimConnect",
        `Unsupported AppDelegate language: ${config.modResults.language}`,
      );
    }
    return config;
  });
};

module.exports = withRocketSimConnect;
