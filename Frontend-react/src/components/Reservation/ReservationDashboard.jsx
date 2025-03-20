"use client"

import { useState, useEffect, useRef ,useCallback} from "react"
import { useAuth } from "../../contexts/AuthContext"
import {
  Calendar,
  Clock,
  User,
  MapPin,
  Scissors,
  CheckCircle,
  XCircle,
  AlertCircle,
  Filter,
  ChevronDown,
  ChevronUp,
  CalendarIcon,
  Search,
  Star,
} from "lucide-react"
import { format, parseISO, isAfter, isBefore, isToday, addDays } from "date-fns"
import axios from "axios"

export default function ReservationsDashboard() {
  // Auth context to get user info
  const { userId, role } = useAuth()

  // State
  const [reservations, setReservations] = useState([])
  const [filteredReservations, setFilteredReservations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [activeTab, setActiveTab] = useState("upcoming")
  const [selectedReservation, setSelectedReservation] = useState(null)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [statusFilter, setStatusFilter] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [dateRange, setDateRange] = useState("all")
  const [expandedCards, setExpandedCards] = useState([])

  // Rating state
  const [ratingOpen, setRatingOpen] = useState(false)
  const [ratingValue, setRatingValue] = useState(0)
  const [ratingComment, setRatingComment] = useState("")
  const [ratingBarberId, setRatingBarberId] = useState(null)
  const [reservationId, setReservationId] = useState("")

  // Refs for custom dropdowns
  const statusDropdownRef = useRef(null)
  const dateDropdownRef = useRef(null)
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false)
  const [dateDropdownOpen, setDateDropdownOpen] = useState(false)

  // Handle clicks outside dropdowns
  useEffect(() => {
    function handleClickOutside(event) {
      if (statusDropdownRef.current && !statusDropdownRef.current.contains(event.target)) {
        setStatusDropdownOpen(false)
      }
      if (dateDropdownRef.current && !dateDropdownRef.current.contains(event.target)) {
        setDateDropdownOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  // Fetch reservations
  const fetchReservations = useCallback(async () => {
    setLoading(true);
    try {
      let endpoint = "";
      if (role === "BARBER") {
        endpoint = `http://localhost:8443/reservation/barber/${userId}`;
      } else {
        endpoint = `http://localhost:8443/reservation/client/${userId}`;
      }

      const response = await axios.get(endpoint);
      setReservations(response.data);
      setError("");
    } catch (err) {
      console.error("Error fetching reservations:", err);
      setError("Failed to load reservations. Please try again later.");
    } finally {
      setLoading(false);
    }
  }, [userId, role]);

  // 2) Call `fetchReservations` once on mount (and whenever userId/role changes)
  useEffect(() => {
    fetchReservations();
  }, [fetchReservations]);
  

  // Helper function to safely parse ISO dates
  const safeParseISO = (dateStr, timeStr) => {
    if (!dateStr || !timeStr) return new Date() // Return current date as fallback
    try {
      return parseISO(`${dateStr}T${timeStr}`)
    } catch (error) {
      console.error("Error parsing date:", error)
      return new Date() // Return current date as fallback
    }
  }

  // Filter reservations based on active tab, status filter, and search query
  useEffect(() => {
    let filtered = [...reservations]

    // Filter by tab (upcoming, past, all)
    if (activeTab === "upcoming") {
      filtered = filtered.filter((res) => {
        if (!res.date || !res.time) return false
        return (
          (res.status === "PENDING" || res.status === "CONFIRMED") &&
          isAfter(safeParseISO(res.date, res.time), new Date())
        )
      })
    } else if (activeTab === "past") {
      filtered = filtered.filter((res) => {
        if (!res.date || !res.time) return false
        return (
          res.status === "COMPLETED" ||
          res.status === "CANCELLED" ||
          isBefore(safeParseISO(res.date, res.time), new Date())
        )
      })
    }

    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((res) => res.status === statusFilter)
    }

    // Apply date range filter
    if (dateRange === "today") {
      filtered = filtered.filter((res) => res.date && isToday(parseISO(res.date)))
    } else if (dateRange === "week") {
      const oneWeekFromNow = addDays(new Date(), 7)
      filtered = filtered.filter(
        (res) => res.date && isAfter(parseISO(res.date), new Date()) && isBefore(parseISO(res.date), oneWeekFromNow),
      )
    } else if (dateRange === "month") {
      const oneMonthFromNow = addDays(new Date(), 30)
      filtered = filtered.filter(
        (res) => res.date && isAfter(parseISO(res.date), new Date()) && isBefore(parseISO(res.date), oneMonthFromNow),
      )
    }

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (res) =>
          res.client?.username?.toLowerCase().includes(query) ||
          res.barber?.username?.toLowerCase().includes(query) ||
          res.hairstyleChosen?.toLowerCase().includes(query) ||
          res.barber?.barbershop?.name?.toLowerCase().includes(query),
      )
    }

    setFilteredReservations(filtered)
  }, [reservations, activeTab, statusFilter, searchQuery, dateRange])

  // Handle status change
  const handleStatusChange = async (reservationId, newStatus) => {
    try {
      await axios.put(`http://localhost:8443/reservation/${reservationId}/status`, {
        status: newStatus,
      })

      // Update local state
      setReservations((prev) => prev.map((res) => (res.id === reservationId ? { ...res, status: newStatus } : res)))

      // Close details dialog
      setDetailsOpen(false)

      // If marking as completed and user is a barber, show notification to client
      if (newStatus === "COMPLETED" && role === "BARBER") {
        // In a real app, you would send a notification to the client
        console.log("Sending notification to client about completed reservation")
      }

      // If marking as no-show and user is a barber
      if (newStatus === "CANCELLED" && role === "BARBER") {
        // In a real app, you would mark this as a no-show with a reason
        console.log("Marking reservation as no-show")
      }
    } catch (err) {
      console.error("Error updating reservation status:", err)
      alert("Failed to update reservation status. Please try again.")
    }
  }

  // Toggle card expansion
  const toggleCardExpansion = (id) => {
    setExpandedCards((prev) => (prev.includes(id) ? prev.filter((cardId) => cardId !== id) : [...prev, id]))
  }

  // Handle rating submission
  const handleRatingSubmit = async (e) => {
    e.preventDefault()
    if (!ratingValue || ratingValue < 1) {
      alert("Please select a rating")
      return
    }

    try {
      // We'll just send JSON
      const payload = {
        reservationId: reservationId,
        barberId: ratingBarberId,
        rating: ratingValue,
        comment: ratingComment,
        clientId: userId, // optional if you track the user
      }

      await axios.post("http://localhost:8443/reviews/rate", payload, {
        headers: { "Content-Type": "application/json" },
      })

      alert("Thank you for your rating!")
      
      setRatingOpen(false)
      await fetchReservations();
      // Close the modal
    } catch (err) {
      console.error("Error submitting rating:", err)
      alert("Failed to submit rating. Please try again.")
    }
  }

  // Open rating modal
  const openRatingModal = (reservation) => {
    setReservationId(reservation.id)
    setRatingBarberId(reservation.barber?.id)
    setRatingValue(0)
    setRatingComment("")
    setRatingOpen(true)
  }

  // Get status badge
  const getStatusBadge = (status) => {
    switch (status) {
      case "PENDING":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300 border border-yellow-200 dark:border-yellow-800">
            Pending
          </span>
        )
      case "CONFIRMED":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
            Confirmed
          </span>
        )
      case "COMPLETED":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 border border-green-200 dark:border-green-800">
            Completed
          </span>
        )
      case "CANCELLED":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 border border-red-200 dark:border-red-800">
            Cancelled
          </span>
        )
      case "NO_SHOW":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600">
            No Show
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600">
            {status || "Unknown"}
          </span>
        )
    }
  }

  // Render loading state
  if (loading) {
    return (
      <div className="container mx-auto py-10 px-4">
        <h1 className="text-3xl font-bold mb-8">Reservations</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 animate-pulse">
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-4"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-2"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3 mb-2"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
              <div className="flex justify-between">
                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // Render error state
  if (error) {
    return (
      <div className="container mx-auto py-10 px-4">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-6 rounded-xl text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-red-800 dark:text-red-300 mb-2">Error Loading Reservations</h2>
          <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-10 px-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {role === "BARBER" ? "My Appointments" : "My Reservations"}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            {role === "BARBER"
              ? "Manage your client appointments and schedule"
              : "View and manage your haircut reservations"}
          </p>
        </div>

        {role === "CLIENT" && (
          <a
            href="/reservation"
            className="inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-medium rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
          >
            Book New Appointment
          </a>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-grow">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder={role === "BARBER" ? "Search clients or hairstyles..." : "Search barbers or hairstyles..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          <div className="flex flex-wrap gap-3">
            {/* Status Filter Dropdown */}
            <div className="relative" ref={statusDropdownRef}>
              <button
                onClick={() => setStatusDropdownOpen(!statusDropdownOpen)}
                className="flex items-center justify-between w-[140px] px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <div className="flex items-center">
                  <Filter className="h-4 w-4 mr-2 text-gray-500" />
                  <span>
                    {statusFilter === "all"
                      ? "All Statuses"
                      : statusFilter === "PENDING"
                        ? "Pending"
                        : statusFilter === "CONFIRMED"
                          ? "Confirmed"
                          : statusFilter === "COMPLETED"
                            ? "Completed"
                            : statusFilter === "CANCELLED"
                              ? "Cancelled"
                              : statusFilter === "NO_SHOW"
                                ? "No Show"
                                : "Status"}
                  </span>
                </div>
                <ChevronDown className="h-4 w-4 text-gray-500" />
              </button>

              {statusDropdownOpen && (
                <div className="absolute z-10 mt-1 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
                  <div className="py-1">
                    <button
                      onClick={() => {
                        setStatusFilter("all")
                        setStatusDropdownOpen(false)
                      }}
                      className="block w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      All Statuses
                    </button>
                    <button
                      onClick={() => {
                        setStatusFilter("PENDING")
                        setStatusDropdownOpen(false)
                      }}
                      className="block w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      Pending
                    </button>
                    <button
                      onClick={() => {
                        setStatusFilter("CONFIRMED")
                        setStatusDropdownOpen(false)
                      }}
                      className="block w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      Confirmed
                    </button>
                    <button
                      onClick={() => {
                        setStatusFilter("COMPLETED")
                        setStatusDropdownOpen(false)
                      }}
                      className="block w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      Completed
                    </button>
                    <button
                      onClick={() => {
                        setStatusFilter("CANCELLED")
                        setStatusDropdownOpen(false)
                      }}
                      className="block w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      Cancelled
                    </button>
                    {role === "BARBER" && (
                      <button
                        onClick={() => {
                          setStatusFilter("NO_SHOW")
                          setStatusDropdownOpen(false)
                        }}
                        className="block w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-white"
                      >
                        No Show
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Date Range Dropdown */}
            <div className="relative" ref={dateDropdownRef}>
              <button
                onClick={() => setDateDropdownOpen(!dateDropdownOpen)}
                className="flex items-center justify-between w-[140px] px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <div className="flex items-center">
                  <CalendarIcon className="h-4 w-4 mr-2 text-gray-500" />
                  <span>
                    {dateRange === "all"
                      ? "All Dates"
                      : dateRange === "today"
                        ? "Today"
                        : dateRange === "week"
                          ? "Next 7 Days"
                          : dateRange === "month"
                            ? "Next 30 Days"
                            : "Date Range"}
                  </span>
                </div>
                <ChevronDown className="h-4 w-4 text-gray-500" />
              </button>

              {dateDropdownOpen && (
                <div className="absolute z-10 mt-1 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
                  <div className="py-1">
                    <button
                      onClick={() => {
                        setDateRange("all")
                        setDateDropdownOpen(false)
                      }}
                      className="block w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      All Dates
                    </button>
                    <button
                      onClick={() => {
                        setDateRange("today")
                        setDateDropdownOpen(false)
                      }}
                      className="block w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      Today
                    </button>
                    <button
                      onClick={() => {
                        setDateRange("week")
                        setDateDropdownOpen(false)
                      }}
                      className="block w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      Next 7 Days
                    </button>
                    <button
                      onClick={() => {
                        setDateRange("month")
                        setDateDropdownOpen(false)
                      }}
                      className="block w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      Next 30 Days
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6">
        <div className="grid w-full grid-cols-3 mb-4 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
          <button
            onClick={() => setActiveTab("upcoming")}
            className={`py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === "upcoming"
                ? "bg-white dark:bg-gray-800 text-indigo-600 dark:text-indigo-400 shadow-sm"
                : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
            }`}
          >
            Upcoming
          </button>
          <button
            onClick={() => setActiveTab("past")}
            className={`py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === "past"
                ? "bg-white dark:bg-gray-800 text-indigo-600 dark:text-indigo-400 shadow-sm"
                : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
            }`}
          >
            Past
          </button>
          <button
            onClick={() => setActiveTab("all")}
            className={`py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === "all"
                ? "bg-white dark:bg-gray-800 text-indigo-600 dark:text-indigo-400 shadow-sm"
                : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
            }`}
          >
            All
          </button>
        </div>

        {renderReservationsList()}
      </div>

      {/* Reservation Details Modal */}
      {detailsOpen && selectedReservation && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full mx-4 overflow-hidden">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
                  <Calendar className="h-5 w-5 mr-2 text-indigo-600 dark:text-indigo-400" />
                  Reservation Details
                </h2>
                <button
                  onClick={() => setDetailsOpen(false)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4 py-4">
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-semibold text-gray-900 dark:text-white">Appointment Info</h3>
                    {getStatusBadge(selectedReservation.status)}
                  </div>

                  <div className="space-y-2 text-sm">
                    {selectedReservation.date && selectedReservation.time && (
                      <div className="flex items-start">
                        <Calendar className="h-4 w-4 mr-2 text-gray-500 mt-0.5" />
                        <div>
                          <p className="text-gray-700 dark:text-gray-300">
                            {format(parseISO(selectedReservation.date), "EEEE, MMMM d, yyyy")}
                          </p>
                          <p className="text-gray-700 dark:text-gray-300">{selectedReservation.time}</p>
                        </div>
                      </div>
                    )}

                    {selectedReservation.hairstyleChosen && (
                      <div className="flex items-start">
                        <Scissors className="h-4 w-4 mr-2 text-gray-500 mt-0.5" />
                        <div>
                          <p className="text-gray-500 dark:text-gray-400">Hairstyle</p>
                          <p className="text-gray-700 dark:text-gray-300">{selectedReservation.hairstyleChosen}</p>
                        </div>
                      </div>
                    )}

                    {selectedReservation.barber?.barbershop && (
                      <div className="flex items-start">
                        <MapPin className="h-4 w-4 mr-2 text-gray-500 mt-0.5" />
                        <div>
                          <p className="text-gray-500 dark:text-gray-400">Location</p>
                          <p className="text-gray-700 dark:text-gray-300">
                            {selectedReservation.barber.barbershop.name || "Barbershop Name"}
                          </p>
                          <p className="text-gray-700 dark:text-gray-300">
                            {selectedReservation.barber.barbershop.address || "Barbershop Address"}
                          </p>
                          <p className="text-gray-700 dark:text-gray-300">
                            {selectedReservation.barber.username || "Barber Name"}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                    {role === "BARBER" ? "Client" : "Barber"}
                  </h3>

                  <div className="flex items-center">
                    <div className="h-10 w-10 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center mr-3">
                      <User className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {role === "BARBER"
                          ? selectedReservation.client?.username
                          : selectedReservation.barber?.username}
                      </p>
                    </div>
                  </div>
                </div>

                {selectedReservation.notes && (
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Notes</h3>
                    <p className="text-gray-700 dark:text-gray-300 italic">{selectedReservation.notes}</p>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row gap-2 pt-4">
                  {selectedReservation.status === "PENDING" && (
                    <>
                      <button
                        onClick={() => handleStatusChange(selectedReservation.id, "CANCELLED")}
                        className="px-4 py-2 border border-red-300 dark:border-red-800 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center justify-center"
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Cancel
                      </button>

                      {role === "BARBER" && (
                        <button
                          onClick={() => handleStatusChange(selectedReservation.id, "CONFIRMED")}
                          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg flex items-center justify-center"
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Confirm
                        </button>
                      )}
                    </>
                  )}

                  {selectedReservation.status === "CONFIRMED" && (
                    <>
                      {role === "CLIENT" && (
                        <button
                          onClick={() => handleStatusChange(selectedReservation.id, "CANCELLED")}
                          className="px-4 py-2 border border-red-300 dark:border-red-800 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center justify-center"
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          Cancel
                        </button>
                      )}

                      {role === "BARBER" && (
                        <>
                          <button
                            onClick={() => handleStatusChange(selectedReservation.id, "COMPLETED")}
                            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg flex items-center justify-center"
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Mark as Completed
                          </button>
                          <button
                            onClick={() => handleStatusChange(selectedReservation.id, "NO_SHOW")}
                            className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg flex items-center justify-center"
                          >
                            <XCircle className="h-4 w-4 mr-2" />
                            Mark as No-Show
                          </button>
                        </>
                      )}
                    </>
                  )}

                  {selectedReservation.status === "COMPLETED" && role === "CLIENT" && !selectedReservation.review && (
                    <button
                      onClick={() => openRatingModal(selectedReservation)}
                      className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg flex items-center justify-center"
                    >
                      <Star className="h-4 w-4 mr-2" />
                      Rate Barber
                    </button>
                  )}

                  {(selectedReservation.status === "COMPLETED" || selectedReservation.status === "CANCELLED") &&
                    role === "CLIENT" && (
                      <a
                        href="/reservation"
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg flex items-center justify-center"
                      >
                        Book Again
                      </a>
                    )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Rating Modal */}
      {ratingOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full mx-4 overflow-hidden">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
                  <Star className="h-5 w-5 mr-2 text-yellow-500" />
                  Rate Your Experience
                </h2>
                <button
                  onClick={() => setRatingOpen(false)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleRatingSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    How would you rate your experience?
                  </label>
                  <div className="flex items-center space-x-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRatingValue(star)}
                        className="p-1 focus:outline-none focus:ring-0"
                      >
                        <Star
                          className={`h-8 w-8 ${
                            star <= ratingValue ? "text-yellow-500 fill-yellow-500" : "text-gray-300 dark:text-gray-600"
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label htmlFor="comment" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Comments (Optional)
                  </label>
                  <textarea
                    id="comment"
                    rows={3}
                    value={ratingComment}
                    onChange={(e) => setRatingComment(e.target.value)}
                    placeholder="Share your experience..."
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setRatingOpen(false)}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg">
                    Submit Rating
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )

  // Helper function to render the reservations list
  function renderReservationsList() {
    if (filteredReservations.length === 0) {
      return (
        <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-8 text-center">
          <Calendar className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No reservations found</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            {activeTab === "upcoming"
              ? "You don't have any upcoming reservations."
              : activeTab === "past"
                ? "You don't have any past reservations."
                : "No reservations match your search criteria."}
          </p>
          {role === "CLIENT" && (
            <a
              href="/reservation"
              className="inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors"
            >
              Book an Appointment
            </a>
          )}
        </div>
      )
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
       {filteredReservations
          .filter((reservation) => !!reservation) // Filter first
          .map((reservation) => {
            const isExpanded = expandedCards.includes(reservation.id);
            let isPast = false;
            let isToday = false;

            if (reservation.date && reservation.time) {
              try {
                const reservationDate = safeParseISO(reservation.date, reservation.time);
                isPast = isBefore(reservationDate, new Date());
                isToday = format(parseISO(reservation.date), "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd");
              } catch (error) {
                console.error(error, reservation.id);
              }
            }

            return (
              <div
                key={reservation.id}
                className={`bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden transition-all duration-300 ${
                  isToday ? "border-l-4 border-l-blue-500" : isPast ? "opacity-80" : ""
                }`}
              >
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-bold text-lg text-gray-900 dark:text-white">
                      {reservation.hairstyleChosen || "Haircut"}
                    </h3>
                    {reservation.date && reservation.time && (
                      <p className="text-gray-500 dark:text-gray-400 text-sm">
                        {format(parseISO(reservation.date), "EEEE, MMMM d, yyyy")} • {reservation.time}
                      </p>
                    )}
                  </div>
                  {getStatusBadge(reservation.status)}
                </div>

                <div className="space-y-3">
                  <div className="flex items-center">
                    <User className="h-4 w-4 text-gray-400 mr-2" />
                    <span className="text-gray-700 dark:text-gray-300">
                      {role === "BARBER"
                        ? reservation.client?.username || "Client"
                        : reservation.barber?.username || "Barber"}
                    </span>
                  </div>

                  {isExpanded && (
                    <div key={`expanded-${reservation.id}`}>
                    <>
                      {reservation.barber?.barbershop && (
                        <div className="flex items-center">
                          <MapPin className="h-4 w-4 text-gray-400 mr-2" />
                          <span className="text-gray-700 dark:text-gray-300">
                            {reservation.barber.barbershop.name || "Barbershop"} -{" "}
                            {reservation.barber.barbershop.address || "Address"}
                          </span>
                        </div>
                      )}

                      {reservation.hairstyleChosen && (
                        <div className="flex items-center">
                          <Scissors className="h-4 w-4 text-gray-400 mr-2" />
                          <span className="text-gray-700 dark:text-gray-300">{reservation.hairstyleChosen}</span>
                          {/* Try to load image if available */}
                          {reservation.hairstyleChosen && (
                            <div className="mt-2">
                              <img
                                key={`image-${reservation.id}`} // Add this line
                                className="h-32 w-32 rounded-lg object-cover"
                                src={`/src/assets/images/${reservation.hairstyleChosen}.jpeg`}
                                alt={reservation.hairstyleChosen}
                                onError={(e) => {
                                  e.target.style.display = "none";
                                }}
                              />
                            </div>
                          )}
                        </div>
                      )}

                      <div className="flex items-center">
                        <Clock className="h-4 w-4 text-gray-400 mr-2" />
                        <span className="text-gray-700 dark:text-gray-300">Duration: 30 min</span>
                      </div>

                      {reservation.notes && (
                        <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg text-sm mt-2">
                          <p className="text-gray-700 dark:text-gray-300 italic">{reservation.notes}</p>
                        </div>
                      )}

                      {/* Show rating if completed and rated */}
                      {reservation.status === "COMPLETED" && reservation.review && (
                        <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg text-sm mt-2">
                          <div className="flex items-center mb-1">
                            <p className="text-gray-700 dark:text-gray-300 font-medium mr-2">Your Rating:</p>
                            <div className="flex">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                  key={star}
                                  className={`h-4 w-4 ${
                                    star <= reservation.review.rating
                                      ? "text-yellow-500 fill-yellow-500"
                                      : "text-gray-300 dark:text-gray-600"
                                  }`}
                                />
                              ))}
                            </div>
                          </div>
                          {reservation.review.comment && (
                            <p className="text-gray-700 dark:text-gray-300 italic">{reservation.review.comment}</p>
                          )}
                        </div>
                      )}
                    </>
                    </div>
                  )}
                </div>

                <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                  <button
                    onClick={() => toggleCardExpansion(reservation.id)}
                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-sm flex items-center"
                  >
                    {isExpanded ? (
                      <>
                        <ChevronUp className="h-4 w-4 mr-1" />
                        Less
                      </>
                    ) : (
                      <>
                        <ChevronDown className="h-4 w-4 mr-1" />
                        More
                      </>
                    )}
                  </button>

                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setSelectedReservation(reservation)
                        setDetailsOpen(true)
                      }}
                      className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      Details
                    </button>

                    {reservation.status === "PENDING" && (
                      <button
                        onClick={() => handleStatusChange(reservation.id, "CANCELLED")}
                        className="px-3 py-1.5 text-sm bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                      >
                        Cancel
                      </button>
                    )}

                    {reservation.status === "CONFIRMED" && role === "BARBER" && (
                      <button
                        onClick={() => handleStatusChange(reservation.id, "COMPLETED")}
                        className="px-3 py-1.5 text-sm bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                      >
                        Complete
                      </button>
                    )}

                    {reservation.status === "COMPLETED" && role === "CLIENT" && !reservation.review && (
                      <button
                        onClick={() => openRatingModal(reservation)}
                        className="px-3 py-1.5 text-sm bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg transition-colors"
                      >
                        Rate
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    )
  }
}

