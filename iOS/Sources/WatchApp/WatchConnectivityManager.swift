import Foundation
import WatchConnectivity
import Combine

class WatchConnectivityManager: NSObject, ObservableObject {
    static let shared = WatchConnectivityManager()

    @Published var isReachable = false
    @Published var isPaired = false
    @Published var isActivated = false
    @Published var syncStatus: WatchSyncStatus = .disconnected

    private var session: WCSession?
    private var cancellables = Set<AnyCancellable>()

    enum WatchSyncStatus {
        case disconnected
        case connecting
        case connected
        case syncing
        case error(String)
    }

    private override init() {
        super.init()
        setupSession()
    }

    private func setupSession() {
        if WCSession.isSupported() {
            session = WCSession.default
            session?.delegate = self
        }
    }

    @MainActor
    func activateSession() async {
        guard let session = session, !session.isActivated else { return }

        syncStatus = .connecting
        session.activate()
    }

    func sendMessage<T: Codable>(message: T, replyHandler: (([String: Any]) -> Void)? = nil) {
        guard let session = session, session.isReachable else {
            print("Watch not reachable")
            return
        }

        do {
            let data = try JSONEncoder().encode(message)
            let dict = try JSONSerialization.jsonObject(with: data) as? [String: Any] ?? [:]

            session.sendMessage(dict, replyHandler: replyHandler) { error in
                print("Failed to send message: \(error)")
            }
        } catch {
            print("Failed to encode message: \(error)")
        }
    }

    func sendUserInfo<T: Codable>(_ userInfo: T) {
        guard let session = session else { return }

        do {
            let data = try JSONEncoder().encode(userInfo)
            let dict = try JSONSerialization.jsonObject(with: data) as? [String: Any] ?? [:]

            session.transferUserInfo(dict)
        } catch {
            print("Failed to send user info: \(error)")
        }
    }

    func updateApplicationContext<T: Codable>(_ context: T) {
        guard let session = session else { return }

        do {
            let data = try JSONEncoder().encode(context)
            let dict = try JSONSerialization.jsonObject(with: data) as? [String: Any] ?? [:]

            try session.updateApplicationContext(dict)
        } catch {
            print("Failed to update application context: \(error)")
        }
    }

    @MainActor
    func syncData() async {
        guard let session = session, session.isReachable else { return }

        syncStatus = .syncing

        // Request latest data from phone
        let message = [
            "type": "sync_request",
            "timestamp": Date().timeIntervalSince1970
        ] as [String: Any]

        session.sendMessage(message) { [weak self] response in
            DispatchQueue.main.async {
                self?.handleSyncResponse(response)
            }
        } errorHandler: { [weak self] error in
            DispatchQueue.main.async {
                self?.syncStatus = .error(error.localizedDescription)
            }
        }
    }

    private func handleSyncResponse(_ response: [String: Any]) {
        // Handle sync response from phone
        if let appointmentsData = response["appointments"] as? [[String: Any]] {
            NotificationCenter.default.post(name: .appointmentsDidSync, object: appointmentsData)
        }

        if let healthData = response["health"] as? [String: Any] {
            NotificationCenter.default.post(name: .healthDidSync, object: healthData)
        }

        syncStatus = .connected
    }

    func triggerQuickAction(_ action: QuickActionType) {
        let message = [
            "type": "quick_action",
            "action": action.rawValue,
            "timestamp": Date().timeIntervalSince1970
        ] as [String: Any]

        sendMessage(message: message)
    }

    func logWatchActivity(_ activity: WatchActivity) {
        let message = [
            "type": "watch_activity",
            "activity": activity.toDictionary(),
            "timestamp": Date().timeIntervalSince1970
        ] as [String: Any]

        sendMessage(message: message)
    }
}

// MARK: - WCSessionDelegate

extension WatchConnectivityManager: WCSessionDelegate {
    func session(_ session: WCSession, activationDidCompleteWith activationState: WCSessionActivationState, error: Error?) {
        DispatchQueue.main.async {
            self.isActivated = activationState == .activated
            self.isPaired = session.isPaired
            self.isReachable = session.isReachable

            switch activationState {
            case .activated:
                self.syncStatus = .connected
            case .inactive:
                self.syncStatus = .disconnected
            case .notActivated:
                self.syncStatus = .disconnected
            @unknown default:
                self.syncStatus = .disconnected
            }
        }
    }

    func sessionReachabilityDidChange(_ session: WCSession) {
        DispatchQueue.main.async {
            self.isReachable = session.isReachable
        }
    }

    func session(_ session: WCSession, didReceiveMessage message: [String: Any]) {
        handleMessage(message)
    }

    func session(_ session: WCSession, didReceiveMessage message: [String: Any], replyHandler: @escaping ([String: Any]) -> Void) {
        handleMessage(message, replyHandler: replyHandler)
    }

    func session(_ session: WCSession, didReceiveApplicationContext applicationContext: [String: Any]) {
        handleApplicationContext(applicationContext)
    }

    func session(_ session: WCSession, didReceiveUserInfo userInfo: [String: Any]) {
        handleUserInfo(userInfo)
    }

    private func handleMessage(_ message: [String: Any], replyHandler: (([String: Any]) -> Void)? = nil) {
        guard let type = message["type"] as? String else { return }

        switch type {
        case "appointment_update":
            NotificationCenter.default.post(name: .appointmentDidUpdate, object: message)
        case "health_update":
            NotificationCenter.default.post(name: .healthDidUpdate, object: message)
        case "notification":
            NotificationCenter.default.post(name: .notificationReceived, object: message)
        case "sync_response":
            handleSyncResponse(message)
        default:
            break
        }

        // Send reply if handler provided
        replyHandler?(["status": "received"])
    }

    private func handleApplicationContext(_ context: [String: Any]) {
        NotificationCenter.default.post(name: .applicationContextDidUpdate, object: context)
    }

    private func handleUserInfo(_ userInfo: [String: Any]) {
        NotificationCenter.default.post(name: .userInfoDidUpdate, object: userInfo)
    }
}

// MARK: - Data Models

enum QuickActionType: String, CaseIterable {
    case quickBook = "quick_book"
    case callSalon = "call_salon"
    case emergency = "emergency"
    case workout = "start_workout"
    case meditation = "start_meditation"
}

struct WatchActivity: Codable {
    let id: String
    let type: String
    let timestamp: Date
    let duration: TimeInterval?
    let metadata: [String: Any]

    func toDictionary() -> [String: Any] {
        var dict: [String: Any] = [
            "id": id,
            "type": type,
            "timestamp": timestamp.timeIntervalSince1970
        ]

        if let duration = duration {
            dict["duration"] = duration
        }

        dict["metadata"] = metadata
        return dict
    }
}

// MARK: - Notification Names

extension Notification.Name {
    static let appointmentsDidSync = Notification.Name("appointmentsDidSync")
    static let healthDidSync = Notification.Name("healthDidSync")
    static let appointmentDidUpdate = Notification.Name("appointmentDidUpdate")
    static let healthDidUpdate = Notification.Name("healthDidUpdate")
    static let notificationReceived = Notification.Name("notificationReceived")
    static let applicationContextDidUpdate = Notification.Name("applicationContextDidUpdate")
    static let userInfoDidUpdate = Notification.Name("userInfoDidUpdate")
}