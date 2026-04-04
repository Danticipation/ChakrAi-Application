console.log("🔍 Preflight check...");
console.log("  NODE_ENV:", process.env.NODE_ENV || "(not set)");
console.log("  MODE:", process.env.MODE || "(not set)");
console.log("  import.meta.env.MODE will be logged by Vite itself");

// Force fail-safe in case NODE_ENV accidentally leaks as production
if (process.env.NODE_ENV === "production") {
  console.error("❌ Warning: NODE_ENV is production during dev!");
}
