"use client"

import { useState, useEffect } from "react"
import axios from "axios"
import { useAuth } from "../../contexts/AuthContext"
import {
    User,
    Edit2,
    Save,
    X,
    CheckCircle,
    AlertCircle,
    Scissors,
    Camera,
    Star,
    // eslint-disable-next-line no-unused-vars
    MapPin,
    Package,
    Zap,
    Award,
    Clock,
} from "lucide-react"

export default function Profile() {
    const { userId } = useAuth()
    const [profile, setProfile] = useState(null)
    const [loading, setLoading] = useState(true)
    const [editMode, setEditMode] = useState(false)
    const [error, setError] = useState("")
    const [success, setSuccess] = useState("")
    const [selectedSpecialties, setSelectedSpecialties] = useState([])
    const [newPassword, setNewPassword] = useState("")
    const [profilePicture, setProfilePicture] = useState(null)
    const [previewUrl, setPreviewUrl] = useState(null)

    const ALL_SPECIALTIES = ["Fade", "Beard Trim", "Undercut", "Buzz Cut", "Hair Tattoo", "Scissor Cut"]

    useEffect(() => {
        if (!userId) {
            setError("No user ID found")
            setLoading(false)
            return
        }
    
        const fetchProfile = async () => {
            try {
                setLoading(true)
                const res = await axios.get(`http://localhost:8443/profile/get/${userId}`)
                setProfile(res.data)
    
                if (res.data.role === "BARBER" && res.data.specialty) {
                    const specialties = res.data.specialty.split(",").map((s) => s.trim())
                    setSelectedSpecialties(specialties)
                }
    
                // Set preview URL with full server path
                if (res.data.picturePath) {
                    setPreviewUrl(`http://localhost:8443/${res.data.picturePath}`)
                } else {
                    setPreviewUrl(null)
                }
            } catch (err) {
                console.error("Failed to fetch user data:", err)
                setError(err.response?.data || err.message || "Error loading profile")
            } finally {
                setLoading(false)
            }
        }
    
        fetchProfile()
    }, [userId])

    // Handle text input changes for normal fields
    const handleInputChange = (e) => {
        const { name, value } = e.target
        setProfile((prev) => ({ ...prev, [name]: value }))
    }

    // Handle the new password field separately
    const handlePasswordChange = (e) => {
        setNewPassword(e.target.value)
    }

    // Handle specialty selection
    const handleSpecialtyChange = (e) => {
        const options = e.target.options
        const chosen = []
        for (let i = 0; i < options.length; i++) {
            if (options[i].selected) chosen.push(options[i].value)
        }
        // Enforce max 3
        if (chosen.length <= 3) {
            setSelectedSpecialties(chosen)
        } else {
            alert("You can only select up to 3 specialties!")
        }
    }

    // Handle profile picture change
    const handlePictureChange = (e) => {
        const file = e.target.files[0]
        if (file) {
            setProfilePicture(file)
            // Create a preview URL
            const reader = new FileReader()
            reader.onloadend = () => {
                setPreviewUrl(reader.result)
            }
            reader.readAsDataURL(file)
        }
    }
    const handleDelete = async () => {
        if (!window.confirm("Are you sure you want to delete your account? This action cannot be undone.")) {
          return;
        }
        try {
          await axios.delete(`http://localhost:8443/profile/delete/${userId}`);
          // Then log out or redirect
          alert("Account deleted. Sorry to see you go!");
          // e.g. navigate to home or clear auth context
        } catch (err) {
          console.error("Failed to delete account:", err);
          alert("Error deleting account. Check console for details.");
        }
      };
      const handleSave = async () => {
        try {
            setLoading(true)
            setError("")
    
            const formData = new FormData()
            formData.append("username", profile.username)
            if (newPassword.trim()) {
                formData.append("newPassword", newPassword.trim())
            }
            if (profile.role === "BARBER") {
                const specialtiesString = selectedSpecialties.join(", ")
                formData.append("specialty", specialtiesString)
            }
            if (profilePicture) {
                formData.append("pictureFile", profilePicture)
            }
    
            const res = await axios.put(
                `http://localhost:8443/profile/update/${userId}`,
                formData,
                { headers: { "Content-Type": "multipart/form-data" } }
            )
    
            setProfile(res.data)
            setEditMode(false)
            setNewPassword("")
            setProfilePicture(null)
            // Reset previewUrl to new server path or null
            setPreviewUrl(res.data.picturePath ? `http://localhost:8443/${res.data.picturePath}` : null)
            setSuccess("Profile updated successfully!")
    
            setTimeout(() => setSuccess(""), 3000)
        } catch (err) {
            console.error("Failed to update profile:", err)
            setError(err.response?.data || err.message || "Error updating profile")
        } finally {
            setLoading(false)
        }
    }

    if (loading && !profile) {
        return (
            <div className="min-h-screen flex justify-center items-center bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 py-20 px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4 flex justify-between items-center">
                    <h1 className="text-2xl font-bold text-white">My Profile</h1>
                    {!editMode ? (
                        <button
                            onClick={() => setEditMode(true)}
                            className="flex items-center bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg transition-colors"
                        >
                            <Edit2 className="h-4 w-4 mr-2" />
                            Edit Profile
                        </button>
                    ) : (
                        <button
                            onClick={() => {
                                setEditMode(false)
                                setNewPassword("")
                                setPreviewUrl(profile.picturePath ? `http://localhost:8443/${profile.picturePath}` : null)
                                setProfilePicture(null)
                            }}
                            className="flex items-center bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg transition-colors"
                        >
                            <X className="h-4 w-4 mr-2" />
                            Cancel
                        </button>
                    )}
                </div>

                {/* Success Message */}
                {success && (
                    <div className="px-6 py-3 bg-green-50 text-green-700 flex items-center">
                        <CheckCircle className="h-5 w-5 mr-2" />
                        <p>{success}</p>
                    </div>
                )}

                {/* Error Message */}
                {error && (
                    <div className="px-6 py-3 bg-red-50 text-red-700 flex items-center">
                        <AlertCircle className="h-5 w-5 mr-2" />
                        <p>{error}</p>
                    </div>
                )}

                <div className="p-6">
                    {/* Profile Picture Section */}
                    <div className="flex flex-col sm:flex-row items-center mb-8 gap-6">
                        <div className="relative">
                        <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-200">
                                    {previewUrl ? (
                                        <img src={previewUrl} alt="Profile" className="w-full h-full object-cover" />
                                    ) : (
                                        profile?.picturePath ? (
                                            <img src={`http://localhost:8443/${profile.picturePath}`} alt="Profile" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <User className="h-16 w-16 text-gray-400" />
                                            </div>
                                        )
                                    )}
                                </div>
                            {editMode && (
                                <label
                                    htmlFor="profile-picture"
                                    className="absolute bottom-0 right-0 bg-indigo-600 hover:bg-indigo-700 text-white p-2 rounded-full cursor-pointer shadow-lg"
                                >
                                    <Camera className="h-5 w-5" />
                                    <input
                                        type="file"
                                        id="profile-picture"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={handlePictureChange}
                                    />
                                </label>
                            )}
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900">{profile?.username || "User"}</h2>
                            <p className="text-gray-600 flex items-center">
                                {profile?.role === "BARBER" ? (
                                    <>
                                        <Scissors className="h-4 w-4 mr-1" />
                                        Barber
                                    </>
                                ) : (
                                    <>
                                        <User className="h-4 w-4 mr-1" />
                                        Client
                                    </>
                                )}
                            </p>
                            {profile?.role === "BARBER" && profile?.rating && (
                                <div className="flex items-center mt-1">
                                    <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                                    <span className="ml-1 text-gray-700">{profile.rating.toFixed(1)}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Edit Form or View Profile */}
                    {editMode ? (
                        <div className="space-y-6">
                            {/* Username */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                                <input
                                    name="username"
                                    value={profile.username || ""}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                />
                            </div>

                            {/* New Password Field */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                                <input
                                    type="password"
                                    placeholder="Leave blank to keep existing password"
                                    value={newPassword}
                                    onChange={handlePasswordChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                />
                            </div>

                            {/* Barber Specific Fields */}
                            {profile.role === "BARBER" && (
                                <div className="space-y-6 p-6 bg-indigo-50 rounded-xl border border-indigo-100">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4 border-b border-indigo-200 pb-2">
                                        Barber Information
                                    </h3>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Specialties (up to 3)</label>
                                        <select
                                            multiple
                                            value={selectedSpecialties}
                                            onChange={handleSpecialtyChange}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                            style={{ height: "120px" }}
                                        >
                                            {ALL_SPECIALTIES.map((spec) => (
                                                <option key={spec} value={spec}>
                                                    {spec}
                                                </option>
                                            ))}
                                        </select>
                                        <p className="mt-1 text-sm text-gray-500">Hold Ctrl/Cmd to select multiple options</p>
                                    </div>

                                    <p className="text-sm text-gray-600 flex items-center">
                                        <Star className="h-4 w-4 text-yellow-400 fill-yellow-400 mr-1" />
                                        Current rating: {profile.rating?.toFixed(2)} (cannot be edited)
                                    </p>


                                </div>
                            )}

                            {/* Client Specific Fields */}
                            {profile.role === "CLIENT" && (
                                <>
                                    <div className="space-y-6 p-6 bg-purple-50 rounded-xl border border-purple-100">
                                        <h3 className="text-lg font-semibold text-gray-900 mb-4 border-b border-purple-200 pb-2">
                                            Client Information
                                        </h3>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Face Shape</label>
                                            <select
                                                name="faceShape"
                                                value={profile.faceShape || ""}
                                                onChange={handleInputChange}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                            >
                                                <option value="">Select Face Shape</option>
                                                <option value="Oval">Oval</option>
                                                <option value="Round">Round</option>
                                                <option value="Square">Square</option>
                                                <option value="Heart">Heart</option>
                                                <option value="Diamond">Diamond</option>
                                            </select>
                                        </div>

                                        {/* Show subscription read-only */}
                                        {profile.subscriptionId && (
                                            <div className="bg-white p-4 rounded-lg border border-purple-100">
                                                <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                                                    <Package className="h-4 w-4 mr-1 text-purple-500" />
                                                    Subscription Information
                                                </h4>
                                                <p className="text-gray-700">Type: {profile.subscriptionName}</p>
                                                <p className="text-gray-700">ID: {profile.subscriptionId}</p>
                                                <p className="text-sm text-gray-500 mt-1">(Subscription details cannot be edited here)</p>
                                            </div>
                                        )}
                                    </div>
                                    <div className="space-y-4 p-6 bg-gray-50 rounded-xl border border-gray-200">
                                        <h3 className="text-lg font-semibold text-gray-900 mb-4 border-b border-gray-200 pb-2">
                                            Subscription Features
                                        </h3>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {profile.unlimitedAccess && (
                                                <div className="flex items-center p-3 bg-green-50 border border-green-100 rounded-lg">
                                                    <Zap className="h-5 w-5 text-green-500 mr-2" />
                                                    <span className="text-green-700 font-medium">Unlimited Access</span>
                                                </div>
                                            )}

                                            {profile.normalSubscriber && (
                                                <div className="flex items-center p-3 bg-blue-50 border border-blue-100 rounded-lg">
                                                    <Award className="h-5 w-5 text-blue-500 mr-2" />
                                                    <span className="text-blue-700 font-medium">Normal Subscription</span>
                                                </div>
                                            )}

                                            {profile.vipsubscriber && (
                                                <div className="flex items-center p-3 bg-purple-50 border border-purple-100 rounded-lg">
                                                    <Award className="h-5 w-5 text-purple-500 mr-2" />
                                                    <span className="text-purple-700 font-medium">VIP Subscription</span>
                                                </div>
                                            )}

                                            {profile.freeTrialsRemaining > 0 && (
                                                <div className="flex items-center p-3 bg-yellow-50 border border-yellow-100 rounded-lg">
                                                    <Clock className="h-5 w-5 text-yellow-500 mr-2" />
                                                    <span className="text-yellow-700 font-medium">
                                                        {profile.freeTrialsRemaining} Free Trials Remaining
                                                    </span>
                                                </div>
                                            )}

                                            {profile.liveTrialsRemaining > 0 && (
                                                <div className="flex items-center p-3 bg-orange-50 border border-orange-100 rounded-lg">
                                                    <Clock className="h-5 w-5 text-orange-500 mr-2" />
                                                    <span className="text-orange-700 font-medium">
                                                        {profile.liveTrialsRemaining} Live Trials Remaining
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </>
                            )}

                            {/* Subscription Features */}


                            {/* Save Button */}
                            <div className="flex justify-end pt-6">
                                <button
                                    onClick={handleSave}
                                    disabled={loading}
                                    className="flex items-center px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
                                >
                                    {loading ? (
                                        <>
                                            <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            <Save className="h-4 w-4 mr-2" />
                                            Save Changes
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-8">
                            {/* Basic Information */}
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-4 border-b border-gray-200 pb-2">
                                    Basic Information
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <p className="text-sm text-gray-500">Username</p>
                                        <p className="text-gray-900 font-medium">{profile.username}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Role</p>
                                        <p className="text-gray-900 font-medium capitalize">{profile.role}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Barber Information */}
                            {profile.role === "BARBER" && (
                                <div className="p-6 bg-indigo-50 rounded-xl border border-indigo-100">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4 border-b border-indigo-200 pb-2">
                                        Barber Information
                                    </h3>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                        <div>
                                            <p className="text-sm text-gray-500">Specialty</p>
                                            <p className="text-gray-900 font-medium">{profile.specialty || "Not specified"}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500">Rating</p>
                                            <div className="flex items-center">
                                                <Star className="h-5 w-5 text-yellow-400 fill-yellow-400 mr-1" />
                                                <span className="text-gray-900 font-medium">{profile.rating?.toFixed(2)}</span>
                                            </div>
                                        </div>
                                    </div>


                                </div>
                            )}

                            {/* Client Information */}
                            {profile.role === "CLIENT" && (
                                <><div className="p-6 bg-purple-50 rounded-xl border border-purple-100">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4 border-b border-purple-200 pb-2">
                                        Client Information
                                    </h3>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                        <div>
                                            <p className="text-sm text-gray-500">Face Shape</p>
                                            <p className="text-gray-900 font-medium capitalize">{profile.faceShape || "Not specified"}</p>
                                        </div>

                                        {profile.subscriptionId && (
                                            <div>
                                                <p className="text-sm text-gray-500">Subscription</p>
                                                <div className="flex items-center">
                                                    <Package className="h-4 w-4 text-purple-500 mr-1" />
                                                    <span className="text-gray-900 font-medium">{profile.subscriptionName}</span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                    <div className="p-6 bg-gray-50 rounded-xl border border-gray-200">
                                        <h3 className="text-lg font-semibold text-gray-900 mb-4 border-b border-gray-200 pb-2">
                                            Subscription Features
                                        </h3>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {profile.unlimitedAccess && (
                                                <div className="flex items-center p-3 bg-green-50 border border-green-100 rounded-lg">
                                                    <Zap className="h-5 w-5 text-green-500 mr-2" />
                                                    <span className="text-green-700 font-medium">Unlimited Access</span>
                                                </div>
                                            )}

                                            {profile.normalSubscriber && (
                                                <div className="flex items-center p-3 bg-blue-50 border border-blue-100 rounded-lg">
                                                    <Award className="h-5 w-5 text-blue-500 mr-2" />
                                                    <span className="text-blue-700 font-medium">Normal Subscription</span>
                                                </div>
                                            )}

                                            {profile.vipsubscriber && (
                                                <div className="flex items-center p-3 bg-purple-50 border border-purple-100 rounded-lg">
                                                    <Award className="h-5 w-5 text-purple-500 mr-2" />
                                                    <span className="text-purple-700 font-medium">VIP Subscription</span>
                                                </div>
                                            )}

                                            {profile.freeTrialsRemaining > 0 && (
                                                <div className="flex items-center p-3 bg-yellow-50 border border-yellow-100 rounded-lg">
                                                    <Clock className="h-5 w-5 text-yellow-500 mr-2" />
                                                    <span className="text-yellow-700 font-medium">
                                                        {profile.freeTrialsRemaining} Free Trials Remaining
                                                    </span>
                                                </div>
                                            )}

                                            {profile.liveTrialsRemaining > 0 && (
                                                <div className="flex items-center p-3 bg-orange-50 border border-orange-100 rounded-lg">
                                                    <Clock className="h-5 w-5 text-orange-500 mr-2" />
                                                    <span className="text-orange-700 font-medium">
                                                        {profile.liveTrialsRemaining} Live Trials Remaining
                                                    </span>
                                                </div>
                                            )}
                                        </div>

                                        {!profile.unlimitedAccess &&
                                            !profile.normalSubscriber &&
                                            !profile.vipsubscriber &&
                                            !profile.freeTrialsRemaining &&
                                            !profile.liveTrialsRemaining && (
                                                <p className="text-gray-500 text-center py-4">No active subscription features</p>
                                            )}
                                    </div>
                                </>
                            )}



                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
                    <div className="flex flex-wrap gap-4">

                        <button
                            className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition-colors"
                            onClick={handleDelete}
                        >
                            Delete Account
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

