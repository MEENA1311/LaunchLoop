
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { post } from '../api';
import { Btn, Input, Select } from '../components/UI';
import { useToast } from '../components/Toast';

export default function Login({ onLoginSuccess }) {
  const nav = useNavigate();
  const toast = useToast();

  const [isRegister, setIsRegister] = useState(false);

  // Login form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Register form state
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regRole, setRegRole] = useState('student');
  const [regHeadline, setRegHeadline] = useState('');

  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  async function handleLogin(e) {
    e.preventDefault();

    setBusy(true);
    setErr('');

    try {
      const data = await post('/auth/login', {
        email: email.trim(),
        password
      });

      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));

      toast.success(`Welcome back, ${data.user.name}!`);

      if (onLoginSuccess) {
        onLoginSuccess(data.user);
      }

      nav('/dashboard', { replace: true });

    } catch (e) {
      const message = e.message || 'Login failed';

      setErr(message);
      toast.error(message);

    } finally {
      setBusy(false);
    }
  }

  async function handleRegister(e) {
    e.preventDefault();

    setBusy(true);
    setErr('');

    try {
      const data = await post('/auth/register', {
        name: regName.trim(),
        email: regEmail.trim(),
        password: regPassword,
        role: regRole,
        headline: regHeadline.trim()
      });

      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));

      toast.success(
        `Account created! Welcome to LaunchLoop, ${data.user.name}.`
      );

      if (onLoginSuccess) {
        onLoginSuccess(data.user);
      }

      nav('/dashboard', { replace: true });

    } catch (e) {
      const message = e.message || 'Registration failed';

      setErr(message);
      toast.error(message);

    } finally {
      setBusy(false);
    }
  }

  function switchMode(registerMode) {
    setIsRegister(registerMode);
    setErr('');

    // Clear login fields when switching to registration
    if (registerMode) {
      setEmail('');
      setPassword('');
    }
  }

  return (
    <div className="login-screen">

      {/* Left branding / ecosystem section */}
      <div className="login-art">

        <div className="login-brand">
          <div className="brand-icon">💡</div>

          <div>
            <b>LaunchLoop</b>
            <span>
              Startup & Innovation Collaboration Portal
            </span>
          </div>
        </div>

        <div className="art-copy">

          <h1>
            From a bold idea to a funded venture.
          </h1>

          <p>
            The complete ecosystem connecting student innovators,
            industry mentors, incubation programs, and angel/VC investors.
          </p>

          <div className="journey">
            <span>Idea</span>
            <i>→</i>

            <span>Project</span>
            <i>→</i>

            <span>Mentor</span>
            <i>→</i>

            <span>Incubate</span>
            <i>→</i>

            <span>Fund</span>
            <i>→</i>

            <span>Scale</span>
          </div>

        </div>

        <div className="orbit">
          <span>✦</span>

          <b>
            CAMPUS
            <br />
            TO
            <br />
            CAPITAL
          </b>
        </div>

      </div>

      {/* Right authentication section */}
      <div className="login-panel">

        {/* Sign in / Create account tabs */}
        <div className="auth-tab-buttons">

          <button
            type="button"
            className={!isRegister ? 'active' : ''}
            onClick={() => switchMode(false)}
          >
            Sign In
          </button>

          <button
            type="button"
            className={isRegister ? 'active' : ''}
            onClick={() => switchMode(true)}
          >
            Create Account
          </button>

        </div>

        <span className="eyebrow">
          {isRegister
            ? 'JOIN THE ECOSYSTEM'
            : 'WELCOME BACK'}
        </span>

        <h2>
          {isRegister
            ? 'Create your profile'
            : 'Enter your workspace'}
        </h2>

        <p className="muted">
          {isRegister
            ? 'Select your role and start collaborating with the ecosystem.'
            : 'Sign in to access your workspace.'}
        </p>

        {/* Error message */}
        {err && (
          <div className="error">
            {err}
          </div>
        )}

        {!isRegister ? (

          /* =========================
             LOGIN FORM
             ========================= */

          <form onSubmit={handleLogin}>

            <Input
              label="Email address"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoComplete="email"
              placeholder="Enter your email address"
            />

            <Input
              label="Password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              placeholder="Enter your password"
            />

            <Btn
              type="submit"
              loading={busy}
            >
              Sign In →
            </Btn>

          </form>

        ) : (

          /* =========================
             REGISTRATION FORM
             ========================= */

          <form onSubmit={handleRegister}>

            <Input
              label="Full name"
              value={regName}
              onChange={e => setRegName(e.target.value)}
              required
              autoComplete="name"
              placeholder="Enter your full name"
            />

            <Input
              label="Email address"
              type="email"
              value={regEmail}
              onChange={e => setRegEmail(e.target.value)}
              required
              autoComplete="email"
              placeholder="Enter your email address"
            />

            <div className="form-row">

              <Input
                label="Password"
                type="password"
                value={regPassword}
                onChange={e => setRegPassword(e.target.value)}
                required
                autoComplete="new-password"
                placeholder="Create a password"
              />

              <Select
                label="Your role"
                value={regRole}
                onChange={e => setRegRole(e.target.value)}
              >
                <option value="student">
                  Student / Innovator
                </option>

                <option value="mentor">
                  Mentor / Industry Expert
                </option>

                <option value="startup">
                  Startup Founder
                </option>

                <option value="investor">
                  Angel / VC Investor
                </option>

                <option value="incubator">
                  Incubator Program
                </option>
              </Select>

            </div>

            <Input
              label="Headline / Expertise (optional)"
              value={regHeadline}
              onChange={e => setRegHeadline(e.target.value)}
              placeholder="e.g. AI Researcher, Fullstack Developer, Product Lead"
            />

            <Btn
              type="submit"
              loading={busy}
            >
              Create Account →
            </Btn>

          </form>

        )}

      </div>

    </div>
  );
}
