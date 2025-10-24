try {
  await import("./validate-core.mjs");
} catch (err) {
  console.error(err);
  process.exit(1);
}
