"use client"

import { useEffect, useState } from "react"
import axios from "axios"
import { useAuth } from "../../contexts/AuthContext"
import { useLocation } from "react-router-dom"

export default function ReservationPage() {
  const [hairstyles, setHairstyles] = useState([])
  const [barbershops, setBarbershops] = useState([])
  const [barbers, setBarbers] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeStep, setActiveStep] = useState(1)
  const [showSummary, setShowSummary] = useState(false)

  // Selections
  const [selectedHairstyle, setSelectedHairstyle] = useState(null)
  const [selectedBarbershop, setSelectedBarbershop] = useState(null)
  const [selectedBarber, setSelectedBarber] = useState(null)

  // Reservation details
  const [reservationDate, setReservationDate] = useState("")
  const [reservationTime, setReservationTime] = useState("")
  const [notes, setNotes] = useState("")

  // Error state
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  // Add these new state variables at the top of your component
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [paymentDetails, setPaymentDetails] = useState(null)

  // Auth
  const { userId } = useAuth() || { userId: 101 }

  // Routing
  const location = useLocation()

  // Extract faceShape, recommendedHairstyleNames, and selectedHairstyleName from state
  const { faceShape, recommendedHairstyleNames = [], selectedHairstyleName } = location.state || {}

  // 1) Fetch all haircuts + barbershops
  useEffect(() => {
    setLoading(true)
    const fetchData = async () => {
      try {
        const [haircutsRes, barbershopsRes] = await Promise.all([
          axios.get("http://localhost:8443/haircuts"),
          axios.get("http://localhost:8443/barbershops"),
        ])

        // Set hairstyles without sorting yet
        setHairstyles(haircutsRes.data)
        setBarbershops(barbershopsRes.data)
        setError("")
      } catch (err) {
        console.error("Error fetching data:", err)
        setError("Failed to load initial data. Please refresh the page.")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  // SOLUTION 1: Use a separate state variable for sorted hairstyles
  const [sortedHairstyles, setSortedHairstyles] = useState([])

  // Sort hairstyles when either hairstyles or recommendedHairstyleNames changes
  useEffect(() => {
    if (hairstyles.length > 0 && recommendedHairstyleNames.length > 0) {
      const sorted = [...hairstyles].sort((a, b) => {
        const aIsRecommended = recommendedHairstyleNames.includes(a.name)
        const bIsRecommended = recommendedHairstyleNames.includes(b.name)

        if (aIsRecommended && !bIsRecommended) return -1
        if (!aIsRecommended && bIsRecommended) return 1
        return 0
      })

      setSortedHairstyles(sorted)
    } else {
      setSortedHairstyles(hairstyles)
    }
  }, [hairstyles, recommendedHairstyleNames])

  // Then replace all instances of hairstyles with sortedHairstyles in your JSX rendering
  // For example:
  // {sortedHairstyles.filter((hairstyle) => recommendedHairstyleNames.includes(hairstyle.name)).map((hairstyle) => ...)}

  // SOLUTION 2: Use useMemo instead (alternative approach)
  // If you prefer not to add another state variable, you can use this instead of the useEffect above:
  /*
  const sortedHairstyles = useMemo(() => {
    if (hairstyles.length > 0 && recommendedHairstyleNames.length > 0) {
      return [...hairstyles].sort((a, b) => {
        const aIsRecommended = recommendedHairstyleNames.includes(a.name)
        const bIsRecommended = recommendedHairstyleNames.includes(b.name)

        if (aIsRecommended && !bIsRecommended) return -1
        if (!aIsRecommended && bIsRecommended) return 1
        return 0
      })
    }
    return hairstyles
  }, [hairstyles, recommendedHairstyleNames])
  */

  // 2) Pre-select the hairstyle clicked on the upload page
  useEffect(() => {
    if (hairstyles.length > 0 && selectedHairstyleName && !selectedHairstyle) {
      const matchingHairstyle = hairstyles.find((h) => h.name === selectedHairstyleName)
      if (matchingHairstyle) {
        setSelectedHairstyle(matchingHairstyle.id)
      }
    }
  }, [hairstyles, selectedHairstyle, selectedHairstyleName])

  // 3) When user selects a barbershop, fetch its barbers
  const handleSelectBarbershop = (shop) => {
    setSelectedBarbershop(shop)
    setSelectedBarber(null) // Reset
    setLoading(true)

    axios
      .get(`http://localhost:8443/barbers?shopId=${shop.id}`)
      .then((res) => {
        setBarbers(res.data)
        setError("")
      })
      .catch((err) => {
        console.error("Error fetching barbers:", err)
        setError("Failed to load barbers for this shop. Please try another shop or refresh the page.")
      })
      .finally(() => {
        setLoading(false)
      })
  }

  // 4) Submit reservation
  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")

    if (!selectedHairstyle || !selectedBarber || !reservationDate || !reservationTime) {
      setError("Please fill all required fields (hairstyle, barber, date, time).")
      return
    }

    try {
      setLoading(true)
      const chosenHairstyle = hairstyles.find((h) => h.id === selectedHairstyle)
      await axios.post("http://localhost:8443/reservation/create", {
        clientId: userId,
        barberId: selectedBarber.id,
        date: reservationDate,
        time: reservationTime,
        hairstyleChosen: chosenHairstyle.name,
        notes: notes,
      })
      setSuccess(true)
      window.scrollTo({ top: 0, behavior: "smooth" })
    } catch (err) {
      console.error("Failed to create reservation:", err)

      // Check if it's a payment required error (402)
      if (err.response && err.response.status === 402) {
        // Extract reservation details from the error response
        const { reservationId, price, message } = err.response.data
        setPaymentDetails({
          reservationId,
          price,
          message: message || "Payment required for this haircut",
        })
        setShowPaymentModal(true)
      } else {
        setError("Reservation creation failed. Please try again or contact support.")
      }
    } finally {
      setLoading(false)
    }
  }

  // Add this new function to handle payment confirmation
  const handlePaymentConfirmation = async () => {
    if (!paymentDetails || !paymentDetails.reservationId) return

    try {
      setLoading(true)
      // Make a POST request to the Stripe checkout endpoint
      const response = await axios.post(
        "http://localhost:8443/payment/stripe-checkout-reservation",
        null, // No request body needed
        {
          params: {
            reservationId: paymentDetails.reservationId,
            userId: userId,
          },
        },
      )

      // Redirect to the Stripe checkout URL
      if (response.data && response.data.sessionUrl) {
        window.location.href = response.data.sessionUrl
      } else {
        throw new Error("No checkout URL received from server")
      }
    } catch (error) {
      console.error("Payment redirection failed:", error)
      setError("Failed to process payment. Please try again.")
      setShowPaymentModal(false)
    } finally {
      setLoading(false)
    }
  }

  // Helper function to render star ratings
  const renderStars = (rating) => {
    return (
      <div className="flex items-center">
        {[...Array(5)].map((_, i) => (
          <svg
            key={i}
            className={`w-4 h-4 ${
              i < Math.floor(rating)
                ? "text-yellow-400"
                : i < rating
                  ? "text-yellow-400"
                  : "text-gray-300 dark:text-gray-600"
            }`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            {i < rating && i + 1 > rating ? (
              // Half star
              <path
                fillRule="evenodd"
                d="M10 15.934L4.618 19l1.04-6.067-4.376-4.264 6.041-.878L10 2l2.677 5.791 6.041.878-4.376 4.264L15.382 19 10 15.934z"
                clipRule="evenodd"
                fill="url(#half-star)"
              />
            ) : (
              <path
                fillRule="evenodd"
                d="M10 15.934L4.618 19l1.04-6.067-4.376-4.264 6.041-.878L10 2l2.677 5.791 6.041.878-4.376 4.264L15.382 19 10 15.934z"
                clipRule="evenodd"
              />
            )}
          </svg>
        ))}
        <span className="ml-1 text-sm text-gray-600 dark:text-gray-400">{rating.toFixed(1)}</span>
      </div>
    )
  }

  // Calculate barbershop rating based on its barbers
  const getBarbershopRating = (shopId) => {
    // This would normally come from your API, but for demo purposes:
    const ratings = {
      1: 4.7,
      2: 4.2,
      3: 4.9,
      4: 3.8,
      5: 4.5,
    }
    return ratings[shopId] || 4.0
  }

  // Get available time slots based on date
  const getAvailableTimeSlots = () => {
    // This would normally come from your API based on barber availability
    return [
      "09:00",
      "09:30",
      "10:00",
      "10:30",
      "11:00",
      "11:30",
      "13:00",
      "13:30",
      "14:00",
      "14:30",
      "15:00",
      "15:30",
      "16:00",
      "16:30",
      "17:00",
      "17:30",
    ]
  }

  // Handle next step
  const handleNextStep = () => {
    if (activeStep === 1 && !selectedHairstyle) {
      setError("Please select a hairstyle to continue")
      return
    }

    if (activeStep === 2 && !selectedBarbershop) {
      setError("Please select a barbershop to continue")
      return
    }

    if (activeStep === 3 && !selectedBarber) {
      setError("Please select a barber to continue")
      return
    }

    setError("")
    setActiveStep((prev) => prev + 1)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  // Handle previous step
  const handlePrevStep = () => {
    setActiveStep((prev) => prev - 1)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  // Handle review booking
  const handleReviewBooking = () => {
    if (!reservationDate || !reservationTime) {
      setError("Please select both date and time to continue")
      return
    }

    setError("")
    setShowSummary(true)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  // Get selected hairstyle details
  const getSelectedHairstyleDetails = () => {
    return hairstyles.find((h) => h.id === selectedHairstyle) || {}
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 pt-20 pb-12 px-4 flex items-center justify-center">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden">
          <div className="p-8 text-center">
            <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg
                className="w-10 h-10 text-green-600 dark:text-green-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Booking Confirmed!</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Your appointment has been successfully scheduled. Weve sent a confirmation to your email.
            </p>
            <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4 mb-6">
              <div className="flex justify-between mb-2">
                <span className="text-gray-600 dark:text-gray-400">Date:</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {new Date(reservationDate).toLocaleDateString("en-US", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="text-gray-600 dark:text-gray-400">Time:</span>
                <span className="font-medium text-gray-900 dark:text-white">{reservationTime}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Barber:</span>
                <span className="font-medium text-gray-900 dark:text-white">{selectedBarber?.name}</span>
              </div>
            </div>
            <div className="flex space-x-4">
              <button
                onClick={() => (window.location.href = "/")}
                className="flex-1 py-3 px-4 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-white rounded-lg font-medium transition-colors"
              >
                Go Home
              </button>
              <button
                onClick={() => (window.location.href = "/collection-list")}
                className="flex-1 py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors"
              >
                My Reservations
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 pt-20 pb-12 px-4">
      {loading && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-xl max-w-sm w-full">
            <div className="flex items-center justify-center mb-4">
              <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
            <p className="text-center text-gray-700 dark:text-gray-300">Loading your booking experience...</p>
          </div>
        </div>
      )}
      {/* Add this payment modal right after the loading overlay */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-xl max-w-md w-full animate-fade-in">
            <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-indigo-600 dark:text-indigo-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-2">Payment Required</h2>
            <p className="text-gray-600 dark:text-gray-400 text-center mb-4">
              {paymentDetails?.message || "Payment is required to complete your reservation."}
            </p>

            <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-lg mb-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-700 dark:text-gray-300">Haircut Price:</span>
                <span className="font-bold text-indigo-600 dark:text-indigo-400">
                  ${getSelectedHairstyleDetails().price || "0.00"}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-700 dark:text-gray-300">Reservation ID:</span>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {paymentDetails?.reservationId || "N/A"}
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={handlePaymentConfirmation}
                className="w-full py-3 px-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-medium rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
              >
                Proceed to Payment
              </button>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="w-full py-3 px-4 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 font-medium rounded-lg transition-colors duration-200"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-5xl mx-auto">
        {/* Progress Tracker */}
        <div className="mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4">
            <div className="flex items-center justify-between">
              <div className="hidden md:flex items-center w-full">
                {[1, 2, 3, 4].map((step) => (
                  <div key={step} className="flex items-center relative flex-1">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center font-bold z-10 transition-all ${
                        activeStep === step
                          ? "bg-indigo-600 text-white"
                          : activeStep > step
                            ? "bg-green-500 text-white"
                            : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                      }`}
                    >
                      {activeStep > step ? (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        step
                      )}
                    </div>
                    <div
                      className={`h-1 absolute left-0 top-5 w-full ${
                        activeStep > step ? "bg-green-500" : "bg-gray-200 dark:bg-gray-700"
                      }`}
                      style={{ width: "calc(100% - 2.5rem)", left: "2.5rem" }}
                    ></div>
                    <div className="absolute w-full text-center mt-12 text-xs font-medium text-gray-600 dark:text-gray-400">
                      {step === 1 && "Hairstyle"}
                      {step === 2 && "Barbershop"}
                      {step === 3 && "Barber"}
                      {step === 4 && "Schedule"}
                    </div>
                  </div>
                ))}
              </div>

              <div className="md:hidden w-full">
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Step {activeStep} of 4</span>
                  <span className="text-sm font-medium text-indigo-600 dark:text-indigo-400">
                    {activeStep === 1 && "Select Hairstyle"}
                    {activeStep === 2 && "Choose Barbershop"}
                    {activeStep === 3 && "Pick Barber"}
                    {activeStep === 4 && "Schedule Time"}
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                  <div
                    className="bg-indigo-600 h-2.5 rounded-full transition-all duration-300"
                    style={{ width: `${(activeStep / 4) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {showSummary ? (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden animate-fade-in">
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 h-24 relative">
              <div className="absolute inset-0 bg-pattern opacity-10"></div>
              <div className="absolute bottom-0 left-0 w-full h-16 bg-gradient-to-t from-white dark:from-gray-800 to-transparent"></div>
              <div className="absolute -bottom-10 left-8 w-20 h-20 bg-white dark:bg-gray-700 rounded-xl shadow-lg flex items-center justify-center">
                <svg
                  className="w-10 h-10 text-indigo-600 dark:text-indigo-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
                  />
                </svg>
              </div>
            </div>

            <div className="p-8 pt-16">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Review Your Booking</h1>
              <p className="text-gray-600 dark:text-gray-400 mb-8">Please confirm your appointment details below</p>

              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Hairstyle Summary */}
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                      <svg
                        className="w-5 h-5 mr-2 text-indigo-600 dark:text-indigo-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M14.121 14.121L19 19m-7-7l7-7m-7 7l-2.879 2.879M12 12L9.121 9.121m0 5.758a3 3 0 10-4.243-4.243 3 3 0 004.243 4.243z"
                        />
                      </svg>
                      Selected Hairstyle
                    </h3>
                    <div className="flex items-start">
                      <img
                        src={getSelectedHairstyleDetails().imageUrl || "/placeholder.svg?height=80&width=80"}
                        alt={getSelectedHairstyleDetails().name}
                        className="w-16 h-16 object-cover rounded-lg mr-3"
                      />
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {getSelectedHairstyleDetails().name}
                        </p>
                        <p className="text-indigo-600 dark:text-indigo-400 font-bold">
                          ${getSelectedHairstyleDetails().price}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {getSelectedHairstyleDetails().duration || "30"} min
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Barbershop Summary */}
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                      <svg
                        className="w-5 h-5 mr-2 text-indigo-600 dark:text-indigo-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                        />
                      </svg>
                      Selected Barbershop
                    </h3>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{selectedBarbershop?.name}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{selectedBarbershop?.address}</p>
                      <div className="mt-1">{renderStars(getBarbershopRating(selectedBarbershop?.id))}</div>
                    </div>
                  </div>
                </div>

                {/* Barber Summary */}
                <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                    <svg
                      className="w-5 h-5 mr-2 text-indigo-600 dark:text-indigo-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                    Selected Barber
                  </h3>
                  <div className="flex items-start">
                    <img
                      src={selectedBarber?.photo || "/placeholder.svg?height=80&width=80"}
                      alt={selectedBarber?.name}
                      className="w-16 h-16 object-cover rounded-lg mr-3"
                    />
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{selectedBarber?.name}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{selectedBarber?.specialty}</p>
                      <div className="mt-1">{renderStars(selectedBarber?.rating || 4.5)}</div>
                    </div>
                  </div>
                </div>

                {/* Date & Time Summary */}
                <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                    <svg
                      className="w-5 h-5 mr-2 text-indigo-600 dark:text-indigo-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    Appointment Time
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Date</p>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {new Date(reservationDate).toLocaleDateString("en-US", {
                          weekday: "long",
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Time</p>
                      <p className="font-medium text-gray-900 dark:text-white">{reservationTime}</p>
                    </div>
                  </div>
                </div>

                {/* Notes */}
                {notes && (
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                      <svg
                        className="w-5 h-5 mr-2 text-indigo-600 dark:text-indigo-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                        />
                      </svg>
                      Your Notes
                    </h3>
                    <p className="text-gray-700 dark:text-gray-300 italic">{notes}</p>
                  </div>
                )}

                {/* Price Summary */}
                <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-xl p-4 border border-indigo-100 dark:border-indigo-800">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Price Summary</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">{getSelectedHairstyleDetails().name}</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        ${getSelectedHairstyleDetails().price}
                      </span>
                    </div>
                    <div className="border-t border-gray-200 dark:border-gray-700 my-2 pt-2">
                      <div className="flex justify-between font-bold">
                        <span className="text-gray-900 dark:text-white">Total</span>
                        <span className="text-indigo-600 dark:text-indigo-400">
                          ${getSelectedHairstyleDetails().price}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-4">
                  <button
                    type="button"
                    onClick={() => setShowSummary(false)}
                    className="py-3 px-6 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-white rounded-xl font-medium transition-colors"
                  >
                    Edit Booking
                  </button>
                  <button
                    type="button"
                    onClick={handleSubmit}
                    className="py-3 px-6 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-300 flex-1"
                  >
                    Confirm Booking
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 h-24 relative">
              <div className="absolute inset-0 bg-pattern opacity-10"></div>
              <div className="absolute bottom-0 left-0 w-full h-16 bg-gradient-to-t from-white dark:from-gray-800 to-transparent"></div>
              <div className="absolute -bottom-10 left-8 w-20 h-20 bg-white dark:bg-gray-700 rounded-xl shadow-lg flex items-center justify-center">
                <svg
                  className="w-10 h-10 text-indigo-600 dark:text-indigo-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
            </div>

            <div className="p-8 pt-16">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                {activeStep === 1 && "Choose Your Perfect Hairstyle"}
                {activeStep === 2 && "Select a Barbershop"}
                {activeStep === 3 && "Pick Your Favorite Barber"}
                {activeStep === 4 && "Schedule Your Appointment"}
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mb-8">
                {activeStep === 1 && "Select a style that matches your face shape and personal preference"}
                {activeStep === 2 && "Choose from our network of premium barbershops"}
                {activeStep === 3 && `Select a professional at ${selectedBarbershop?.name || "our barbershop"}`}
                {activeStep === 4 && "Pick a convenient date and time for your appointment"}
              </p>

              {error && (
                <div className="mb-8 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded-xl flex items-center">
                  <svg className="w-5 h-5 mr-2 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span>{error}</span>
                </div>
              )}

              <form className="space-y-8">
                {/* STEP 1: HAIRSTYLES */}
                {activeStep === 1 && (
                  <div className="space-y-6 animate-fade-in">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
                        <svg
                          className="w-6 h-6 mr-2 text-indigo-600 dark:text-indigo-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M14.121 14.121L19 19m-7-7l7-7m-7 7l-2.879 2.879M12 12L9.121 9.121m0 5.758a3 3 0 10-4.243-4.243 3 3 0 004.243 4.243z"
                          />
                        </svg>
                        Browse Hairstyles
                      </h3>
                      {faceShape && (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300">
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M13 10V3L4 14h7v7l9-11h-7z"
                            />
                          </svg>
                          Recommended for {faceShape} face
                        </span>
                      )}
                    </div>

                    {/* Filter options */}
                    <div className="flex flex-wrap gap-2 mb-4">
                      <button
                        type="button"
                        className="px-4 py-2 bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300 rounded-full text-sm font-medium"
                      >
                        All Styles
                      </button>
                      <button
                        type="button"
                        className="px-4 py-2 bg-gray-100 hover:bg-indigo-100 text-gray-800 hover:text-indigo-800 dark:bg-gray-700 dark:hover:bg-indigo-900/30 dark:text-gray-300 dark:hover:text-indigo-300 rounded-full text-sm font-medium transition-colors"
                      >
                        Recommended
                      </button>
                      <button
                        type="button"
                        className="px-4 py-2 bg-gray-100 hover:bg-indigo-100 text-gray-800 hover:text-indigo-800 dark:bg-gray-700 dark:hover:bg-indigo-900/30 dark:text-gray-300 dark:hover:text-indigo-300 rounded-full text-sm font-medium transition-colors"
                      >
                        Popular
                      </button>
                      <button
                        type="button"
                        className="px-4 py-2 bg-gray-100 hover:bg-indigo-100 text-gray-800 hover:text-indigo-800 dark:bg-gray-700 dark:hover:bg-indigo-900/30 dark:text-gray-300 dark:hover:text-indigo-300 rounded-full text-sm font-medium transition-colors"
                      >
                        Short
                      </button>
                      <button
                        type="button"
                        className="px-4 py-2 bg-gray-100 hover:bg-indigo-100 text-gray-800 hover:text-indigo-800 dark:bg-gray-700 dark:hover:bg-indigo-900/30 dark:text-gray-300 dark:hover:text-indigo-300 rounded-full text-sm font-medium transition-colors"
                      >
                        Medium
                      </button>
                      <button
                        type="button"
                        className="px-4 py-2 bg-gray-100 hover:bg-indigo-100 text-gray-800 hover:text-indigo-800 dark:bg-gray-700 dark:hover:bg-indigo-900/30 dark:text-gray-300 dark:hover:text-indigo-300 rounded-full text-sm font-medium transition-colors"
                      >
                        Long
                      </button>
                    </div>

                    {/* Recommended Hairstyles Section */}
                    {recommendedHairstyleNames.length > 0 && (
                      <div className="mb-8">
                        <div className="flex items-center mb-4">
                          <div className="w-8 h-8 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center mr-2">
                            <svg
                              className="w-4 h-4 text-yellow-600 dark:text-yellow-400"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M13 10V3L4 14h7v7l9-11h-7z"
                              />
                            </svg>
                          </div>
                          <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                            Recommended for Your Face Shape
                          </h4>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                          {sortedHairstyles
                            .filter((hairstyle) => recommendedHairstyleNames.includes(hairstyle.name))
                            .map((hairstyle) => {
                              const isSelected = selectedHairstyle === hairstyle.id

                              return (
                                <div
                                  key={hairstyle.id}
                                  onClick={() => setSelectedHairstyle(hairstyle.id)}
                                  className={`relative group cursor-pointer rounded-xl overflow-hidden shadow-md transition-all duration-300 transform hover:-translate-y-1 hover:shadow-lg ${
                                    isSelected
                                      ? "ring-2 ring-indigo-500 scale-105"
                                      : "ring-1 ring-yellow-300 dark:ring-yellow-700"
                                  }`}
                                >
                                  <div className="aspect-w-1 aspect-h-1">
                                    <img
                                      src={hairstyle.imageUrl || "/placeholder.svg?height=200&width=200"}
                                      alt={hairstyle.name}
                                      className="w-full h-40 object-cover"
                                    />
                                  </div>

                                  <div className="absolute top-2 right-2 bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-1 rounded-full">
                                    Recommended
                                  </div>

                                  <div className="p-3 bg-white dark:bg-gray-700">
                                    <p className="font-medium text-gray-900 dark:text-white">{hairstyle.name}</p>
                                    <div className="flex justify-between items-center mt-1">
                                      <p className="text-indigo-600 dark:text-indigo-400 font-bold">
                                        ${hairstyle.price}
                                      </p>
                                      <div className="text-xs text-gray-500 dark:text-gray-400">
                                        {hairstyle.duration || "30"} min
                                      </div>
                                    </div>
                                  </div>

                                  {isSelected && (
                                    <div className="absolute inset-0 bg-indigo-600 bg-opacity-20 dark:bg-opacity-40 flex items-center justify-center backdrop-blur-sm">
                                      <div className="bg-white dark:bg-gray-800 rounded-full p-2 shadow-lg">
                                        <svg
                                          className="w-6 h-6 text-indigo-600 dark:text-indigo-400"
                                          fill="none"
                                          stroke="currentColor"
                                          viewBox="0 0 24 24"
                                        >
                                          <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M5 13l4 4L19 7"
                                          />
                                        </svg>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )
                            })}
                        </div>
                      </div>
                    )}

                    {/* Other Hairstyles Section */}
                    <div>
                      <div className="flex items-center mb-4">
                        <div className="w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mr-2">
                          <svg
                            className="w-4 h-4 text-gray-600 dark:text-gray-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M14.121 14.121L19 19m-7-7l7-7m-7 7l-2.879 2.879M12 12L9.121 9.121m0 5.758a3 3 0 10-4.243-4.243 3 3 0 004.243 4.243z"
                            />
                          </svg>
                        </div>
                        <h4 className="text-lg font-semibold text-gray-900 dark:text-white">All Hairstyles</h4>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        {sortedHairstyles
                          .filter((hairstyle) => !recommendedHairstyleNames.includes(hairstyle.name))
                          .map((hairstyle) => {
                            const isSelected = selectedHairstyle === hairstyle.id

                            return (
                              <div
                                key={hairstyle.id}
                                onClick={() => setSelectedHairstyle(hairstyle.id)}
                                className={`relative group cursor-pointer rounded-xl overflow-hidden shadow-md transition-all duration-300 transform hover:-translate-y-1 hover:shadow-lg ${
                                  isSelected ? "ring-2 ring-indigo-500 scale-105" : ""
                                }`}
                              >
                                <div className="aspect-w-1 aspect-h-1">
                                  <img
                                    src={hairstyle.imageUrl || "/placeholder.svg?height=200&width=200"}
                                    alt={hairstyle.name}
                                    className="w-full h-40 object-cover"
                                  />
                                </div>

                                <div className="p-3 bg-white dark:bg-gray-700">
                                  <p className="font-medium text-gray-900 dark:text-white">{hairstyle.name}</p>
                                  <div className="flex justify-between items-center mt-1">
                                    <p className="text-indigo-600 dark:text-indigo-400 font-bold">${hairstyle.price}</p>
                                    <div className="text-xs text-gray-500 dark:text-gray-400">
                                      {hairstyle.duration || "30"} min
                                    </div>
                                  </div>
                                </div>

                                {isSelected && (
                                  <div className="absolute inset-0 bg-indigo-600 bg-opacity-20 dark:bg-opacity-40 flex items-center justify-center backdrop-blur-sm">
                                    <div className="bg-white dark:bg-gray-800 rounded-full p-2 shadow-lg">
                                      <svg
                                        className="w-6 h-6 text-indigo-600 dark:text-indigo-400"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth={2}
                                          d="M5 13l4 4L19 7"
                                        />
                                      </svg>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )
                          })}
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 2: BARBERSHOPS */}
                {activeStep === 2 && (
                  <div className="space-y-6 animate-fade-in">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
                      <svg
                        className="w-6 h-6 mr-2 text-indigo-600 dark:text-indigo-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                        />
                      </svg>
                      Select a Barbershop
                    </h3>

                    {/* Search and filter */}
                    <div className="flex flex-col md:flex-row gap-4 mb-4">
                      <div className="relative flex-1">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                            />
                          </svg>
                        </div>
                        <input
                          type="text"
                          placeholder="Search by location or barbershop name"
                          className="pl-10 pr-4 py-2 w-full border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                      </div>
                      <select className="py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                        <option>Sort by: Rating</option>
                        <option>Sort by: Distance</option>
                        <option>Sort by: Price</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {barbershops.map((shop) => {
                        const shopRating = getBarbershopRating(shop.id)
                        return (
                          <div
                            key={shop.id}
                            className={`relative p-4 rounded-xl cursor-pointer transition-all duration-300 hover:shadow-md ${
                              selectedBarbershop?.id === shop.id
                                ? "bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-800 shadow-md"
                                : "bg-white dark:bg-gray-700 border border-gray-100 dark:border-gray-600"
                            }`}
                            onClick={() => handleSelectBarbershop(shop)}
                          >
                            <div className="flex items-start">
                              <div className="flex-shrink-0 h-16 w-16 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg flex items-center justify-center mr-4">
                                <svg
                                  className="h-8 w-8 text-indigo-600 dark:text-indigo-400"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                                  />
                                </svg>
                              </div>
                              <div className="flex-1">
                                <h4 className="font-bold text-lg text-gray-900 dark:text-white">{shop.name}</h4>
                                <p className="text-gray-600 dark:text-gray-400 text-sm mb-1">{shop.address}</p>
                                {renderStars(shopRating)}
                                <div className="mt-2 flex items-center text-xs text-gray-500 dark:text-gray-400">
                                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                    />
                                  </svg>
                                  <span>{shop.openHours || "9:00 AM - 7:00 PM"}</span>
                                </div>
                              </div>
                              {selectedBarbershop?.id === shop.id && (
                                <div className="absolute top-2 right-2 bg-indigo-100 dark:bg-indigo-900/50 p-1 rounded-full">
                                  <svg
                                    className="w-5 h-5 text-indigo-600 dark:text-indigo-400"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M5 13l4 4L19 7"
                                    />
                                  </svg>
                                </div>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* STEP 3: BARBERS */}
                {activeStep === 3 && (
                  <div className="space-y-6 animate-fade-in">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
                      <svg
                        className="w-6 h-6 mr-2 text-indigo-600 dark:text-indigo-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                        />
                      </svg>
                      Select a Barber at {selectedBarbershop?.name}
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {barbers.map((barber) => {
                        // Assign a random rating between 3.5 and 5.0 for demo purposes
                        const barberRating = barber.rating || 3.5 + Math.random() * 1.5

                        return (
                          <div
                            key={barber.id}
                            onClick={() => setSelectedBarber(barber)}
                            className={`relative rounded-xl overflow-hidden transition-all duration-300 transform hover:-translate-y-1 cursor-pointer ${
                              selectedBarber?.id === barber.id
                                ? "ring-2 ring-indigo-500 shadow-lg scale-105"
                                : "bg-white dark:bg-gray-700 shadow-md"
                            }`}
                          >
                            <div className="relative">
                              <img
                                src={barber.photo || "/placeholder.svg?height=200&width=200"}
                                alt={barber.name}
                                className="w-full h-48 object-cover"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                              <div className="absolute bottom-0 left-0 right-0 p-4">
                                <div className="flex justify-between items-end">
                                  <div>
                                    <h4 className="font-bold text-white text-lg">{barber.name}</h4>
                                    <p className="text-white/80 text-sm">{barber.specialty}</p>
                                  </div>
                                  <div className="bg-white/90 dark:bg-gray-800/90 rounded-lg px-2 py-1">
                                    {renderStars(barberRating)}
                                  </div>
                                </div>
                              </div>
                            </div>

                            <div className="p-4">
                              <div className="flex items-center text-sm text-gray-600 dark:text-gray-400 mb-2">
                                <svg
                                  className="w-4 h-4 mr-1 text-indigo-500 dark:text-indigo-400"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                                  />
                                </svg>
                                <span>Available today</span>
                              </div>
                              <div className="flex flex-wrap gap-1">
                                {barber.skills?.map((skill, index) => (
                                  <span
                                    key={index}
                                    className="inline-block px-2 py-1 text-xs rounded-full bg-gray-100 dark:bg-gray-600 text-gray-800 dark:text-gray-200"
                                  >
                                    {skill}
                                  </span>
                                )) || (
                                  <>
                                    <span className="inline-block px-2 py-1 text-xs rounded-full bg-gray-100 dark:bg-gray-600 text-gray-800 dark:text-gray-200">
                                      Fades
                                    </span>
                                    <span className="inline-block px-2 py-1 text-xs rounded-full bg-gray-100 dark:bg-gray-600 text-gray-800 dark:text-gray-200">
                                      Classic Cuts
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>

                            {selectedBarber?.id === barber.id && (
                              <div className="absolute top-2 right-2 bg-indigo-600 text-white p-1 rounded-full shadow-lg">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M5 13l4 4L19 7"
                                  />
                                </svg>
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* STEP 4: DATE & TIME */}
                {activeStep === 4 && (
                  <div className="space-y-6 animate-fade-in">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center mb-4">
                      <svg
                        className="w-6 h-6 mr-2 text-indigo-600 dark:text-indigo-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      Choose Date & Time
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      {/* Calendar */}
                      <div className="bg-white dark:bg-gray-700 rounded-xl shadow-md p-4">
                        <h4 className="font-medium text-gray-900 dark:text-white mb-4">Select Date</h4>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <svg
                              className="h-5 w-5 text-gray-400"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                              />
                            </svg>
                          </div>
                          <input
                            type="date"
                            className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
                            value={reservationDate}
                            onChange={(e) => setReservationDate(e.target.value)}
                            min={new Date().toISOString().split("T")[0]}
                            required
                          />
                        </div>

                        <div className="mt-4">
                          <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Quick Select</h5>
                          <div className="grid grid-cols-4 gap-2">
                            {[0, 1, 2, 3, 4, 5, 6].map((dayOffset) => {
                              const date = new Date()
                              date.setDate(date.getDate() + dayOffset)
                              const dateString = date.toISOString().split("T")[0]
                              const isSelected = dateString === reservationDate

                              return (
                                <button
                                  key={dayOffset}
                                  type="button"
                                  onClick={() => setReservationDate(dateString)}
                                  className={`p-2 rounded-lg text-center text-sm transition-colors ${
                                    isSelected
                                      ? "bg-indigo-600 text-white"
                                      : "bg-gray-100 dark:bg-gray-600 text-gray-800 dark:text-gray-200 hover:bg-indigo-100 dark:hover:bg-indigo-900/30"
                                  }`}
                                >
                                  <div className="font-medium">
                                    {date.toLocaleDateString("en-US", { weekday: "short" })}
                                  </div>
                                  <div className={`${isSelected ? "text-white" : "text-gray-600 dark:text-gray-300"}`}>
                                    {date.getDate()}
                                  </div>
                                </button>
                              )
                            })}
                          </div>
                        </div>
                      </div>

                      {/* Time slots */}
                      <div className="bg-white dark:bg-gray-700 rounded-xl shadow-md p-4">
                        <h4 className="font-medium text-gray-900 dark:text-white mb-4">Select Time</h4>

                        {!reservationDate ? (
                          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                            Please select a date first
                          </div>
                        ) : (
                          <>
                            <div className="grid grid-cols-3 gap-2">
                              {getAvailableTimeSlots().map((time) => {
                                const isSelected = time === reservationTime

                                return (
                                  <button
                                    key={time}
                                    type="button"
                                    onClick={() => setReservationTime(time)}
                                    className={`p-3 rounded-lg text-center transition-colors ${
                                      isSelected
                                        ? "bg-indigo-600 text-white"
                                        : "bg-gray-100 dark:bg-gray-600 text-gray-800 dark:text-gray-200 hover:bg-indigo-100 dark:hover:bg-indigo-900/30"
                                    }`}
                                  >
                                    {time}
                                  </button>
                                )
                              })}
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Additional notes */}
                    <div className="bg-white dark:bg-gray-700 rounded-xl shadow-md p-4">
                      <h4 className="font-medium text-gray-900 dark:text-white mb-2">Additional Notes (Optional)</h4>
                      <textarea
                        rows={3}
                        placeholder="Any special requests or information for your barber..."
                        className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                      ></textarea>
                    </div>
                  </div>
                )}

                {/* Navigation buttons */}
                <div className="flex justify-between pt-6">
                  {activeStep > 1 ? (
                    <button
                      type="button"
                      onClick={handlePrevStep}
                      className="py-3 px-6 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-white rounded-xl font-medium transition-colors flex items-center"
                    >
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                      Back
                    </button>
                  ) : (
                    <div></div>
                  )}

                  {activeStep < 4 ? (
                    <button
                      type="button"
                      onClick={handleNextStep}
                      className="py-3 px-6 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition-colors flex items-center"
                    >
                      Continue
                      <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleReviewBooking}
                      className="py-3 px-6 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-300"
                    >
                      Review Booking
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

