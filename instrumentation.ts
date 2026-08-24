export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    // The host network has no working IPv6 route to Neon (ENETUNREACH), while
    // Neon's endpoints publish AAAA records. Prefer IPv4 so Node's fetch
    // resolves a reachable address instead of failing intermittently.
    const dns = await import("node:dns");
    dns.setDefaultResultOrder("ipv4first");
  }
}
