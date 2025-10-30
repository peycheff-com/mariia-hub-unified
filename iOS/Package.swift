// swift-tools-version: 5.9
import PackageDescription

let package = Package(
    name: "MariiaHub",
    platforms: [
        .iOS(.v15),
        .watchOS(.v8)
    ],
    products: [
        .library(
            name: "MariiaHub",
            targets: ["MariiaHub"]
        ),
    ],
    dependencies: [
        .package(url: "https://github.com/supabase/supabase-swift", from: "2.0.0"),
        .package(url: "https://github.com/stripe/stripe-ios", from: "23.0.0"),
        .package(url: "https://github.com/Alamofire/Alamofire", from: "5.8.0"),
        .package(url: "https://github.com/onevcat/Kingfisher", from: "7.9.0"),
        .package(url: "https://github.com/pointfreeco/swift-composable-architecture", from: "1.9.0"),
        .package(url: "https://github.com/malcommac/SwiftDate", from: "7.0.0"),
        .package(url: "https://github.com/pointfreeco/swift-snapshot-testing", from: "1.14.0")
    ],
    targets: [
        .target(
            name: "MariiaHub",
            dependencies: [
                .product(name: "Supabase", package: "supabase-swift"),
                .product(name: "Stripe", package: "stripe-ios"),
                .product(name: "Alamofire", package: "Alamofire"),
                .product(name: "Kingfisher", package: "Kingfisher"),
                .product(name: "ComposableArchitecture", package: "swift-composable-architecture"),
                .product(name: "SwiftDate", package: "SwiftDate")
            ],
            path: "Sources"
        ),
        .testTarget(
            name: "MariiaHubTests",
            dependencies: [
                "MariiaHub",
                .product(name: "SnapshotTesting", package: "swift-snapshot-testing")
            ],
            path: "Tests"
        ),
    ]
)