import { BrowserRouter, Link, Route, Routes } from 'react-router-dom'
import Navbar from './components/Navbar.jsx'
import Home from './pages/Home.jsx'
import NoticeDetails from './pages/NoticeDetails.jsx'
import AdminLogin from './pages/AdminLogin.jsx'
import NoticeEditor from './pages/NoticeEditor.jsx'

function NotFound() {
  return (
    <main className="page-shell">
      <section className="state-card">
        <p className="eyebrow">404 · Page not found</p>
        <h1>This page isn’t on the board.</h1>
        <p>Check the address or head back to the home page.</p>
        <Link className="button button-primary" to="/">Back to notices</Link>
      </section>
    </main>
  )
}

function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/notice/:id" element={<NoticeDetails />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin" element={<NoticeEditor />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
