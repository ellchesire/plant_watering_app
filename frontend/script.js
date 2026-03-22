
  let currentDate = new Date();

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

  renderCalendar();
