const seatMap = document.querySelector("#seat-map");
const selectionCount = document.querySelector("#selection-count");
const selectionNames = document.querySelector("#selection-names");
const totalPrice = document.querySelector("#total-price");
const continueButton = document.querySelector("#continue-button");
const toast = document.querySelector("#toast");
const confirmation = document.querySelector("#confirmation");
const confirmationDetails = document.querySelector("#confirmation-details");

const rows = ["A", "B", "C", "D", "E", "F"];
const seatPrice = 14.5;
const occupiedSeats = new Set(["A2", "A3", "B1", "B6", "C4", "D2", "D7", "E3", "E6", "F1", "F5", "F8"]);
const repairSeats = new Set(["C3", "C6"]);
const accessibleSeats = new Set(["F2", "F3"]);
const selectedSeats = new Set();
let activeTime = "8:45 PM";
let toastTimeout;
const formattedDate = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(new Date());

document.querySelector("#show-date").textContent = `TODAY · ${formattedDate.toUpperCase()}`;

const seatIcon = `
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path d="M8 19v-2a4 4 0 0 1 8 0v2M12 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"></path>
    </svg>`;
const accessibleIcon = `
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <circle cx="12" cy="5" r="1.5"></circle>
        <path d="m11 9-1 5h5l2 5M10 14l-3 5M11 9h5l2 4h2M8 12a7 7 0 1 0 4-6"></path>
    </svg>`;
const repairIcon = `
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path d="M14.5 6.5a4 4 0 0 0-5.1 5.1L5 16l3 3 4.4-4.4a4 4 0 0 0 5.1-5.1L15 12l-3-3 2.5-2.5Z"></path>
    </svg>`;

function createSeat(row, number) {
    const seatId = `${row}${number}`;
    const seat = document.createElement("button");
    const isAccessible = accessibleSeats.has(seatId);
    seat.type = "button";
    seat.className = "seat";
    seat.dataset.seat = seatId;
    seat.setAttribute("aria-label", `${seatId}, ${isAccessible ? "accessible, " : ""}available, $${seatPrice.toFixed(2)}`);
    seat.setAttribute("aria-pressed", "false");

    if (occupiedSeats.has(seatId)) {
        seat.classList.add("is-occupied");
        seat.disabled = true;
        seat.setAttribute("aria-label", `${seatId}, occupied`);
        seat.innerHTML = seatIcon;
    } else if (repairSeats.has(seatId)) {
        seat.classList.add("is-repair");
        seat.disabled = true;
        seat.setAttribute("aria-label", `${seatId}, unavailable for repair`);
        seat.innerHTML = repairIcon;
    } else {
        if (isAccessible) {
            seat.classList.add("is-accessible");
            seat.innerHTML = accessibleIcon;
        } else {
            seat.innerHTML = seatIcon;
        }
        seat.addEventListener("click", () => toggleSeat(seat));
    }
    return seat;
}

function renderSeats() {
    const fragment = document.createDocumentFragment();
    rows.forEach((row) => {
        const rowElement = document.createElement("div");
        rowElement.className = "seat-row";
        rowElement.setAttribute("role", "group");
        rowElement.setAttribute("aria-label", `Row ${row}`);

        const leftLabel = document.createElement("span");
        leftLabel.className = "row-label";
        leftLabel.setAttribute("aria-hidden", "true");
        leftLabel.textContent = row;
        rowElement.append(leftLabel);

        for (let number = 1; number <= 8; number += 1) {
            rowElement.append(createSeat(row, number));
        }

        const rightLabel = document.createElement("span");
        rightLabel.className = "row-label";
        rightLabel.setAttribute("aria-hidden", "true");
        rightLabel.textContent = row;
        rowElement.append(rightLabel);
        fragment.append(rowElement);
    });
    seatMap.append(fragment);
}

function updateSummary() {
    const seats = [...selectedSeats].sort((first, second) => {
        const rowDifference = rows.indexOf(first[0]) - rows.indexOf(second[0]);
        return rowDifference || Number(first.slice(1)) - Number(second.slice(1));
    });
    const total = seats.length * seatPrice;
    selectionCount.textContent = seats.length === 0
        ? "No seats selected"
        : `${seats.length} ${seats.length === 1 ? "seat" : "seats"} selected`;
    selectionNames.textContent = seats.length === 0 ? "Pick a seat to get started" : seats.join(" · ");
    totalPrice.textContent = `$${total.toFixed(2)}`;
    continueButton.disabled = seats.length === 0;
}

function showToast(message) {
    window.clearTimeout(toastTimeout);
    toast.textContent = message;
    toast.classList.add("is-visible");
    toastTimeout = window.setTimeout(() => toast.classList.remove("is-visible"), 2400);
}

function toggleSeat(seat) {
    const seatId = seat.dataset.seat;
    if (selectedSeats.has(seatId)) {
        selectedSeats.delete(seatId);
        seat.classList.remove("is-selected");
        seat.setAttribute("aria-pressed", "false");
        seat.setAttribute("aria-label", `${seatId}, ${accessibleSeats.has(seatId) ? "accessible, " : ""}available, $${seatPrice.toFixed(2)}`);
    } else {
        if (selectedSeats.size >= 8) {
            showToast("You can select up to 8 seats per booking.");
            return;
        }
        selectedSeats.add(seatId);
        seat.classList.add("is-selected");
        seat.setAttribute("aria-pressed", "true");
        seat.setAttribute("aria-label", `${seatId}, selected, $${seatPrice.toFixed(2)}`);
    }
    updateSummary();
}

function closeConfirmation() {
    confirmation.hidden = true;
    continueButton.focus();
}

renderSeats();
updateSummary();

document.querySelectorAll(".showtime-button").forEach((button) => {
    button.addEventListener("click", () => {
        const activeButton = document.querySelector(".showtime-button.is-active");
        activeButton?.classList.remove("is-active");
        activeButton?.setAttribute("aria-pressed", "false");
        button.classList.add("is-active");
        button.setAttribute("aria-pressed", "true");
        activeTime = button.dataset.time;
        showToast(`Showtime updated to ${activeTime}. Your seats are still yours.`);
    });
});

continueButton.addEventListener("click", () => {
    const seats = [...selectedSeats].sort((first, second) => {
        const rowDifference = rows.indexOf(first[0]) - rows.indexOf(second[0]);
        return rowDifference || Number(first.slice(1)) - Number(second.slice(1));
    });
    confirmationDetails.textContent = `${seats.join(", ")} · Today, ${formattedDate} at ${activeTime} · $${(seats.length * seatPrice).toFixed(2)} total. Your seats are held while you complete checkout.`;
    confirmation.hidden = false;
    document.querySelector("#close-modal").focus();
});

document.querySelector("#close-modal").addEventListener("click", closeConfirmation);
document.querySelector("#done-button").addEventListener("click", closeConfirmation);
confirmation.addEventListener("click", (event) => {
    if (event.target === confirmation) closeConfirmation();
});
document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !confirmation.hidden) closeConfirmation();
});