import Foundation
import HealthKit
import Combine

class HealthKitManager: NSObject, ObservableObject {
    static let shared = HealthKitManager()

    @Published var isAuthorized = false
    @Published var authorizationStatus: HKAuthorizationStatus = .notDetermined
    @Published var errorMessage: String?

    private let healthStore = HKHealthStore()
    private var cancellables = Set<AnyCancellable>()

    // MARK: - Data Types
    private let workoutDataTypes: Set<HKSampleType> = [
        HKObjectType.workoutType(),
        HKObjectType.quantityType(forIdentifier: .activeEnergyBurned)!,
        HKObjectType.quantityType(forIdentifier: .distanceWalkingRunning)!,
        HKObjectType.quantityType(forIdentifier: .heartRate)!,
        HKObjectType.quantityType(forIdentifier: .stepCount)!
    ]

    private let bodyDataTypes: Set<HKSampleType> = [
        HKObjectType.quantityType(forIdentifier: .bodyMass)!,
        HKObjectType.quantityType(forIdentifier: .bodyMassIndex)!,
        HKObjectType.quantityType(forIdentifier: .bodyFatPercentage)!,
        HKObjectType.quantityType(forIdentifier: .leanBodyMass)!
    ]

    private let fitnessDataTypes: Set<HKSampleType> = [
        HKObjectType.quantityType(forIdentifier: .appleExerciseTime)!,
        HKObjectType.quantityType(forIdentifier: .appleStandTime)!,
        HKObjectType.quantityType(forIdentifier: .appleMoveTime)!
,
        HKObjectType.quantityType(forIdentifier: .basalEnergyBurned)!
    ]

    override init() {
        super.init()
        checkAuthorizationStatus()
    }

    // MARK: - Authorization

    func requestPermissions() async -> Bool {
        guard HKHealthStore.isHealthDataAvailable() else {
            errorMessage = "HealthKit is not available on this device"
            return false
        }

        do {
            let allDataTypes = workoutDataTypes.union(bodyDataTypes).union(fitnessDataTypes)
            try await healthStore.requestAuthorization(toShare: nil, read: Set(allDataTypes))

            await MainActor.run {
                self.isAuthorized = true
                self.errorMessage = nil
            }

            return true
        } catch {
            await MainActor.run {
                self.errorMessage = error.localizedDescription
                self.isAuthorized = false
            }
            return false
        }
    }

    private func checkAuthorizationStatus() {
        guard let workoutType = HKObjectType.quantityType(forIdentifier: .activeEnergyBurned) else {
            return
        }

        let status = healthStore.authorizationStatus(for: workoutType)
        DispatchQueue.main.async {
            self.authorizationStatus = status
            self.isAuthorized = status == .sharingAuthorized
        }
    }

    // MARK: - Workout Tracking

    func startFitnessWorkout(for service: Service) async throws {
        guard isAuthorized else {
            throw HealthKitError.notAuthorized
        }

        let workoutConfiguration = HKWorkoutConfiguration()
        workoutConfiguration.activityType = .other
        workoutConfiguration.locationType = .unknown

        do {
            let session = try await healthStore.beginWorkout(with: workoutConfiguration)
            // Handle workout session
            print("Started fitness workout for service: \(service.title)")
        } catch {
            throw HealthKitError.workoutStartFailed(error.localizedDescription)
        }
    }

    func logWorkout(
        type: HKWorkoutActivityType,
        startDate: Date,
        endDate: Date,
        duration: TimeInterval,
        caloriesBurned: Double?
    ) async throws {
        guard isAuthorized else {
            throw HealthKitError.notAuthorized
        }

        let workout = HKWorkout(
            activityType: type,
            start: startDate,
            end: endDate,
            duration: duration,
            totalEnergyBurned: caloriesBurned != nil ? HKQuantity(unit: .kilocalorie(), doubleValue: caloriesBurned!) : nil,
            totalDistance: nil,
            metadata: ["source": "MariiaHub"]
        )

        try await healthStore.save(workout)
    }

    // MARK: - Data Retrieval

    func fetchWorkouts(from startDate: Date, to endDate: Date) async throws -> [HKWorkout] {
        guard isAuthorized else {
            throw HealthKitError.notAuthorized
        }

        let workoutType = HKObjectType.workoutType()
        let predicate = HKQuery.predicateForSamples(withStart: startDate, end: endDate, options: .strictStartDate)

        return try await withCheckedThrowingContinuation { continuation in
            let query = HKSampleQuery(
                sampleType: workoutType,
                predicate: predicate,
                limit: HKObjectQueryNoLimit,
                sortDescriptors: [NSSortDescriptor(key: HKSampleSortIdentifierStartDate, ascending: false)]
            ) { (samples, error) in
                if let error = error {
                    continuation.resume(throwing: error)
                    return
                }

                continuation.resume(returning: samples as? [HKWorkout] ?? [])
            }

            healthStore.execute(query)
        }
    }

    func fetchStepCount(for date: Date) async throws -> Int {
        guard isAuthorized else {
            throw HealthKitError.notAuthorized
        }

        guard let stepType = HKObjectType.quantityType(forIdentifier: .stepCount) else {
            throw HealthKitError.dataTypeNotAvailable
        }

        let calendar = Calendar.current
        let startOfDay = calendar.startOfDay(for: date)
        let endOfDay = calendar.date(byAdding: .day, value: 1, to: startOfDay)!

        let predicate = HKQuery.predicateForSamples(withStart: startOfDay, end: endOfDay, options: .strictStartDate)

        return try await withCheckedThrowingContinuation { continuation in
            let query = HKStatisticsQuery(
                quantityType: stepType,
                quantitySamplePredicate: predicate,
                options: .cumulativeSum
            ) { (_, statistics, error) in
                if let error = error {
                    continuation.resume(throwing: error)
                    return
                }

                let stepCount = statistics?.sumQuantity()?.doubleValue(for: .count()) ?? 0
                continuation.resume(returning: Int(stepCount))
            }

            healthStore.execute(query)
        }
    }

    func fetchActiveCalories(for date: Date) async throws -> Double {
        guard isAuthorized else {
            throw HealthKitError.notAuthorized
        }

        guard let caloriesType = HKObjectType.quantityType(forIdentifier: .activeEnergyBurned) else {
            throw HealthKitError.dataTypeNotAvailable
        }

        let calendar = Calendar.current
        let startOfDay = calendar.startOfDay(for: date)
        let endOfDay = calendar.date(byAdding: .day, value: 1, to: startOfDay)!

        let predicate = HKQuery.predicateForSamples(withStart: startOfDay, end: endOfDay, options: .strictStartDate)

        return try await withCheckedThrowingContinuation { continuation in
            let query = HKStatisticsQuery(
                quantityType: caloriesType,
                quantitySamplePredicate: predicate,
                options: .cumulativeSum
            ) { (_, statistics, error) in
                if let error = error {
                    continuation.resume(throwing: error)
                    return
                }

                let calories = statistics?.sumQuantity()?.doubleValue(for: .kilocalorie()) ?? 0
                continuation.resume(returning: calories)
            }

            healthStore.execute(query)
        }
    }

    func fetchHeartRateSamples(for date: Date) async throws -> [HKQuantitySample] {
        guard isAuthorized else {
            throw HealthKitError.notAuthorized
        }

        guard let heartRateType = HKObjectType.quantityType(forIdentifier: .heartRate) else {
            throw HealthKitError.dataTypeNotAvailable
        }

        let calendar = Calendar.current
        let startOfDay = calendar.startOfDay(for: date)
        let endOfDay = calendar.date(byAdding: .day, value: 1, to: startOfDay)!

        let predicate = HKQuery.predicateForSamples(withStart: startOfDay, end: endOfDay, options: .strictStartDate)

        return try await withCheckedThrowingContinuation { continuation in
            let query = HKSampleQuery(
                sampleType: heartRateType,
                predicate: predicate,
                limit: HKObjectQueryNoLimit,
                sortDescriptors: [NSSortDescriptor(key: HKSampleSortIdentifierStartDate, ascending: false)]
            ) { (samples, error) in
                if let error = error {
                    continuation.resume(throwing: error)
                    return
                }

                continuation.resume(returning: samples as? [HKQuantitySample] ?? [])
            }

            healthStore.execute(query)
        }
    }

    // MARK: - Body Metrics

    func fetchBodyWeight() async throws -> Double? {
        guard isAuthorized else {
            throw HealthKitError.notAuthorized
        }

        guard let weightType = HKObjectType.quantityType(forIdentifier: .bodyMass) else {
            throw HealthKitError.dataTypeNotAvailable
        }

        let predicate = HKQuery.predicateForSamples(withStart: Date.distantPast, end: Date(), options: .strictEndDate)

        return try await withCheckedThrowingContinuation { continuation in
            let query = HKSampleQuery(
                sampleType: weightType,
                predicate: predicate,
                limit: 1,
                sortDescriptors: [NSSortDescriptor(key: HKSampleSortIdentifierStartDate, ascending: false)]
            ) { (samples, error) in
                if let error = error {
                    continuation.resume(throwing: error)
                    return
                }

                if let latestSample = samples?.first as? HKQuantitySample {
                    let weight = latestSample.quantity.doubleValue(for: .gramUnit(with: .kilo))
                    continuation.resume(returning: weight)
                } else {
                    continuation.resume(returning: nil)
                }
            }

            healthStore.execute(query)
        }
    }

    func saveBodyWeight(_ weight: Double, date: Date = Date()) async throws {
        guard isAuthorized else {
            throw HealthKitError.notAuthorized
        }

        guard let weightType = HKObjectType.quantityType(forIdentifier: .bodyMass) else {
            throw HealthKitError.dataTypeNotAvailable
        }

        let weightQuantity = HKQuantity(unit: .gramUnit(with: .kilo), doubleValue: weight)
        let sample = HKQuantitySample(type: weightType, quantity: weightQuantity, start: date, end: date)

        try await healthStore.save(sample)
    }

    // MARK: - Fitness Goals

    func setFitnessGoal(type: HKQuantityTypeIdentifier, value: Double, unit: HKUnit, for date: Date = Date()) async throws {
        guard isAuthorized else {
            throw HealthKitError.notAuthorized
        }

        guard let goalType = HKObjectType.quantityType(forIdentifier: type) else {
            throw HealthKitError.dataTypeNotAvailable
        }

        // Create a metadata entry for the fitness goal
        let goalQuantity = HKQuantity(unit: unit, doubleValue: value)
        let metadata = ["fitness_goal": true, "target_date": ISO8601DateFormatter().string(from: date)]

        // This would typically be stored in your app's database or user preferences
        // HealthKit doesn't have a direct "goals" API, so we track progress against the goals
        UserDefaults.standard.set(value, forKey: "fitness_goal_\(type.rawValue)")
        UserDefaults.standard.set(ISO8601DateFormatter().string(from: date), forKey: "fitness_goal_date_\(type.rawValue)")
    }

    func getFitnessProgress(type: HKQuantityTypeIdentifier, targetDate: Date) async throws -> FitnessProgress {
        guard isAuthorized else {
            throw HealthKitError.notAuthorized
        }

        let calendar = Calendar.current
        let startOfWeek = calendar.dateInterval(of: .weekOfYear, for: targetDate)?.start ?? targetDate

        // Fetch current progress
        let currentValue = try await getCurrentValue(for: type, from: startOfWeek, to: targetDate)
        let targetValue = UserDefaults.standard.double(forKey: "fitness_goal_\(type.rawValue)")

        return FitnessProgress(
            current: currentValue,
            target: targetValue,
            unit: unitForType(type),
            percentage: targetValue > 0 ? (currentValue / targetValue) * 100 : 0
        )
    }

    private func getCurrentValue(for type: HKQuantityTypeIdentifier, from startDate: Date, to endDate: Date) async throws -> Double {
        guard let quantityType = HKObjectType.quantityType(forIdentifier: type) else {
            throw HealthKitError.dataTypeNotAvailable
        }

        let predicate = HKQuery.predicateForSamples(withStart: startDate, end: endDate, options: .strictStartDate)

        return try await withCheckedThrowingContinuation { continuation in
            let query = HKStatisticsQuery(
                quantityType: quantityType,
                quantitySamplePredicate: predicate,
                options: .cumulativeSum
            ) { (_, statistics, error) in
                if let error = error {
                    continuation.resume(throwing: error)
                    return
                }

                let unit = unitForType(type)
                let value = statistics?.sumQuantity()?.doubleValue(for: unit) ?? 0
                continuation.resume(returning: value)
            }

            healthStore.execute(query)
        }
    }

    private func unitForType(_ type: HKQuantityTypeIdentifier) -> HKUnit {
        switch type {
        case .stepCount:
            return .count()
        case .activeEnergyBurned, .basalEnergyBurned:
            return .kilocalorie()
        case .distanceWalkingRunning:
            return .meterUnit(with: .kilo)
        case .appleExerciseTime:
            return .minute()
        case .heartRate:
            return .count().unitDivided(by: .minute())
        default:
            return .count()
        }
    }

    // MARK: - Real-time Monitoring

    func startHeartRateMonitoring() async throws -> AsyncStream<HKQuantity> {
        guard isAuthorized else {
            throw HealthKitError.notAuthorized
        }

        guard let heartRateType = HKObjectType.quantityType(forIdentifier: .heartRate) else {
            throw HealthKitError.dataTypeNotAvailable
        }

        return AsyncStream { continuation in
            let query = HKObserverQuery(sampleType: heartRateType, predicate: nil) { _, _, error in
                if let error = error {
                    continuation.finish()
                    return
                }

                Task {
                    do {
                        let samples = try await fetchHeartRateSamples(for: Date())
                        if let latestSample = samples.first {
                            continuation.yield(latestSample.quantity)
                        }
                    } catch {
                        continuation.finish()
                    }
                }
            }

            healthStore.execute(query)

            continuation.onTermination = { _ in
                self.healthStore.stop(query)
            }
        }
    }
}

// MARK: - Data Models

struct FitnessProgress {
    let current: Double
    let target: Double
    let unit: HKUnit
    let percentage: Double

    var isCompleted: Bool {
        return current >= target
    }

    var remaining: Double {
        return max(0, target - current)
    }

    var formattedCurrent: String {
        return "\(Int(current)) \(unit.unitString)"
    }

    var formattedTarget: String {
        return "\(Int(target)) \(unit.unitString)"
    }
}

struct WorkoutSummary {
    let date: Date
    let duration: TimeInterval
    let caloriesBurned: Double
    let type: HKWorkoutActivityType
    let distance: Double?

    var formattedDuration: String {
        let formatter = DateComponentsFormatter()
        formatter.allowedUnits = [.hour, .minute, .second]
        formatter.unitsStyle = .abbreviated
        return formatter.string(from: duration) ?? "0s"
    }

    var typeDescription: String {
        switch type {
        case .other:
            return "Fitness Training"
        case .functionalStrengthTraining:
            return "Strength Training"
        case .flexibility:
            return "Stretching"
        case .cardioWorkout:
            return "Cardio"
        default:
            return "Workout"
        }
    }
}

// MARK: - HealthKit Errors

enum HealthKitError: LocalizedError {
    case notAuthorized
    case dataTypeNotAvailable
    case workoutStartFailed(String)
    case dataAccessDenied
    case custom(String)

    var errorDescription: String? {
        switch self {
        case .notAuthorized:
            return "HealthKit access is not authorized"
        case .dataTypeNotAvailable:
            return "This health data type is not available"
        case .workoutStartFailed(let message):
            return "Failed to start workout: \(message)"
        case .dataAccessDenied:
            return "Access to health data was denied"
        case .custom(let message):
            return message
        }
    }
}

// MARK: - SwiftUI Integration

struct HealthKitDataView: View {
    @StateObject private var healthKitManager = HealthKitManager.shared
    @State private var todaySteps = 0
    @State private var todayCalories = 0.0
    @State private var currentWeight: Double?
    @State private var recentWorkouts: [WorkoutSummary] = []
    @State private var isLoading = false

    var body: some View {
        VStack(spacing: 20) {
            Text("Health & Fitness")
                .font(.title2)
                .fontWeight(.semibold)
                .foregroundColor(.white)

            if healthKitManager.isAuthorized {
                // Today's Stats
                VStack(spacing: 16) {
                    HealthStatCard(
                        title: "Steps Today",
                        value: "\(todaySteps)",
                        subtitle: "goal: 10,000",
                        icon: "figure.walk",
                        color: .blue
                    )

                    HealthStatCard(
                        title: "Active Calories",
                        value: "\(Int(todayCalories))",
                        subtitle: "kcal burned",
                        icon: "flame.fill",
                        color: .orange
                    )

                    if let weight = currentWeight {
                        HealthStatCard(
                            title: "Current Weight",
                            value: String(format: "%.1f", weight),
                            subtitle: "kg",
                            icon: "scalemass.fill",
                            color: .green
                        )
                    }
                }

                // Recent Workouts
                if !recentWorkouts.isEmpty {
                    VStack(alignment: .leading, spacing: 12) {
                        Text("Recent Workouts")
                            .font(.headline)
                            .foregroundColor(.white)

                        ForEach(recentWorkouts.prefix(3), id: \.date) { workout in
                            WorkoutCard(workout: workout)
                        }
                    }
                }
            } else {
                // Authorization prompt
                VStack(spacing: 16) {
                    Image(systemName: "heart.fill")
                        .font(.system(size: 48))
                        .foregroundColor(Color(hex: "D4AF37"))

                    Text("Connect HealthKit")
                        .font(.title3)
                        .fontWeight(.semibold)
                        .foregroundColor(.white)

                    Text("Track your fitness progress and sync workout data")
                        .font(.subheadline)
                        .foregroundColor(Color(hex: "F5DEB3").opacity(0.8))
                        .multilineTextAlignment(.center)

                    Button("Connect HealthKit") {
                        Task {
                            isLoading = true
                            if await healthKitManager.requestPermissions() {
                                await loadHealthData()
                            }
                            isLoading = false
                        }
                    }
                    .buttonStyle(LuxuryButtonStyle())
                    .disabled(isLoading)
                }
            }
        }
        .onAppear {
            if healthKitManager.isAuthorized {
                Task {
                    await loadHealthData()
                }
            }
        }
    }

    private func loadHealthData() async {
        async let steps = healthKitManager.fetchStepCount(for: Date())
        async let calories = healthKitManager.fetchActiveCalories(for: Date())
        async let weight = healthKitManager.fetchBodyWeight()
        async let workouts = healthKitManager.fetchWorkouts(from: Date().addingTimeInterval(-7 * 24 * 3600), to: Date())

        do {
            let (stepsResult, caloriesResult, weightResult, workoutsResult) = try await (steps, calories, weight, workouts)

            await MainActor.run {
                self.todaySteps = stepsResult
                self.todayCalories = caloriesResult
                self.currentWeight = weightResult
                self.recentWorkouts = workoutsResult.map { workout in
                    WorkoutSummary(
                        date: workout.startDate,
                        duration: workout.duration,
                        caloriesBurned: workout.totalEnergyBurned?.doubleValue(for: .kilocalorie()) ?? 0,
                        type: workout.workoutActivityType,
                        distance: workout.totalDistance?.doubleValue(for: .meter())
                    )
                }
            }
        } catch {
            print("Error loading health data: \(error)")
        }
    }
}

struct HealthStatCard: View {
    let title: String
    let value: String
    let subtitle: String
    let icon: String
    let color: Color

    var body: some View {
        HStack(spacing: 16) {
            Image(systemName: icon)
                .font(.system(size: 24))
                .foregroundColor(color)
                .frame(width: 40, height: 40)
                .background(
                    Circle()
                        .fill(color.opacity(0.2))
                )

            VStack(alignment: .leading, spacing: 4) {
                Text(title)
                    .font(.subheadline)
                    .foregroundColor(Color(hex: "F5DEB3").opacity(0.8))

                Text(value)
                    .font(.title2)
                    .fontWeight(.bold)
                    .foregroundColor(.white)

                Text(subtitle)
                    .font(.caption)
                    .foregroundColor(Color(hex: "F5DEB3").opacity(0.6))
            }

            Spacer()
        }
        .padding(16)
        .background(
            RoundedRectangle(cornerRadius: 12)
                .fill(Color(hex: "2d2d2d"))
                .overlay(
                    RoundedRectangle(cornerRadius: 12)
                        .stroke(color.opacity(0.3), lineWidth: 1)
                )
        )
    }
}

struct WorkoutCard: View {
    let workout: WorkoutSummary

    var body: some View {
        HStack(spacing: 16) {
            VStack(alignment: .leading, spacing: 4) {
                Text(workout.typeDescription)
                    .font(.subheadline)
                    .fontWeight(.medium)
                    .foregroundColor(.white)

                Text(workout.formattedDuration)
                    .font(.caption)
                    .foregroundColor(Color(hex: "F5DEB3").opacity(0.8))

                if workout.caloriesBurned > 0 {
                    Text("\(Int(workout.caloriesBurned)) kcal")
                        .font(.caption)
                        .foregroundColor(Color(hex: "D4AF37"))
                }
            }

            Spacer()

            Text(DateFormatter.shortTime.string(from: workout.date))
                .font(.caption)
                .foregroundColor(Color(hex: "F5DEB3").opacity(0.7))
        }
        .padding(12)
        .background(
            RoundedRectangle(cornerRadius: 10)
                .fill(Color(hex: "1a1a1a"))
        )
    }
}

struct LuxuryButtonStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .font(.headline)
            .foregroundColor(.white)
            .frame(maxWidth: .infinity)
            .frame(height: 56)
            .background(
                RoundedRectangle(cornerRadius: 28)
                    .fill(
                        LinearGradient(
                            colors: [Color(hex: "D4AF37"), Color(hex: "B8860B")],
                            startPoint: .leading,
                            endPoint: .trailing
                        )
                    )
                    .shadow(color: Color(hex: "D4AF37").opacity(0.3), radius: 10, x: 0, y: 5)
            )
            .scaleEffect(configuration.isPressed ? 0.95 : 1.0)
            .animation(.easeInOut(duration: 0.1), value: configuration.isPressed)
    }
}

extension DateFormatter {
    static let shortTime: DateFormatter = {
        let formatter = DateFormatter()
        formatter.timeStyle = .short
        return formatter
    }()
}