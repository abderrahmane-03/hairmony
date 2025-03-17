"use client"

import { Check, Copy, ArrowRight, Mail, Calendar, Download, Share2 } from 'lucide-react'
import { useEffect, useState } from "react"
import { useLocation } from "react-router-dom"

export default function PaymentSuccessPage() {
  const location = useLocation()
  const searchParams = new URLSearchParams(location.search)
  const sessionId = searchParams.get("sessionId")

  const [orderDetails, setOrderDetails] = useState(null)
  const [copied, setCopied] = useState(false)
  const [showConfetti, setShowConfetti] = useState(true)

  useEffect(() => {
    if (!sessionId) return

    let isMounted = true

    const fetchData = () => {
      fetch(`http://localhost:8443/payment/details?sessionId=${sessionId}`)
        .then((res) => {
          if (!res.ok) throw new Error("Failed to fetch payment details")
          return res.json()
        })
        .then((data) => {
          if (isMounted) {
            setOrderDetails({
              orderNumber: data.id,
              date: new Date(data.createdAt).toLocaleDateString(),
              total: `$${data.amount.toFixed(2)}`,
              items: [{ name: data.description, price: `$${data.amount.toFixed(2)}`, quantity: 1 }],
            })
          }
        })
        .catch((err) => {
          console.error("Fetch failed, reloading page in 3 seconds...", err)
          setTimeout(() => {
            window.location.reload()
          }, 500)
        })
    }

    fetchData()

    // Hide confetti after 5 seconds
    const timer = setTimeout(() => {
      setShowConfetti(false)
    }, 5000)

    return () => {
      isMounted = false
      clearTimeout(timer)
    }
  }, [sessionId])

  const copyOrderNumber = () => {
    if (orderDetails) {
      navigator.clipboard.writeText(orderDetails.orderNumber)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  if (!orderDetails) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800">
        <div className="text-center">
          <div className="inline-block h-16 w-16 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
          <p className="mt-4 text-lg font-medium text-gray-700 dark:text-gray-300">Loading payment details...</p>
        </div>
      </div>
    )
  }

  return (
    <div className=" min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800 py-12 px-4 relative overflow-hidden">
      {/* Confetti animation */}
      {showConfetti && (
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(50)].map((_, i) => (
            <div
              key={i}
              className="absolute animate-confetti"
              style={{
                left: `${Math.random() * 100}%`,
                top: `-5%`,
                width: `${Math.random() * 10 + 5}px`,
                height: `${Math.random() * 10 + 5}px`,
                background: `hsl(${Math.random() * 360}, 100%, 50%)`,
                borderRadius: Math.random() > 0.5 ? "50%" : "0",
                transform: `rotate(${Math.random() * 360}deg)`,
                animation: `confetti ${Math.random() * 3 + 2}s linear forwards`,
              }}
            ></div>
          ))}
        </div>
      )}

      <div className="pt-20 max-w-3xl mx-auto">
        <div className="bg-white dark:bg-gray-800 shadow-2xl rounded-2xl overflow-hidden transform transition-all duration-500 hover:shadow-[0_20px_50px_rgba(8,_112,_184,_0.7)]">
          {/* Success banner */}
          <div className="bg-gradient-to-r from-green-400 to-blue-500 h-3"></div>
          
          <div className="p-8">
            <div className="flex flex-col items-center space-y-6 pb-6">
              <div className="w-24 h-24 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center shadow-lg transform transition-transform duration-500 hover:scale-110">
                <Check className="h-14 w-14 text-green-600 dark:text-green-400" />
              </div>
              
              <div className="relative">
                <img src="/src/assets/Success.png" alt="" className="w-64 h-64 object-contain" />
                <div className="absolute -top-4 -right-4 bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg animate-pulse">
                  Success!
                </div>
              </div>
              
              <div className="text-center">
                <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-2 bg-clip-text text-transparent bg-gradient-to-r from-green-500 to-blue-600">
                  Payment Successful!
                </h1>
                <p className="text-gray-600 dark:text-gray-300 text-lg max-w-md">
                  Thank you for your purchase. Your order has been confirmed and is being processed.
                </p>
              </div>
            </div>

            <div className="space-y-8">
              {/* Order info card */}
              <div className="bg-gradient-to-r from-blue-50 to-green-50 dark:from-gray-700 dark:to-gray-700 p-6 rounded-xl shadow-md">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div className="bg-white dark:bg-gray-800 px-4 py-3 rounded-lg shadow-sm">
                    <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
                      <span className="inline-block w-3 h-3 bg-blue-500 rounded-full mr-2"></span>
                      Order Number
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="font-semibold text-gray-800 dark:text-gray-200">{orderDetails.orderNumber}</p>
                      <button
                        className="h-8 w-8 flex items-center justify-center bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full transition-colors"
                        onClick={copyOrderNumber}
                        aria-label="Copy order number"
                      >
                        {copied ? (
                          <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
                        ) : (
                          <Copy className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                        )}
                      </button>
                    </div>
                  </div>
                  
                  <div className="bg-white dark:bg-gray-800 px-4 py-3 rounded-lg shadow-sm">
                    <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
                      <span className="inline-block w-3 h-3 bg-green-500 rounded-full mr-2"></span>
                      Order Date
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <Calendar className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                      <p className="font-semibold text-gray-800 dark:text-gray-200">{orderDetails.date}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Order summary */}
              <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl shadow-md overflow-hidden">
                <div className="bg-gray-50 dark:bg-gray-700 px-6 py-4 border-b border-gray-100 dark:border-gray-600">
                  <h2 className="text-lg font-bold text-gray-800 dark:text-white flex items-center">
                    <span className="inline-block w-2 h-6 bg-blue-500 rounded-full mr-3"></span>
                    Order Summary
                  </h2>
                </div>
                
                <div className="p-6">
                  <div className="space-y-4">
                    {orderDetails.items.map((item, index) => (
                      <div 
                        key={index} 
                        className="flex justify-between items-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-blue-50 dark:hover:bg-gray-600 transition-colors"
                      >
                        <div>
                          <p className="font-medium text-gray-800 dark:text-white">{item.name}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">Qty: {item.quantity}</p>
                        </div>
                        <p className="font-medium text-gray-800 dark:text-white">{item.price}</p>
                      </div>
                    ))}

                    <div className="pt-4 mt-4 border-t border-dashed border-gray-200 dark:border-gray-600">
                      <div className="flex justify-between items-center">
                        <p className="font-bold text-lg text-gray-800 dark:text-white">Total</p>
                        <p className="font-bold text-lg text-blue-600 dark:text-blue-400">{orderDetails.total}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* What's next */}
              <div className="bg-blue-50 dark:bg-gray-700 rounded-xl p-6 border-l-4 border-blue-500 shadow-md">
                <h2 className="text-lg font-bold text-gray-800 dark:text-white mb-3 flex items-center">
                  <span className="mr-2">Whats Next?</span>
                  <span className="text-xs bg-blue-500 text-white px-2 py-0.5 rounded-full">Important</span>
                </h2>
                <div className="space-y-3 text-gray-600 dark:text-gray-300">
                  <p className="flex items-start">
                    <Mail className="h-5 w-5 text-blue-500 mr-2 flex-shrink-0 mt-0.5" />
                    <span>You will receive an email confirmation shortly at your registered email address.</span>
                  </p>
                  <p className="flex items-start">
                    <Download className="h-5 w-5 text-blue-500 mr-2 flex-shrink-0 mt-0.5" />
                    <span>You can download your receipt from your account dashboard.</span>
                  </p>
                  <p className="flex items-start">
                    <Share2 className="h-5 w-5 text-blue-500 mr-2 flex-shrink-0 mt-0.5" />
                    <span>Share your experience with friends and get rewards!</span>
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 mt-8">
              <a
                href="/upload"
                className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg text-center font-medium shadow-md hover:shadow-lg transition-all duration-300 flex items-center justify-center"
              >
                <span>Go back to upload</span>
                <ArrowRight className="h-5 w-5 ml-2" />
              </a>
              <a
                href="/pay"
                className="w-full sm:w-auto px-6 py-3 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 text-gray-800 dark:text-white rounded-lg text-center flex items-center justify-center shadow-md hover:shadow-lg transition-all duration-300"
              >
                <span>View Offers</span>
              </a>
            </div>
          </div>
        </div>
        
        {/* Footer */}
        <div className="text-center mt-8 text-gray-500 dark:text-gray-400 text-sm">
          <p>© 2025 Your Company. All rights reserved.</p>
          <p className="mt-1">Need help? <a href="/support" className="text-blue-500 hover:underline">Contact Support</a></p>
        </div>
      </div>
    </div>
  )
}
