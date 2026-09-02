/**
 * Home page - protected. Must be behind auth.
 * Requirement: main tag with "Welcome, This is a Blank Canvas", white bg, black text.
 */
export default function Home() {
  return (
    <main className="flex min-h-[calc(100vh-56px)] items-center justify-center bg-white px-6">
      <h1 className="text-center text-2xl font-medium tracking-tight text-black sm:text-3xl">
        Welcome, This is a Blank Canvas
      </h1>
    </main>
  );
}
