export default function WelcomeSection() {
  return (
    <section className="text-center mb-16">
      <h1 className="text-5xl md:text-6xl font-bold mb-6">
        <span className="bg-gradient-to-r from-yellow-500 to-yellow-700 bg-clip-text text-transparent">
          Welcome to
        </span>{" "}
        <span className="bg-gradient-to-r from-yellow-400 to-yellow-500 bg-clip-text text-transparent">
          STEPTIONS
        </span>
      </h1>
      <p className="text-xl font-semibold text-gray-700 max-w-3xl mx-auto mb-8">
        The First Options Protocol on Stellar. Insure any asset. Hedge price. Earn yield.
      </p>
    </section>
  )
}