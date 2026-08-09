
  let currentDate = new Date();
  let currentPlant = null;
  const bodyId = document.body.id;

async function addPlant() {

   
    const plant_name = document.getElementById("plant-name").value;
   const interval = document.getElementById("watering-interval").value; // convert to integer
   const location = document.getElementById("location")?.value ?? "N/A"
   const watered_date = document.getElementById("watered_date")?.value ?? null
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
  renderPlantsList();
}

async function renderPlantsList(){
    const res = await fetch("http://localhost:5000/get_plants");
  const plants = await res.json();

  const grid = document.querySelector(".text-grid");
  grid.innerHTML = ""; // clear old content

  plants.sort((a, b) => a.name.localeCompare(b.name));
  
  plants.forEach(plant => {
    const card = document.createElement("div");
    card.classList.add("card"); 


    card.innerHTML = `
      <h3>${plant.name}</h3>
      <p class = "water" >Water every ${plant.interval} days</p>
      <p>Location: ${plant.location || "N/A"}</p>
  <p>Last Watered: ${plant.last_watered 
  ? new Date(plant.last_watered).toLocaleDateString()
  : "N/A"}</p>
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
  fetch(`http://localhost:5000/edit_plant/${currentPlant.id}`, {
    method: "PATCH",   
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(changedFields)
  })
  .then(res => res.json())
  .then(data => {
    console.log("Plant updated:", data);
    closeModal();
    renderPlantsList();
  });
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
  renderPlantsList();
}

function openSavePlant(){
  document.getElementById("plant-add").classList.remove("hidden");
}

function closeModal() {
  document.getElementById("plant-modal").classList.add("hidden");
  document.getElementById("plant-add").classList.add("hidden");
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
      dateDiv.textContent = day;

      const today = new Date();
      if (
        day === today.getDate() &&
        month === today.getMonth() &&
        year === today.getFullYear()
      ) {
        dateDiv.classList.add("today");
      }

      grid.appendChild(dateDiv);
    }
  }

  function changeMonth(direction) {
    currentDate.setMonth(currentDate.getMonth() + direction);
    renderCalendar();
  }

  if (bodyId === "home"){
    renderCalendar();
  }
  else if(bodyId === "plant_list"){
    renderPlantsList();
  }
  
