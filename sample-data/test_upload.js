const fs = require('fs');

async function run() {
  const loginRes = await fetch("http://localhost:8080/api/v1/IdentityAccess/regular-login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ Email: "admin@cinema.com", Password: "anhduc9a5" })
  });
  const cookie = loginRes.headers.get("set-cookie");
  console.log("Login status:", loginRes.status, "Cookie:", cookie ? cookie.slice(0, 50) + "..." : "none");

  const match = cookie ? cookie.match(/X-Access-Token=([^;]+)/) : null;
  const token = match ? match[1] : "";

  const listRes = await fetch("http://localhost:8080/api/contracts", {
    headers: { "Authorization": `Bearer ${token}` }
  });
  const listData = await listRes.json();
  console.log("Contracts list status:", listRes.status, "Count:", listData.data?.length);

  const contractId = listData.data[0]?.contractId;
  console.log("Selected contractId:", contractId);

  const fileBuffer = fs.readFileSync("sample-contracts/hop_dong_chieu_phim_dune_2.pdf");
  const blob = new Blob([fileBuffer], { type: "application/pdf" });
  const form = new FormData();
  form.append("file", blob, "hop_dong_chieu_phim_dune_2.pdf");
  form.append("kind", "Original");

  const uploadRes = await fetch(`http://localhost:8080/api/contracts/${contractId}/documents`, {
    method: "POST",
    headers: { "Authorization": `Bearer ${token}` },
    body: form
  });
  console.log("Upload status:", uploadRes.status);
  const uploadData = await uploadRes.text();
  console.log("Upload response:", uploadData);
}
run().catch(console.error);
