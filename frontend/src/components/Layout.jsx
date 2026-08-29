import Navbar from "./Navbar"
import Footer from "./Footer"

const Layout = ({ children, isLanding }) => {
  return (
    <>
      <Navbar isLanding={isLanding} />
      <main className={isLanding ? "bg-slate-950" : "pt-24"}>
        {isLanding ? (
          <div className="w-full">{children}</div>
        ) : (
          <div className="page-container">{children}</div>
        )}
      </main>
      <Footer />
    </>
  )
}

export default Layout
