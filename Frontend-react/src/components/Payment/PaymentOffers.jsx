"use client"

import { useAuth } from "../../contexts/AuthContext"
import { useState } from "react"
import axios from "axios"
import {
  Check,
  Crown,
  CreditCard,
  Image,
  // eslint-disable-next-line no-shadow-restricted-names
  Infinity,
  Star,
  Video,
  Zap,
  ChevronRight,
  Shield,
  Clock,
  Users,
} from "lucide-react"

export default function PaymentOffers() {
  const { userId } = useAuth() // Ensure your AuthContext provides userId
  const [billingCycle, setBillingCycle] = useState("monthly")
  // const [selectedPlan, setSelectedPlan] = useState(null)

  const handlePurchase = async (amount, name) => {
    try {
      // Example: quantity = 1, currency = "usd"
      const productRequest = {
        amount, // e.g. 200 for $2.00
        quantity: 1,
        name, // e.g. "Extra Upload"
        currency: "usd",
      }

      // Post to your Stripe checkout endpoint
      const res = await axios.post(`http://localhost:8443/payment/stripe-checkout?userId=${userId}`, productRequest)

      // res.data => { status, message, sessionId, sessionUrl }
      // Redirect user to Stripe
      window.location.href = res.data.sessionUrl
    } catch (error) {
      console.error("Stripe checkout error:", error)
      alert("Failed to create Stripe session. Check console for details.")
    }
  }

  // Update the plans object to include the two new subscription offers
  const plans = {
    monthly: [
      {
        id: "basic",
        name: "Basic",
        price: 2,
        amount: 200,
        description: "Perfect for occasional users",
        features: ["Single image upload", "Basic face detection", "24-hour access", "Email support"],
        popular: false,
        icon: <Image className="h-6 w-6" />,
      },
      {
        id: "standard",
        name: "Standard",
        price: 5,
        amount: 500,
        description: "Great for regular users",
        features: ["5 image uploads per month", "Live face detection", "Priority processing", "24/7 support"],
        popular: true,
        icon: <Video className="h-6 w-6" />,
      },
      {
        id: "normal_subscriber",
        name: "Normal Subscriber",
        price: 40,
        amount: 4000,
        description: "Perfect for regular clients",
        features: [
          "Unlimited uploads",
          "Live face detection",
          "2 free haircuts per month",
          "Priority processing",
          "24/7 support",
        ],
        popular: false,
        icon: <Users className="h-6 w-6" />,
        isSubscription: true,
      },
      {
        id: "vip_subscriber",
        name: "VIP Subscriber",
        price: 70,
        amount: 7000,
        description: "For the ultimate haircare experience",
        features: [
          "Unlimited uploads",
          "Advanced face detection",
          "3 free haircuts per month",
          "Highest priority processing",
          "Dedicated support team",
          "Custom analysis reports",
        ],
        popular: false,
        icon: <Crown className="h-6 w-6" />,
        isSubscription: true,
      },
      {
        id: "premium",
        name: "Premium VIP",
        price: 10,
        amount: 1000,
        description: "For power users who need it all",
        features: [
          "Unlimited uploads",
          "Advanced face detection",
          "Priority processing",
          "Dedicated support team",
          "Custom analysis reports",
        ],
        popular: false,
        icon: <Crown className="h-6 w-6" />,
      },
    ],
    yearly: [
      {
        id: "basic",
        name: "Basic",
        price: 20,
        amount: 2000,
        description: "Perfect for occasional users",
        features: ["Single image upload per month", "Basic face detection", "24-hour access", "Email support"],
        popular: false,
        icon: <Image className="h-6 w-6" />,
      },
      {
        id: "standard",
        name: "Standard",
        price: 50,
        amount: 5000,
        description: "Great for regular users",
        features: ["5 image uploads per month", "Live face detection", "Priority processing", "24/7 support"],
        popular: true,
        icon: <Video className="h-6 w-6" />,
      },
      {
        id: "normal_subscriber",
        name: "Normal Subscriber",
        price: 400,
        amount: 40000,
        description: "Perfect for regular clients",
        features: [
          "Unlimited uploads",
          "Live face detection",
          "2 free haircuts per month",
          "Priority processing",
          "24/7 support",
        ],
        popular: false,
        icon: <Users className="h-6 w-6" />,
        isSubscription: true,
      },
      {
        id: "vip_subscriber",
        name: "VIP Subscriber",
        price: 700,
        amount: 70000,
        description: "For the ultimate haircare experience",
        features: [
          "Unlimited uploads",
          "Advanced face detection",
          "3 free haircuts per month",
          "Highest priority processing",
          "Dedicated support team",
          "Custom analysis reports",
        ],
        popular: false,
        icon: <Crown className="h-6 w-6" />,
        isSubscription: true,
      },
      {
        id: "premium",
        name: "Premium VIP",
        price: 100,
        amount: 10000,
        description: "For power users who need it all",
        features: [
          "Unlimited uploads",
          "Advanced face detection",
          "Priority processing",
          "Dedicated support team",
          "Custom analysis reports",
        ],
        popular: false,
        icon: <Crown className="h-6 w-6" />,
      },
    ],
  }

  const testimonials = [
    {
      name: "Sarah Johnson",
      role: "Photographer",
      content:
        "The Premium VIP plan has completely transformed my workflow. The unlimited uploads feature saves me so much time!",
      avatar: "/placeholder.svg?height=50&width=50",
    },
    {
      name: "Michael Chen",
      role: "Security Analyst",
      content:
        "I've been using the Standard plan for 6 months now and the live detection feature is incredibly accurate.",
      avatar: "/placeholder.svg?height=50&width=50",
    },
    {
      name: "Emma Williams",
      role: "Content Creator",
      content:
        "Even the Basic plan provides excellent value. I'm impressed with the quality of detection for such an affordable price.",
      avatar: "/placeholder.svg?height=50&width=50",
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white sm:text-5xl">
            <span className="block">Choose Your Perfect Plan</span>
          </h1>
          <p className="mt-4 text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Select the plan that best fits your needs and unlock powerful features.
          </p>

          {/* Billing toggle */}
          <div className="mt-8 flex justify-center">
            <div className="relative bg-white dark:bg-gray-800 p-1 rounded-full flex">
              <button
                onClick={() => setBillingCycle("monthly")}
                className={`${
                  billingCycle === "monthly"
                    ? "bg-blue-600 text-white"
                    : "bg-transparent text-gray-700 dark:text-gray-300"
                } relative py-2 px-6 rounded-full transition-all duration-300 font-medium`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingCycle("yearly")}
                className={`${
                  billingCycle === "yearly"
                    ? "bg-blue-600 text-white"
                    : "bg-transparent text-gray-700 dark:text-gray-300"
                } relative py-2 px-6 rounded-full transition-all duration-300 font-medium`}
              >
                Yearly
                <span className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-2 py-0.5 rounded-full">
                  Save 15%
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 lg:grid-cols-5 gap-8 mb-16">
          {plans[billingCycle].map((plan) => (
            <div
              key={plan.id}
              className={`relative bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden transition-all duration-300 hover:shadow-2xl transform hover:-translate-y-1 ${
                plan.popular ? "ring-2 ring-blue-500 scale-105 md:scale-110" : ""
              } ${plan.isSubscription ? "md:col-span-2" : ""}`}
            >
              {plan.popular && (
                <div className="absolute top-0 right-0 bg-blue-500 text-white px-4 py-1 rounded-bl-lg font-medium text-sm">
                  Most Popular
                </div>
              )}
              {plan.isSubscription && (
                <div className="absolute top-0 left-0 bg-purple-500 text-white px-4 py-1 rounded-br-lg font-medium text-sm">
                  Subscription
                </div>
              )}

              <div className="p-8">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <div
                      className={`p-2 rounded-full ${
                        plan.id === "vip_subscriber" || plan.id === "premium"
                          ? "bg-purple-100 text-purple-600 dark:bg-purple-900 dark:text-purple-300"
                          : plan.id === "normal_subscriber" || plan.id === "standard"
                            ? "bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300"
                            : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300"
                      }`}
                    >
                      {plan.icon}
                    </div>
                    <h3 className="ml-3 text-xl font-bold text-gray-900 dark:text-white">{plan.name}</h3>
                  </div>
                  {(plan.id === "premium" || plan.id === "vip_subscriber") && (
                    <span className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                      VIP
                    </span>
                  )}
                </div>

                <p className="text-gray-600 dark:text-gray-400 mb-6">{plan.description}</p>

                <div className="mb-6">
                  <span className="text-4xl font-extrabold text-gray-900 dark:text-white">${plan.price}</span>
                  <span className="text-gray-600 dark:text-gray-400">
                    /{billingCycle === "monthly" ? "mo" : "year"}
                  </span>
                </div>

                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start">
                      <Check className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                      <span className="text-gray-600 dark:text-gray-300">{feature}</span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handlePurchase(plan.amount, plan.name)}
                  className={`w-full py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center ${
                    plan.id === "vip_subscriber" || plan.id === "premium"
                      ? "bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white"
                      : plan.id === "normal_subscriber" || plan.id === "standard"
                        ? "bg-blue-600 hover:bg-blue-700 text-white"
                        : "bg-gray-200 hover:bg-gray-300 text-gray-800 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-white"
                  }`}
                >
                  {plan.id === "vip_subscriber" || plan.id === "premium" ? (
                    <>
                      <Crown className="h-5 w-5 mr-2" />
                      Get VIP Access
                    </>
                  ) : (
                    <>
                      <CreditCard className="h-5 w-5 mr-2" />
                      Select Plan
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Features comparison */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 mb-16">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Compare Plan Features</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="py-4 px-6 text-left text-gray-500 dark:text-gray-400 font-medium">Feature</th>
                  <th className="py-4 px-6 text-center text-gray-500 dark:text-gray-400 font-medium">Basic</th>
                  <th className="py-4 px-6 text-center text-gray-500 dark:text-gray-400 font-medium">Standard</th>
                  <th className="py-4 px-6 text-center text-gray-500 dark:text-gray-400 font-medium">
                    Normal Subscriber
                  </th>
                  <th className="py-4 px-6 text-center text-gray-500 dark:text-gray-400 font-medium">VIP Subscriber</th>
                  <th className="py-4 px-6 text-center text-gray-500 dark:text-gray-400 font-medium">Premium VIP</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <td className="py-4 px-6 text-gray-800 dark:text-gray-200">Image Uploads</td>
                  <td className="py-4 px-6 text-center text-gray-800 dark:text-gray-200">1 per month</td>
                  <td className="py-4 px-6 text-center text-gray-800 dark:text-gray-200">5 per month</td>
                  <td className="py-4 px-6 text-center text-gray-800 dark:text-gray-200">
                    <div className="flex items-center justify-center">
                      <Infinity className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      <span className="ml-1">Unlimited</span>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-center text-gray-800 dark:text-gray-200">
                    <div className="flex items-center justify-center">
                      <Infinity className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                      <span className="ml-1">Unlimited</span>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-center text-gray-800 dark:text-gray-200">
                    <div className="flex items-center justify-center">
                      <Infinity className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                      <span className="ml-1">Unlimited</span>
                    </div>
                  </td>
                </tr>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <td className="py-4 px-6 text-gray-800 dark:text-gray-200">Face Detection</td>
                  <td className="py-4 px-6 text-center text-gray-800 dark:text-gray-200">Basic</td>
                  <td className="py-4 px-6 text-center text-gray-800 dark:text-gray-200">Live</td>
                  <td className="py-4 px-6 text-center text-gray-800 dark:text-gray-200">Live</td>
                  <td className="py-4 px-6 text-center text-gray-800 dark:text-gray-200">Advanced</td>
                  <td className="py-4 px-6 text-center text-gray-800 dark:text-gray-200">Advanced</td>
                </tr>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <td className="py-4 px-6 text-gray-800 dark:text-gray-200">Free Haircuts</td>
                  <td className="py-4 px-6 text-center text-gray-800 dark:text-gray-200">
                    <span className="inline-block w-5 h-0.5 bg-gray-300 dark:bg-gray-600"></span>
                  </td>
                  <td className="py-4 px-6 text-center text-gray-800 dark:text-gray-200">
                    <span className="inline-block w-5 h-0.5 bg-gray-300 dark:bg-gray-600"></span>
                  </td>
                  <td className="py-4 px-6 text-center text-gray-800 dark:text-gray-200">
                    <div className="flex items-center justify-center">
                      <span className="font-medium text-blue-600 dark:text-blue-400">2 per month</span>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-center text-gray-800 dark:text-gray-200">
                    <div className="flex items-center justify-center">
                      <span className="font-medium text-purple-600 dark:text-purple-400">3 per month</span>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-center text-gray-800 dark:text-gray-200">
                    <span className="inline-block w-5 h-0.5 bg-gray-300 dark:bg-gray-600"></span>
                  </td>
                </tr>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <td className="py-4 px-6 text-gray-800 dark:text-gray-200">Processing Speed</td>
                  <td className="py-4 px-6 text-center text-gray-800 dark:text-gray-200">Standard</td>
                  <td className="py-4 px-6 text-center text-gray-800 dark:text-gray-200">
                    <div className="flex items-center justify-center">
                      <Zap className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      <span className="ml-1">Priority</span>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-center text-gray-800 dark:text-gray-200">
                    <div className="flex items-center justify-center">
                      <Zap className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      <span className="ml-1">Priority</span>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-center text-gray-800 dark:text-gray-200">
                    <div className="flex items-center justify-center">
                      <Zap className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                      <span className="ml-1">Highest Priority</span>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-center text-gray-800 dark:text-gray-200">
                    <div className="flex items-center justify-center">
                      <Zap className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                      <span className="ml-1">Highest Priority</span>
                    </div>
                  </td>
                </tr>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <td className="py-4 px-6 text-gray-800 dark:text-gray-200">Support</td>
                  <td className="py-4 px-6 text-center text-gray-800 dark:text-gray-200">Email</td>
                  <td className="py-4 px-6 text-center text-gray-800 dark:text-gray-200">24/7</td>
                  <td className="py-4 px-6 text-center text-gray-800 dark:text-gray-200">24/7</td>
                  <td className="py-4 px-6 text-center text-gray-800 dark:text-gray-200">
                    <div className="flex items-center justify-center">
                      <Star className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                      <span className="ml-1">Dedicated Team</span>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-center text-gray-800 dark:text-gray-200">
                    <div className="flex items-center justify-center">
                      <Star className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                      <span className="ml-1">Dedicated Team</span>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td className="py-4 px-6 text-gray-800 dark:text-gray-200">Custom Reports</td>
                  <td className="py-4 px-6 text-center text-gray-800 dark:text-gray-200">
                    <span className="inline-block w-5 h-0.5 bg-gray-300 dark:bg-gray-600"></span>
                  </td>
                  <td className="py-4 px-6 text-center text-gray-800 dark:text-gray-200">
                    <span className="inline-block w-5 h-0.5 bg-gray-300 dark:bg-gray-600"></span>
                  </td>
                  <td className="py-4 px-6 text-center text-gray-800 dark:text-gray-200">
                    <span className="inline-block w-5 h-0.5 bg-gray-300 dark:bg-gray-600"></span>
                  </td>
                  <td className="py-4 px-6 text-center text-gray-800 dark:text-gray-200">
                    <Check className="h-5 w-5 text-green-500 mx-auto" />
                  </td>
                  <td className="py-4 px-6 text-center text-gray-800 dark:text-gray-200">
                    <Check className="h-5 w-5 text-green-500 mx-auto" />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Why choose us */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mb-4">
              <Shield className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Secure & Private</h3>
            <p className="text-gray-600 dark:text-gray-400">
              Your data is encrypted and securely stored. We prioritize your privacy and security.
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mb-4">
              <Clock className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Fast Processing</h3>
            <p className="text-gray-600 dark:text-gray-400">
              Our advanced algorithms ensure quick and accurate results for all your detection needs.
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center mb-4">
              <Users className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Expert Support</h3>
            <p className="text-gray-600 dark:text-gray-400">
              Our team of experts is always ready to help you with any questions or issues.
            </p>
          </div>
        </div>

        {/* Testimonials */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 mb-16">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-8 text-center">What Our Customers Say</h2>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-gray-50 dark:bg-gray-700 p-6 rounded-lg">
                <div className="flex items-center mb-4">
                  <img
                    src={testimonial.avatar || "/placeholder.svg"}
                    alt={testimonial.name}
                    className="w-12 h-12 rounded-full mr-4"
                  />
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white">{testimonial.name}</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{testimonial.role}</p>
                  </div>
                </div>
                <p className="text-gray-600 dark:text-gray-300 italic">{testimonial.content}</p>
                <div className="flex mt-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 mb-16">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-8 text-center">
            Frequently Asked Questions
          </h2>

          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="font-semibold text-lg text-gray-900 dark:text-white mb-2">How do I upgrade my plan?</h3>
              <p className="text-gray-600 dark:text-gray-400">
                You can upgrade your plan at any time from your account dashboard. The new features will be available
                immediately.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-lg text-gray-900 dark:text-white mb-2">
                Can I cancel my subscription?
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Yes, you can cancel your subscription at any time. Your plan will remain active until the end of your
                billing period.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-lg text-gray-900 dark:text-white mb-2">
                What payment methods do you accept?
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                We accept all major credit cards, PayPal, and Apple Pay. All payments are processed securely through
                Stripe.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-lg text-gray-900 dark:text-white mb-2">Is there a free trial?</h3>
              <p className="text-gray-600 dark:text-gray-400">
                We offer a 7-day free trial for new users. You can try all features before committing to a paid plan.
              </p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl shadow-lg p-8 text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Ready to get started?</h2>
          <p className="text-white text-opacity-90 mb-6 max-w-2xl mx-auto">
            Join thousands of satisfied users who have transformed their experience with our premium features.
          </p>
          <button
            onClick={() => handlePurchase(plans[billingCycle][2].amount, plans[billingCycle][2].name)}
            className="bg-white text-blue-600 px-8 py-3 rounded-lg font-medium hover:bg-gray-100 transition-colors inline-flex items-center"
          >
            Get Premium VIP Now
            <ChevronRight className="h-5 w-5 ml-2" />
          </button>
        </div>
      </div>
    </div>
  )
}

