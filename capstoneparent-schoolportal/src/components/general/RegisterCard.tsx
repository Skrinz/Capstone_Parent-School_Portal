import { useRef, useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Trash2, Upload, Plus } from "lucide-react"
import { useNavigate } from "react-router-dom"

type RegistrationStep = "form" | "otp" | "complete"

const FILE_INPUT_ID = "register-file-upload"

const getErrorMessage = (error: unknown, fallback: string): string => {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message
  }
  return fallback
}

const readApiMessage = async (response: Response): Promise<string> => {
  const parsed = await response.json().catch(() => null) as { message?: string } | null
  return parsed?.message || ""
}

export const RegisterCard = ()  =>{
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    contact: "",
    address: "",
    email: "",
    password: "",
    confirmPassword: ""
  })
  const [students, setStudents] = useState([{ id: 1, lrn: "" }])
  const nextStudentId = useRef(2)
  const nextFileId = useRef(1)
  const [uploadedFiles, setUploadedFiles] = useState<{ id: number; file: File }[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [step, setStep] = useState<RegistrationStep>("form")
  const [pendingEmail, setPendingEmail] = useState("")
  const [otpCode, setOtpCode] = useState("")
  const [errorMessage, setErrorMessage] = useState("")
  const [infoMessage, setInfoMessage] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false)

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleStudentChange = (id: number, lrn: string) => {
    setStudents(prevStudents =>
      prevStudents.map(student =>
        student.id === id ? { ...student, lrn } : student
      )
    )
  }

  const addStudent = () => {
    const id = nextStudentId.current
    nextStudentId.current += 1
    setStudents(prevStudents => [...prevStudents, { id, lrn: "" }])
  }

  const removeStudent = (id: number) => {
    setStudents(prevStudents => prevStudents.filter(student => student.id !== id))
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (files) {
      const newFiles = Array.from(files).map((file) => ({
        id: nextFileId.current++,
        file
      }))
      setUploadedFiles(prev => [...prev, ...newFiles])
    }
  }

  const removeFile = (index: number) => {
    setUploadedFiles(uploadedFiles.filter((_, i) => i !== index))
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const files = e.dataTransfer.files
    if (files && files.length > 0) {
      const newFiles = Array.from(files).map((file) => ({
        id: nextFileId.current++,
        file
      }))
      setUploadedFiles(prev => [...prev, ...newFiles])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage("")
    setInfoMessage("")

    if (formData.password !== formData.confirmPassword) {
      setErrorMessage("Passwords do not match")
      return
    }

    const cleanedStudentIds = students
      .map((student) => student.lrn.trim())
      .filter((studentLrn) => studentLrn.length > 0)

    if (cleanedStudentIds.length === 0) {
      setErrorMessage("At least one student LRN is required")
      return
    }

    if (cleanedStudentIds.some((studentLrn) => !/^\d+$/.test(studentLrn))) {
      setErrorMessage("Student LRN must contain numbers only")
      return
    }

    if (uploadedFiles.length === 0) {
      setErrorMessage("Please upload at least one supporting document")
      return
    }

    setIsSubmitting(true)

    try {
      const payload = new FormData()
      payload.append("fname", formData.firstName.trim())
      payload.append("lname", formData.lastName.trim())
      payload.append("contact_num", formData.contact.trim())
      payload.append("address", formData.address.trim())
      payload.append("email", formData.email.trim())
      payload.append("password", formData.password)
      payload.append("role", "Parent")

      for (const studentId of cleanedStudentIds) {
        payload.append("student_ids", studentId)
      }

      for (const fileObj of uploadedFiles) {
        payload.append("attachments", fileObj.file)
      }

      const response = await fetch("/api/auth/register", {
        method: "POST",
        body: payload,
      })

      const apiMessage = await readApiMessage(response)
      if (!response.ok) {
        throw new Error(apiMessage || "Unable to submit registration right now")
      }

      setPendingEmail(formData.email.trim().toLowerCase())
      setStep("otp")
      setOtpCode("")
      setInfoMessage(apiMessage || "OTP sent to your email. Enter it below to continue.")
    } catch (error) {
      setErrorMessage(getErrorMessage(error, "Unable to submit registration right now"))
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage("")
    setInfoMessage("")

    if (otpCode.length !== 6) {
      setErrorMessage("OTP code must be exactly 6 digits")
      return
    }

    setIsVerifyingOtp(true)

    try {
      const response = await fetch("/api/auth/verify-otp-code", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: pendingEmail,
          otpCode,
        }),
      })

      const apiMessage = await readApiMessage(response)
      if (!response.ok) {
        throw new Error(apiMessage || "Unable to verify OTP")
      }

      setStep("complete")
      setInfoMessage(apiMessage || "Email verified successfully")
    } catch (error) {
      setErrorMessage(getErrorMessage(error, "Unable to verify OTP"))
    } finally {
      setIsVerifyingOtp(false)
    }
  }

  return (
    <div className="mt-20">
      <div className="bg-[#f9f6c8] rounded-3xl p-8 pt-10 mx-auto max-w-7xl">
        {errorMessage ? (
          <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {errorMessage}
          </p>
        ) : null}

        {infoMessage ? (
          <p className="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            {infoMessage}
          </p>
        ) : null}

        {step === "form" ? (
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto_1fr] gap-8">
            {/* Left Section - Parent Information */}
            <div className="space-y-6">
              <div className="flex items-center gap-4 mb-8">
                <div className="relative h-20 w-20 shrink-0">
                  <img src="/Logo.png" alt="School Logo" className="object-contain h-full w-full" />
                </div>
                <h1 className="text-3xl font-bold text-gray-900">Register as a Parent</h1>
              </div>

              <div className="space-y-4">
                <Input
                  type="text"
                  placeholder="First Name"
                  value={formData.firstName}
                  onChange={(e) => handleInputChange("firstName", e.target.value)}
                  className="h-14 rounded-full border-2 border-gray-900 bg-white px-6 text-lg placeholder:text-gray-500"
                />
                <Input
                  type="text"
                  placeholder="Last Name"
                  value={formData.lastName}
                  onChange={(e) => handleInputChange("lastName", e.target.value)}
                  className="h-14 rounded-full border-2 border-gray-900 bg-white px-6 text-lg placeholder:text-gray-500"
                />
                <Input
                  type="tel"
                  placeholder="Contact Number"
                  value={formData.contact}
                  onChange={(e) => handleInputChange("contact", e.target.value)}
                  className="h-14 rounded-full border-2 border-gray-900 bg-white px-6 text-lg placeholder:text-gray-500"
                />
                <Input
                  type="text"
                  placeholder="Address"
                  value={formData.address}
                  onChange={(e) => handleInputChange("address", e.target.value)}
                  className="h-14 rounded-full border-2 border-gray-900 bg-white px-6 text-lg placeholder:text-gray-500"
                />
                <Input
                  type="email"
                  placeholder="Email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  className="h-14 rounded-full border-2 border-gray-900 bg-white px-6 text-lg placeholder:text-gray-500"
                />
                <Input
                  type="password"
                  placeholder="Password"
                  value={formData.password}
                  onChange={(e) => handleInputChange("password", e.target.value)}
                  className="h-14 rounded-full border-2 border-gray-900 bg-white px-6 text-lg placeholder:text-gray-500"
                />
                <Input
                  type="password"
                  placeholder="Confirm Password"
                  value={formData.confirmPassword}
                  onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                  className="h-14 rounded-full border-2 border-gray-900 bg-white px-6 text-lg placeholder:text-gray-500"
                />
              </div>
            </div>

            {/* Divider */}
            <div className="hidden lg:block w-px bg-gray-900" />

            {/* Right Section - Children Information */}
            <div className="space-y-6">
              <h2 className="text-3xl font-bold text-gray-900 text-center mb-8">Children</h2>

              {/* Registration Requirements */}
              <div className="space-y-3 mb-8">
                <p className="text-red-700 italic font-semibold text-base">Registration Requirements:</p>
                <ul className="space-y-2 text-red-700 font-bold text-base list-disc list-inside">
                  <li>
                    <span className="italic">Parent's Birth Certificate</span>
                  </li>
                  <li>
                    <span className="italic">Government-issued ID</span>{" "}
                    <span className="italic font-normal">if Parent's Birth Certificate is not available.</span>
                  </li>
                  <li>
                    <span className="italic">Child's Birth Certificate</span>
                  </li>
                </ul>
              </div>

              {/* Student LRN Inputs */}
              <div className="space-y-4">
                {students.map((student) => (
                  <div key={student.id} className="flex gap-2">
                    <Input
                      type="text"
                      placeholder="Student LRN"
                      value={student.lrn}
                      onChange={(e) => handleStudentChange(student.id, e.target.value)}
                      className="h-14 rounded-full border-2 border-gray-900 bg-white px-6 text-lg placeholder:text-gray-500 flex-1"
                    />
                    {students.length > 1 && (
                      <Button
                        type="button"
                        onClick={() => removeStudent(student.id)}
                        className="h-14 w-14 rounded-full bg-red-600 hover:bg-red-700 text-white"
                      >
                        <Trash2 className="h-5 w-5" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>

              {/* Add Another Student Button */}
              <Button
                type="button"
                onClick={addStudent}
                className="w-full h-12 rounded-lg bg-[#52a86a] hover:bg-[#449558] text-white font-semibold text-lg flex items-center justify-center gap-2"
              >
                Add another student
                <Plus className="h-5 w-5" />
              </Button>

              {/* File Upload Button */}
              <div>
                <input
                  type="file"
                  multiple
                  onChange={handleFileUpload}
                  className="hidden"
                  id={FILE_INPUT_ID}
                />
                <Button
                  type="button"
                  onClick={() => document.getElementById(FILE_INPUT_ID)?.click()}
                  className="w-full h-12 rounded-lg bg-[#c4d433] hover:bg-[#b0c020] text-gray-900 font-semibold text-lg flex items-center justify-center gap-2"
                >
                  File Upload
                  <Plus className="h-5 w-5" />
                </Button>
              </div>

              {/* File Upload Area */}
              <div
                className={`border-4 border-dashed ${
                  isDragging ? "border-green-600 bg-green-50" : "border-gray-400"
                } rounded-2xl p-8 text-center bg-white transition-colors cursor-pointer hover:border-green-500 hover:bg-green-50`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => document.getElementById(FILE_INPUT_ID)?.click()}
              >
                <div className="cursor-pointer flex flex-col items-center gap-3">
                  <Upload className="w-12 h-12 text-gray-600" />
                  <p className="text-xl font-medium text-gray-800">Drag & Drop or Click to Upload Files</p>
                </div>
              </div>

              {/* Uploaded Files List */}
              <div className="space-y-3">
                {uploadedFiles.map((fileObj, index) => (
                  <div
                    key={fileObj.id}
                    className="flex items-center justify-between bg-white border-2 border-gray-300 rounded-xl px-6 py-3"
                  >
                    <span className="text-lg">{fileObj.file.name}</span>
                    <button type="button" onClick={() => removeFile(index)} className="text-red-600 hover:text-red-700">
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Submit Button */}
              <div className="flex justify-end pt-4">
                <Button disabled={isSubmitting} className="h-14 px-12 bg-[#4a9d5f] hover:bg-[#3d8550] text-white rounded-full text-xl font-semibold disabled:opacity-60">
                  {isSubmitting ? "Submitting..." : "Submit Registration"}
                </Button>
              </div>
            </div>
            </div>
          </form>
        ) : null}

        {step === "otp" ? (
          <form onSubmit={handleVerifyOtp} className="mx-auto max-w-xl rounded-2xl bg-white p-8">
            <h2 className="text-3xl font-bold text-gray-900 text-center">Verify Email OTP</h2>
            <p className="mt-4 text-center text-gray-700">
              Enter the 6-digit code sent to <span className="font-semibold">{pendingEmail}</span>.
            </p>

            <Input
              type="text"
              inputMode="numeric"
              placeholder="6-digit OTP"
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              className="mt-6 h-14 rounded-full border-2 border-gray-900 bg-white px-6 text-center text-2xl tracking-[0.4em] placeholder:tracking-normal"
            />

            <div className="mt-8 flex justify-center gap-4">
              <Button
                type="button"
                className="h-12 rounded-full bg-gray-500 px-8 text-white hover:bg-gray-600"
                onClick={() => {
                  setStep("form")
                  setOtpCode("")
                  setErrorMessage("")
                  setInfoMessage("")
                }}
              >
                Back
              </Button>
              <Button
                type="submit"
                disabled={isVerifyingOtp}
                className="h-12 rounded-full bg-[#4a9d5f] px-10 text-white hover:bg-[#3d8550] disabled:opacity-60"
              >
                {isVerifyingOtp ? "Verifying..." : "Verify OTP"}
              </Button>
            </div>
          </form>
        ) : null}

        {step === "complete" ? (
          <div className="mx-auto max-w-xl rounded-2xl bg-white p-8 text-center">
            <h2 className="text-3xl font-bold text-gray-900">Registration Complete</h2>
            <p className="mt-4 text-gray-700">
              Your email has been verified. Your parent account is now pending activation by an administrator.
            </p>
            <Button
              type="button"
              className="mt-8 h-12 rounded-full bg-[#4a9d5f] px-10 text-white hover:bg-[#3d8550]"
              onClick={() => navigate("/login")}
            >
              Go to Login
            </Button>
          </div>
        ) : null}
      </div>
    </div>

  )
}
