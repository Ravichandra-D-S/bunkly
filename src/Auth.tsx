import { useState } from "react"
import { supabase } from "./supabase"

type AuthProps = {
  onLogin: () => void
}

function Auth({ onLogin }: AuthProps) {
  const [isRegistering, setIsRegistering] =
    useState(false)

  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] =
    useState("")

  const [loading, setLoading] =
    useState(false)

  const [message, setMessage] =
    useState("")

  const handleSubmit = async (
    event: React.FormEvent
  ) => {
    event.preventDefault()

    setMessage("")

    const cleanEmail =
      email.trim().toLowerCase()

    if (
      isRegistering &&
      !name.trim()
    ) {
      setMessage(
        "Please enter your name."
      )
      return
    }

    if (!cleanEmail || !password) {
      setMessage(
        "Please enter your email and password."
      )
      return
    }

    if (password.length < 6) {
      setMessage(
        "Password must be at least 6 characters."
      )
      return
    }

    setLoading(true)

    if (isRegistering) {
      const {
        data,
        error,
      } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          data: {
            full_name: name.trim(),
          },
        },
      })

      if (error) {
        setMessage(error.message)
      } else if (
        data.session
      ) {
        onLogin()
      } else {
        setMessage(
          "Registration successful! Please check your email to verify your account."
        )
        setIsRegistering(false)
      }
    } else {
      const {
        error,
      } = await supabase.auth.signInWithPassword(
        {
          email: cleanEmail,
          password,
        }
      )

      if (error) {
        setMessage(error.message)
      } else {
        onLogin()
      }
    }

    setLoading(false)
  }

  return (
    <div className="auth-page">

      <div className="auth-card">

        <div className="auth-brand">
          <span className="auth-brand-icon">
            😎
          </span>

          <h1>Bunkly</h1>

          <p>
            Attendance made smarter.
          </p>
        </div>

        <div className="auth-heading">

          <h2>
            {isRegistering
              ? "Create your account"
              : "Welcome back"}
          </h2>

          <p>
            {isRegistering
              ? "Start tracking your attendance."
              : "Sign in to continue to Bunkly."}
          </p>

        </div>

        <form
          className="auth-form"
          onSubmit={handleSubmit}
        >

          {isRegistering && (
            <label>
              Full Name

              <input
                type="text"
                placeholder="Enter your name"
                value={name}
                onChange={(event) =>
                  setName(
                    event.target.value
                  )
                }
                autoComplete="name"
              />
            </label>
          )}

          <label>
            Email

            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(event) =>
                setEmail(
                  event.target.value
                )
              }
              autoComplete="email"
            />
          </label>

          <label>
            Password

            <input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(event) =>
                setPassword(
                  event.target.value
                )
              }
              autoComplete={
                isRegistering
                  ? "new-password"
                  : "current-password"
              }
            />
          </label>

          {message && (
            <div className="auth-message">
              {message}
            </div>
          )}

          <button
            type="submit"
            className="auth-submit"
            disabled={loading}
          >
            {loading
              ? "Please wait..."
              : isRegistering
              ? "Create Account"
              : "Login"}
          </button>

        </form>

        <div className="auth-switch">

          <span>
            {isRegistering
              ? "Already have an account?"
              : "Don't have an account?"}
          </span>

          <button
            type="button"
            onClick={() => {
              setIsRegistering(
                !isRegistering
              )
              setMessage("")
            }}
          >
            {isRegistering
              ? "Login"
              : "Register"}
          </button>

        </div>

      </div>

    </div>
  )
}

export default Auth