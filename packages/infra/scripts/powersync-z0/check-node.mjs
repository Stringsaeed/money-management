const major = Number.parseInt(process.versions.node, 10);
if (major !== 22) {
  console.error(
    `roundtrip requires Node 22 LTS (engines.node >=22 <23). This process is Node ${process.versions.node}. Node 26 fails better-sqlite3 native compile. Run nvm use 22.`,
  );
  process.exit(1);
}
