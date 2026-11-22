import Link from "next/link"

export default function NotFound() {
  return (
    <main style={{ padding: 20, textAlign: "center" }}>
      <h2>Page Not Found</h2>
      <p>Could not find requested resource</p>
      <Link href="/">Return Home</Link>
    </main>
  )
}
