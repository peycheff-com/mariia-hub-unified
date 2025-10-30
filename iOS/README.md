# Mariia Hub iOS App
# Luxury Beauty & Fitness Booking Platform

## Overview
Premium iOS booking application for beauty and fitness services in Warsaw, featuring luxury design, Apple ecosystem integration, and seamless sync with the existing Supabase backend.

## Key Features
- SwiftUI-based luxury interface with Cocoa/Champagne design
- 4-step booking wizard optimized for iOS
- Apple Pay integration with biometric authentication
- HealthKit integration for fitness progress tracking
- Apple Watch companion app
- Push notifications with rich media
- Spotlight search integration
- Siri shortcuts for booking
- Calendar integration
- Offline support with Core Data

## Architecture
- MVVM pattern with SwiftUI + Combine
- Supabase Swift SDK for backend integration
- Core Data for offline storage
- Authentication with biometrics
- Payment processing via Apple Pay + Stripe SDK

## Technical Requirements
- iOS 15.0+ target
- Xcode 14.0+
- Swift 5.7+
- SwiftUI 4.0+

## Project Structure
```
MariiaHub/
├── App/
├── Core/
├── Features/
├── Services/
├── Resources/
└── WatchApp/
```