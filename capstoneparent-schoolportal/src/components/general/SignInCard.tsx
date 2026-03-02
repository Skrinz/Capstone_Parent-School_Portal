import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Link, useNavigate } from "react-router-dom"

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
	admin: "/staffview",
	teacher: "/staffview",
	librarian: "/staffview",
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
		localStorage.setItem(
			"dummyAuthUser",
			JSON.stringify({
				email: matchedAccount.email,
				name: matchedAccount.name,
				role: matchedAccount.role,
			}),
		)

		navigate(roleRedirectPath[matchedAccount.role])
	}
	
	return (
		<div className="mx-auto w-full max-w-6xl px-4 py-12 md:py-16">
			<div className="overflow-hidden rounded-3xl border border-(--button-green)/25 bg-(--signin-bg) shadow-xl">
				<div className="grid grid-cols-1 md:grid-cols-2">
					<div className="flex flex-col justify-between bg-(--button-green) p-8 text-white md:p-10">
						<div>
							<div className="mb-6 flex items-center gap-3">
								<div className="relative h-14 w-14 shrink-0 rounded-full bg-white/20 p-2">
									<img src="/Logo.png" alt="Bayog Elementary National School Logo" className="h-full w-full object-contain" />
								</div>
								<p className="text-sm font-semibold uppercase tracking-wider">Parent-School Portal</p>
							</div>
							<h1 className="text-4xl font-bold leading-tight">Welcome Back</h1>
							<p className="mt-3 text-sm text-white/90">
								Sign in to access student records, updates, and your personalized dashboard.
							</p>
						</div>
						<div className="mt-8 rounded-2xl border border-white/30 bg-white/10 p-4 text-sm backdrop-blur-sm">
							<p className="mb-2 font-semibold">Dummy Accounts (Temporary)</p>
							<ul className="space-y-1.5 text-white/95">
								<li>Admin: admin@portal.com / admin123</li>
								<li>Teacher: teacher@portal.com / teacher123</li>
								<li>Librarian: librarian@portal.com / librarian123</li>
								<li>Parent 1: parent1@portal.com / parent123</li>
								<li>Parent 2: parent2@portal.com / parent123</li>
							</ul>
						</div>
					</div>

					<div className="p-8 md:p-10">
						<div className="mb-8">
							<h2 className="text-3xl font-bold text-gray-900">Login</h2>
							<p className="mt-1 text-sm text-gray-600">Enter your credentials to continue.</p>
						</div>

						<form onSubmit={handleSubmit} className="space-y-5">
							<div className="space-y-2">
								<label className="text-sm font-medium text-gray-700">Email</label>
								<Input
									type="email"
									placeholder="you@example.com"
									value={email}
									onChange={(e) => setEmail(e.target.value)}
									required
									className="h-12 rounded-xl border border-gray-300 bg-white px-4 text-base placeholder:text-gray-400 focus-visible:ring-2 focus-visible:ring-(--button-green)"
								/>
							</div>

							<div className="space-y-2">
								<label className="text-sm font-medium text-gray-700">Password</label>
								<Input
									type="password"
									placeholder="Enter your password"
									value={password}
									onChange={(e) => setPassword(e.target.value)}
									required
									className="h-12 rounded-xl border border-gray-300 bg-white px-4 text-base placeholder:text-gray-400 focus-visible:ring-2 focus-visible:ring-(--button-green)"
								/>
							</div>

							<div className="flex items-center justify-between text-sm">
								<span className="text-gray-600">Forgot your password?</span>
								<Link to="/forgotpassword" className="font-semibold text-(--button-green) hover:underline">
									Reset here
								</Link>
							</div>

							{errorMessage ? (
								<p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">{errorMessage}</p>
							) : null}

							<Button
								type="submit"
								className="h-12 w-full rounded-xl bg-(--button-green) text-base font-semibold text-white transition-colors hover:bg-(--button-hover-green)"
							>
								Sign In
							</Button>
						</form>
					</div>
				</div>
			</div>
		</div>
	)
}