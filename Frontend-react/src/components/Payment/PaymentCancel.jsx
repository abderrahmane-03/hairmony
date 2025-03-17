"use client"

import { X, Copy, ArrowRight, AlertCircle, HelpCircle, RefreshCw } from "lucide-react"
import { useEffect, useState } from "react"
import { useLocation } from "react-router-dom"

export default function PaymentCancelPage() {
  const location = useLocation()
  const searchParams = new URLSearchParams(location.search)
  const sessionId = searchParams.get("sessionId")

  const [orderDetails, setOrderDetails] = useState(null)
  const [copied, setCopied] = useState(false)

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
          }, 3000)
        })
    }

    fetchData()

    return () => {
      isMounted = false
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-red-50 to-white dark:from-gray-900 dark:to-gray-800">
        <div className="text-center">
          <div className="inline-block h-16 w-16 animate-spin rounded-full border-4 border-solid border-red-600 border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
          <p className="mt-4 text-lg font-medium text-gray-700 dark:text-gray-300">Loading payment details...</p>
        </div>
      </div>
    )
  }

  return (
    <div className=" pt-24  min-h-screen bg-gradient-to-b from-red-50 to-white dark:from-gray-900 dark:to-gray-800 py-12 px-4 relative overflow-hidden">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white dark:bg-gray-800 shadow-2xl rounded-2xl overflow-hidden transform transition-all duration-500 hover:shadow-[0_20px_50px_rgba(239,_68,_68,_0.7)]">
          {/* Cancel banner */}
          <div className="bg-gradient-to-r from-red-400 to-orange-500 h-3"></div>

          <div className="p-8">
            <div className="flex flex-col items-center space-y-6 pb-6">
              <div className="w-24 h-24 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center shadow-lg transform transition-transform duration-500 hover:scale-110">
                <X className="h-14 w-14 text-red-600 dark:text-red-400" />
              </div>

              <div className="relative">
                <img src="/src/assets/Cancel.png" alt="" className="w-64 h-64 object-contain" />
                <div className="absolute -top-4 -right-4 bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                  Canceled
                </div>
              </div>

              <div className="text-center">
                <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-2 bg-clip-text text-transparent bg-gradient-to-r from-red-500 to-orange-600">
                  Payment Canceled
                </h1>
                <p className="text-gray-600 dark:text-gray-300 text-lg max-w-md">
                  Your payment was not completed. You can try again or contact support if you need help.
                </p>
              </div>
            </div>

            <div className="space-y-8">
              {/* Order info card */}
              <div className="bg-gradient-to-r from-red-50 to-orange-50 dark:from-gray-700 dark:to-gray-700 p-6 rounded-xl shadow-md">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div className="bg-white dark:bg-gray-800 px-4 py-3 rounded-lg shadow-sm">
                    <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
                      <span className="inline-block w-3 h-3 bg-red-500 rounded-full mr-2"></span>
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
                          <X className="h-4 w-4 text-red-600 dark:text-red-400" />
                        ) : (
                          <Copy className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="bg-white dark:bg-gray-800 px-4 py-3 rounded-lg shadow-sm">
                    <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
                      <span className="inline-block w-3 h-3 bg-orange-500 rounded-full mr-2"></span>
                      Order Date
                    </p>
                    <p className="font-semibold text-gray-800 dark:text-gray-200 mt-1">{orderDetails.date}</p>
                  </div>
                </div>
              </div>

              {/* Order summary */}
              <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl shadow-md overflow-hidden">
                <div className="bg-gray-50 dark:bg-gray-700 px-6 py-4 border-b border-gray-100 dark:border-gray-600">
                  <h2 className="text-lg font-bold text-gray-800 dark:text-white flex items-center">
                    <span className="inline-block w-2 h-6 bg-red-500 rounded-full mr-3"></span>
                    Order Summary
                  </h2>
                </div>

                <div className="p-6">
                  <div className="space-y-4">
                    {orderDetails.items.map((item, index) => (
                      <div
                        key={index}
                        className="flex justify-between items-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-red-50 dark:hover:bg-gray-600 transition-colors"
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
                        <p className="font-bold text-lg text-red-600 dark:text-red-400">{orderDetails.total}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* What's next */}
              <div className="bg-red-50 dark:bg-gray-700 rounded-xl p-6 border-l-4 border-red-500 shadow-md">
                <h2 className="text-lg font-bold text-gray-800 dark:text-white mb-3 flex items-center">
                  <span className="mr-2">Whats Next?</span>
                  <span className="text-xs bg-red-500 text-white px-2 py-0.5 rounded-full">Options</span>
                </h2>
                <div className="space-y-3 text-gray-600 dark:text-gray-300">
                  <p className="flex items-start">
                    <RefreshCw className="h-5 w-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
                    <span>If you want to complete your purchase, please try again.</span>
                  </p>
                  <p className="flex items-start">
                    <AlertCircle className="h-5 w-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
                    <span>If you encountered any issues during checkout, our support team can help.</span>
                  </p>
                  <p className="flex items-start">
                    <HelpCircle className="h-5 w-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
                    <span>Have questions about your order? Contact our customer service.</span>
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 mt-8">
              <a
                href="/upload"
                className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white rounded-lg text-center font-medium shadow-md hover:shadow-lg transition-all duration-300 flex items-center justify-center"
              >
                <RefreshCw className="h-5 w-5 mr-2" />
                <span>Try Again</span>
              </a>
              <a
                href="/support"
                className="w-full sm:w-auto px-6 py-3 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 text-gray-800 dark:text-white rounded-lg text-center flex items-center justify-center shadow-md hover:shadow-lg transition-all duration-300"
              >
                <span>Contact Support</span>
                <ArrowRight className="h-5 w-5 ml-2" />
              </a>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-gray-500 dark:text-gray-400 text-sm">
          <p>© 2025 Your Company. All rights reserved.</p>
          <p className="mt-1">
            Need help?{" "}
            <a href="/support" className="text-red-500 hover:underline">
              Contact Support
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}

