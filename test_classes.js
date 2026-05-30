const url = "https://qybgnrlszozjhimewkel.supabase.co/rest/v1/GymClass?select=*,ClassCenterSchedule!inner(*)&ClassCenterSchedule.centerId=eq.some-center-id";
const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF5Ymducmxzem96amhpbWV3a2VsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYzNzA0OTIsImV4cCI6MjA5MTk0NjQ5Mn0.wcxnT5pc9gKGK4xWgHdSsEcPEMAc4xztoOOC5-DKa98";

async function run() {
  try {
    const res = await fetch(url, {
      headers: {
        "apikey": key,
        "Authorization": `Bearer ${key}`
      }
    });
    console.log("Status:", res.status);
    const text = await res.text();
    console.log("Response:", text);
  } catch (e) {
    console.error("Error:", e);
  }
}

run();
