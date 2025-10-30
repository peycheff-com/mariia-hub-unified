package com.mariaborysevych.beautyfitness.auto

import android.car.Car
import android.car.app.CarAppActivity
import androidx.car.app.CarContext
import androidx.car.app.Screen
import androidx.car.app.ScreenManager
import androidx.car.app.validation.HostValidator
import com.mariaborysevych.beautyfitness.R
import dagger.hilt.android.AndroidEntryPoint
import javax.inject.Inject

@AndroidEntryPoint
class AndroidAutoApp : CarAppActivity() {

    @Inject
    lateinit var carAppService: MariiaHubCarAppService

    override fun onCreate(savedInstanceState: android.os.Bundle?) {
        super.onCreate(savedInstanceState)

        // Initialize car app service
        val car = Car.createCar(this)
        val carContext = CarContext.createCarContext(this, car)

        // Set up initial screen
        val screenManager = carContext.getCarService(ScreenManager::class.java)
        screenManager.push(BookingListScreen(carContext))
    }

    override fun getHostValidator(): HostValidator {
        return HostValidator.ALLOW_ALL_HOSTS_VALIDATOR
    }
}

class MariiaHubCarAppService : androidx.car.app.CarAppService() {

    override fun createHostValidator(): HostValidator {
        return if (BuildConfig.DEBUG) {
            HostValidator.ALLOW_ALL_HOSTS_VALIDATOR
        } else {
            HostValidator.createAllowlistHostValidator(
                listOf("com.google.android.projection.gearhead")
            )
        }
    }

    override fun onCreateScreen(intent: Intent): Screen {
        return BookingListScreen(carContext)
    }
}

class BookingListScreen(carContext: CarContext) : Screen(carContext) {

    private val bookingRepository: BookingRepository by lazy {
        // Inject repository
    }

    override fun onGetTemplate(): Template {
        return ListTemplate.Builder()
            .setTitle("Your Appointments")
            .setSingleList(HeaderListBuilder()
                .setHeader(Header.Builder()
                    .setTitle("Upcoming Bookings")
                    .setStartHeaderIcon(CarIcon.Builder(IconCompat.createWithResource(carContext, R.drawable.ic_spa)).build())
                    .build())
                .build())
            .setHeaderAction(Action.Builder()
                .setTitle("Refresh")
                .setIcon(CarIcon.Builder(IconCompat.createWithResource(carContext, R.drawable.ic_refresh)).build())
                .setOnClickListener { loadBookings() }
                .build())
            .build()
    }

    private fun loadBookings() {
        // Load bookings from repository
        invalidate()
    }
}

class BookingDetailScreen(
    carContext: CarContext,
    private val bookingId: String
) : Screen(carContext) {

    override fun onGetTemplate(): Template {
        return PlaceListMapTemplate.Builder()
            .setTitle("Appointment Details")
            .setHeader(ActionStrip.Builder()
                .addAction(Action.Builder()
                    .setTitle("Navigate")
                    .setIcon(CarIcon.Builder(IconCompat.createWithResource(carContext, R.drawable.ic_navigation)).build())
                    .setOnClickListener { navigateToLocation() }
                    .build())
                .addAction(Action.Builder()
                    .setTitle("Call")
                    .setIcon(CarIcon.Builder(IconCompat.createWithResource(carContext, R.drawable.ic_call)).build())
                    .setOnClickListener { callLocation() }
                    .build())
                .build())
            .build()
    }

    private fun navigateToLocation() {
        // Open navigation app with studio location
    }

    private fun callLocation() {
        // Initiate phone call to studio
    }
}