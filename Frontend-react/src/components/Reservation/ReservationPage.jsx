/**
 * ReservationPage.jsx
 *
 * Allows the user to complete a reservation using faceShape data
 * from the face detection page. Shows barbershops, barbers,
 * recommended hairstyles, etc.
 */

import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import axios from "axios";

export default function ReservationPage() {
  // Data from previous page (faceShape + possibly recommendedHairstyles)
  const { state } = useLocation();
  const faceShape = state?.faceShape || "oval";

  // If the previous page provided recommendedHairstyles, we can use them
  // otherwise we default to trendingHairstyles from the server
  const [trendingHairstyles, setTrendingHairstyles] = useState([]);
  const recommendedHairstyles = state?.recommendedHairstyles || trendingHairstyles;

  // For selecting which hairstyle the user picks
  const [selectedHairstyle, setSelectedHairstyle] = useState(null);

  // Barbershop logic
  const [userLocation, setUserLocation] = useState(null);
  const [barbershops, setBarbershops] = useState([]);
  const [selectedBarbershop, setSelectedBarbershop] = useState(null);
  const [selectedBarber, setSelectedBarber] = useState(null);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1) Attempt geolocation
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setUserLocation({ lat: latitude, lng: longitude });
        fetchBarbershops(latitude, longitude);
      },
      (error) => {
        console.error("Error getting location:", error);
        // fallback if location not provided
        fetchBarbershops();
      }
    );

    // 2) If no recommendedHairstyles were passed, fetch from server
    if (!state?.recommendedHairstyles) {
      axios
        .get(`http://localhost:8443/public/trending-hairstyles?faceShape=${faceShape}`)
        .then((res) => setTrendingHairstyles(res.data))
        .catch((err) => console.error("Error fetching trending hairstyles:", err))
        .finally(() => setLoading(false));
    } else {
      // We already have recommendedHairstyles in state
      setLoading(false);
    }
  }, [faceShape, state?.recommendedHairstyles]);

  // Fetch barbershops near lat/lng
  const fetchBarbershops = async (lat, lng) => {
    try {
      const res = await axios.get("http://localhost:8443/public/barbershops", {
        params: { lat, lng },
      });
      setBarbershops(res.data);
    } catch (error) {
      console.error("Error fetching barbershops:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Example of sending the reservation
    // axios.post("/public/reservations", { ... });
    console.log("Reservation submitted!");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-xl text-gray-600">
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-20">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Complete Your Reservation
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Recommended for <span className="font-semibold">{faceShape}</span> face shape
          </p>

          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* User Location */}
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
              <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">
                Your Location
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                {userLocation
                  ? `Using location: ${userLocation.lat.toFixed(4)}, ${userLocation.lng.toFixed(4)}`
                  : "Using default location"}
              </p>
            </div>

            {/* Nearby Barbershops */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Nearby Barbershops
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {barbershops.map((shop) => (
                  <div
                    key={shop.id}
                    className={`p-4 rounded-lg cursor-pointer transition-colors ${
                      selectedBarbershop?.id === shop.id
                        ? "bg-indigo-100 dark:bg-indigo-900/30 border-2 border-indigo-300"
                        : "bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600"
                    }`}
                    onClick={() => {
                      setSelectedBarbershop(shop);
                      setSelectedBarber(null);
                    }}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-semibold text-gray-800 dark:text-white">
                          {shop.name}
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          {shop.address}
                        </p>
                        <div className="flex items-center mt-2">
                          <span className="text-yellow-500">★ {shop.rating}</span>
                          <span className="text-sm text-gray-500 ml-2">
                            ({shop.reviews} reviews)
                          </span>
                        </div>
                      </div>
                      <span className="text-sm text-gray-500">
                        {shop.distance} km
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Barber Selection */}
            {selectedBarbershop && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Select Barber at {selectedBarbershop.name}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {selectedBarbershop.barbers?.map((barber) => (
                    <div
                      key={barber.id}
                      className={`p-4 rounded-lg cursor-pointer transition-colors ${
                        selectedBarber?.id === barber.id
                          ? "bg-indigo-100 dark:bg-indigo-900/30 border-2 border-indigo-300"
                          : "bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600"
                      }`}
                      onClick={() => setSelectedBarber(barber)}
                    >
                      <img
                        src={barber.photo}
                        alt={barber.name}
                        className="w-full h-32 object-cover rounded-lg mb-2"
                      />
                      <h4 className="font-semibold text-gray-800 dark:text-white">
                        {barber.name}
                      </h4>
                      <div className="flex items-center">
                        <span className="text-yellow-500">★ {barber.rating}</span>
                        <span className="text-sm text-gray-500 ml-2">
                          ({barber.specialty})
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recommended Hairstyles */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Recommended Hairstyles ({faceShape} face)
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {recommendedHairstyles.map((hairstyle) => (
                  <div
                    key={hairstyle.id}
                    className={`relative group cursor-pointer ${
                      selectedHairstyle === hairstyle.id ? "ring-2 ring-indigo-500" : ""
                    }`}
                    onClick={() => setSelectedHairstyle(hairstyle.id)}
                  >
                    <img
                      src={hairstyle.image}
                      alt={hairstyle.name}
                      className="w-full h-32 object-cover rounded-lg"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="text-white text-sm font-medium">
                        {hairstyle.name}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Date/Time selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-200">
                  Date
                </label>
                <input
                  type="date"
                  className="w-full border rounded-lg p-2 dark:bg-gray-700 dark:border-gray-600"
                  min={new Date().toISOString().split("T")[0]}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-200">
                  Time
                </label>
                <input
                  type="time"
                  className="w-full border rounded-lg p-2 dark:bg-gray-700 dark:border-gray-600"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Confirm Reservation
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
