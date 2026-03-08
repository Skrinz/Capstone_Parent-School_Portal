import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Link, useNavigate } from "react-router-dom"
import { setAuthUser } from "@/lib/auth"

type DummyRole = "admin" | "teacher" | "librarian" | "parent"

type DummyAccount = {
	email: string
	password: string
	role: DummyRole
	name: string
}

const dummyAccounts: DummyAccount[] = [
	{ email: "admin@portal.com", password: "admin123", role: "admin", name: "Admin User" },
	{ email: "teacher@portal.com", password: "teacher123", role: "teacher", name: "Teacher User" },
	{ email: "librarian@portal.com", password: "librarian123", role: "librarian", name: "Librarian User" },
	{ email: "parent1@portal.com", password: "parent123", role: "parent", name: "Parent One" },
	{ email: "parent2@portal.com", password: "parent123", role: "parent", name: "Parent Two" },
]

const roleRedirectPath: Record<DummyRole, string> = {
	admin: "/adminview",
	teacher: "/teacherview",
	librarian: "/librarianview",
	parent: "/parentview",
}

export const SignInCard = () => {
	const [email, setEmail] = useState("")
	const [password, setPassword] = useState("")
	const [errorMessage, setErrorMessage] = useState("")
	const navigate = useNavigate()

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault()

		const normalizedEmail = email.trim().toLowerCase()

		const matchedAccount = dummyAccounts.find(
			(account) =>
				account.email.toLowerCase() === normalizedEmail,
		)

		if (!matchedAccount) {
			setErrorMessage("Invalid email or password.")
			return
		}

		const passwordKey = `dummyAuthPassword:${matchedAccount.email.toLowerCase()}`
		const savedOverridePassword = localStorage.getItem(passwordKey)
		const effectivePassword = savedOverridePassword ?? matchedAccount.password

		if (password !== effectivePassword) {
			setErrorMessage("Invalid email or password.")
			return
		}

		setErrorMessage("")
		setAuthUser({
			email: matchedAccount.email,
			name: matchedAccount.name,
			role: matchedAccount.role,
		})

		navigate(roleRedirectPath[matchedAccount.role])
	}
	
	return (
		<div className="min-h-[calc(100vh-96px)] bg-white px-4 py-12 md:py-16">
			<div className="mx-auto w-full max-w-xl rounded-2xl bg-(--signin-bg) px-8 py-10 md:px-12 md:py-12">
				<div className="mb-8 flex items-center gap-3">
					<img
						src="/Logo.png"
						alt="Bayog Elementary National School Logo"
						className="h-16 w-16 object-contain"
					/>
					<h1 className="text-4xl font-bold text-gray-900">Login</h1>
				</div>

				<form onSubmit={handleSubmit} className="space-y-5">
					<Input
						type="email"
						placeholder="Email"
						value={email}
						onChange={(e) => setEmail(e.target.value)}
						required
						className="h-13 rounded-2xl border border-gray-500 bg-gray-100 px-6 text-3xl text-gray-800 placeholder:text-gray-500 focus-visible:ring-2 focus-visible:ring-(--button-green)"
					/>

					<Input
						type="password"
						placeholder="Password"
						value={password}
						onChange={(e) => setPassword(e.target.value)}
						required
						className="h-13 rounded-2xl border border-gray-500 bg-gray-100 px-6 text-3xl text-gray-800 placeholder:text-gray-500 focus-visible:ring-2 focus-visible:ring-(--button-green)"
					/>

					<p className="text-sm text-gray-900">
						Forgot password?{" "}
						<Link to="/forgotpassword" className="font-medium text-blue-600 hover:underline">
							Click here
						</Link>
					</p>

					{errorMessage ? (
						<p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">{errorMessage}</p>
					) : null}

					<div className="pt-3 text-center">
						<Button
							type="submit"
							className="h-12 min-w-36 rounded-full bg-(--button-green) px-10 text-2xl font-semibold text-white transition-colors hover:bg-(--button-hover-green)"
						>
							Sign In
						</Button>
					</div>
				</form>
			</div>
		</div>
	)
}