// Availability

function getAvailabilityKey() {
  const user = Session.getUser();
  return user ? `availability_${user.id}` : null;
}

function loadAvailability() {
  const key = getAvailabilityKey();
  return key ? Storage.get(key) || { days: [], startTime: "", endTime: "" } : null;
}

function saveAvailability(data) {
  const key = getAvailabilityKey();
  if (key) Storage.set(key, data);
}

// Populate form with saved values on page load

function initAvailabilityPage() {
  Session.require();

  const saved = loadAvailability();
  if (!saved) return;

  if (saved.days.length) {
    document.querySelectorAll('input[name="days"]').forEach((cb) => {
      cb.checked = saved.days.includes(cb.value);
    });
  }

  if (saved.startTime) document.getElementById("start-time").value = saved.startTime;
  if (saved.endTime)   document.getElementById("end-time").value   = saved.endTime;
}

// Handle form submission

function handleAvailabilitySubmit(event) {
  event.preventDefault();

  const selectedDays = Array.from(document.querySelectorAll('input[name="days"]:checked')).map(
    (cb) => cb.value
  );

  const startTime = document.getElementById("start-time").value;
  const endTime   = document.getElementById("end-time").value;

  if (selectedDays.length === 0) {
    showToast("Please select at least one available day.", "error");
    return;
  }

  if (startTime >= endTime) {
    showToast("End time must be after start time.", "error");
    return;
  }

  saveAvailability({ days: selectedDays, startTime, endTime });
  showToast("Availability saved successfully!", "success");

  setTimeout(() => {
    window.location.href = "dashboard.html";
  }, 1000);
}

document.addEventListener("DOMContentLoaded", () => {
  initAvailabilityPage();

  const form = document.getElementById("availability-form");
  if (form) form.addEventListener("submit", handleAvailabilitySubmit);
});
