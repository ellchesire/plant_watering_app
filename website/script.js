
  let currentDate = new Date();
  let currentPlant = null;
  let allPlants = [];
  const bodyId = document.body.id;

function formatDate(dateStr) {
  if (!dateStr) return "N/A";
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString();
}

function getNextWaterDate(plant) {
  if (!plant.last_watered) return new Date(0); // never watered - most urgent
  const [year, month, day] = plant.last_watered.split("-").map(Number);
  const next = new Date(year, month - 1, day);
  next.setDate(next.getDate() + Number(plant.interval || 0));
  return next;
}

function getUrgencyClass(plant) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const daysLeft = Math.ceil((getNextWaterDate(plant) - today) / (1000 * 60 * 60 * 24));

  if (daysLeft <= 1) return "urgent"; // red - overdue or due today/tomorrow
  if (daysLeft < 3) return "soon";    // orange - due within a couple days
  return "ok";                        // green - plenty of time
}

async function fetchPlants(){
  const res = await fetch("http://localhost:5000/get_plants");
  allPlants = await res.json();
  return allPlants;
}

async function addPlant() {


    const plant_name = document.getElementById("plant-name").value;
   const interval = document.getElementById("watering-interval").value; // convert to integer
   const location = document.getElementById("location")?.value ?? "N/A"
   const watered_date = document.getElementById("watered-date")?.value || null
   console.log(location, watered_date);

   if (!plant_name || !interval) {
    alert("Please Fill the Plant Name and Watering Interval");

    return;
  }

  const res = await fetch("http://localhost:5000/add_plants", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({        // send JSON body
   plant_name,
    interval,
    location,
    watered_date
    })
  });

  const data = await res.json();
  console.log("Added plant:", data);
  alert(`${data.plant_name} added!`);

  if (bodyId === "plant_list") {
    renderPlantsList();
  } else if (bodyId === "home") {
    await renderPlantsList();
    renderCalendar();
  }
}

async function renderPlantsList(){
  await fetchPlants();

  const grid = document.querySelector(".text-grid");
  grid.innerHTML = ""; // clear old content

  const plants = [...allPlants].sort((a, b) => getNextWaterDate(a) - getNextWaterDate(b));

  plants.forEach(plant => {
    const card = document.createElement("div");
    card.classList.add("card", getUrgencyClass(plant));


    card.innerHTML = `
      <h3>${plant.name}</h3>
      <p class = "water" >Water every ${plant.interval} days</p>
      <p>Location: ${plant.location || "N/A"}</p>
  <p>Last Watered: ${formatDate(plant.last_watered)}</p>
    `;
    card.onclick = () => openModal(plant);
    grid.appendChild(card);

  });
}

function openModal(plant) {
  
  currentPlant = plant;
  console.log(currentPlant);

  document.getElementById("edit-name").value = plant.name;
  document.getElementById("edit-interval").value = plant.interval;
  document.getElementById("edit-location").value = plant.location || "";
  document.getElementById("edit-watered-date").value = plant.last_watered || "";

  document.getElementById("plant-modal").classList.remove("hidden");
}
async function editPlant(){

  const name = document.getElementById("edit-name").value;
  const interval = document.getElementById("edit-interval").value;
  const location = document.getElementById("edit-location").value;
  const watered_date = document.getElementById("edit-watered-date").value;

  const changedFields = {}; // only store fields that changed

  if (name !== currentPlant.name) changedFields.plant_name = name;
  if (interval !== String(currentPlant.interval)) changedFields.interval = interval;
  if (location !== (currentPlant.location || "")) changedFields.location = location;
  if (watered_date !== (currentPlant.last_watered || "")) changedFields.watered_date = watered_date;

  console.log("Changed fields:", changedFields, currentPlant.id);

  if (Object.keys(changedFields).length === 0) {
    alert("No changes detected!");
    return;
  }

  // Send only changedFields to backend
  const res = await fetch(`http://localhost:5000/edit_plant/${currentPlant.id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(changedFields)
  });

  const data = await res.json();
  console.log("Plant updated:", data);
  closeModal();

  await renderPlantsList();
  if (bodyId === "home") renderCalendar();
}

async function deletePlant(){
  if (!currentPlant) return;

  if (!confirm(`Delete ${currentPlant.name}?`)) return;

  const res = await fetch(`http://localhost:5000/del_plant/${currentPlant.id}`, {
    method: "DELETE"
  });

  const data = await res.json();
  console.log("Plant deleted:", data);
  closeModal();

  await renderPlantsList();
  if (bodyId === "home") renderCalendar();
}

function openSavePlant(){
  document.getElementById("plant-add").classList.remove("hidden");
}

function closeModal() {
  document.getElementById("plant-modal")?.classList.add("hidden");
  document.getElementById("plant-add")?.classList.add("hidden");
}
function renderCalendar() {
    const grid = document.getElementById("calendarGrid");
    const monthYear = document.getElementById("monthYear");

    grid.innerHTML = "";

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    // Month title
    monthYear.textContent = currentDate.toLocaleString("default", {
      month: "long",
      year: "numeric"
    });

    // First day of month
    const firstDay = new Date(year, month, 1).getDay();

    // Total days in month
    const totalDays = new Date(year, month + 1, 0).getDate();

    // Empty slots before month starts
    for (let i = 0; i < firstDay; i++) {
      const empty = document.createElement("div");
      empty.className = "date empty";
      grid.appendChild(empty);
    }

    // Create days
    for (let day = 1; day <= totalDays; day++) {
      const dateDiv = document.createElement("div");
      dateDiv.className = "date";

      const dayNumber = document.createElement("span");
      dayNumber.className = "day-number";
      dayNumber.textContent = day;
      dateDiv.appendChild(dayNumber);

      if (wasWateredOn(year, month, day)) {
        const dot = document.createElement("span");
        dot.className = "watered-dot";
        dateDiv.appendChild(dot);
      }

      const today = new Date();
      if (
        day === today.getDate() &&
        month === today.getMonth() &&
        year === today.getFullYear()
      ) {
        dateDiv.classList.add("today");
      }

      dateDiv.onclick = () => showPlantsWateredOn(year, month, day);

      grid.appendChild(dateDiv);
    }
  }

  function wasWateredOn(year, month, day) {
    return allPlants.some(plant => {
      if (!plant.last_watered) return false;
      const d = new Date(plant.last_watered);
      return d.getUTCFullYear() === year && d.getUTCMonth() === month && d.getUTCDate() === day;
    });
  }

  function showPlantsWateredOn(year, month, day) {
    const modal = document.getElementById("watered-modal");
    const title = document.getElementById("watered-modal-title");
    const list = document.getElementById("watered-modal-list");
    if (!modal || !title || !list) return;

    const watered = allPlants.filter(plant => {
      if (!plant.last_watered) return false;
      const d = new Date(plant.last_watered);
      return d.getUTCFullYear() === year && d.getUTCMonth() === month && d.getUTCDate() === day;
    });

    const label = new Date(year, month, day).toLocaleDateString(undefined, {
      month: "long",
      day: "numeric",
      year: "numeric"
    });

    title.textContent = `Watered on ${label}`;
    list.innerHTML = "";

    if (watered.length === 0) {
      list.innerHTML = `<p>No plants watered on this day.</p>`;
    } else {
      watered.forEach(plant => {
        const item = document.createElement("div");
        item.classList.add("watered-item");
        item.innerHTML = `
          <div class="name">${plant.name}</div>
          <div class="location">Location: ${plant.location || "N/A"}</div>
        `;
        list.appendChild(item);
      });
    }

    modal.classList.remove("hidden");
  }

  function closeWateredModal() {
    document.getElementById("watered-modal").classList.add("hidden");
  }

  function changeMonth(direction) {
    currentDate.setMonth(currentDate.getMonth() + direction);
    renderCalendar();
  }

  if (bodyId === "home"){
    renderPlantsList().then(renderCalendar);
  }
  else if(bodyId === "plant_list"){
    renderPlantsList();
  }

