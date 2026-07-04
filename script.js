/* ===== GLOBAL VARIABLES & CONFIG ===== */
const availableTours = [
    "Battle Tour", "Halloween Tour", "Autumn Tour", "Animal Tour",
    "Peach vs. Bowser Tour", "Holiday Tour", "New Year's Tour", "Space Tour",
    "Winter Tour", "Exploration Tour", "Doctor Tour", "Mario Tour", "Ninja Tour",
    "Yoshi Tour", "Spring Tour", "Bowser Tour", "Mii Tour", "Princess Tour",
    "Mario vs. Luigi Tour", "Night Tour", "Pipe Tour", "Sunshine Tour",
    "Vacation Tour", "Summer Tour", "Sundae Tour", "Anniversary Tour"
];

const availableRates = ["spotlight", "high", "normal", "low"];
const availableTypes = ["driver", "kart", "glider"];

let currentTypeFilter = "All";
let currentRateFilter = "All";
let itemsDb = {};
let dailySelects = {};
let acpItems = {};


/* ===== INITIALIZATION & EVENT LISTENERS ===== */
document.addEventListener('DOMContentLoaded', function() {
    // Reset filters
    document.querySelector('input[name="typeFilter"][value="All"]').checked = true;
    document.querySelector('input[name="rateFilter"][value="All"]').checked = true;
    document.getElementById("itemSearch").value = '';

    selectMode('item');
});

// Handle item search on 'Enter' key
document.getElementById("itemSearch").addEventListener("keypress", function(event) {
    if (event.key === "Enter") {
        searchByItem();
    }
});

// Handle filter changes
document.querySelectorAll('input[name="typeFilter"]').forEach(input => {
    input.addEventListener("change", function() {
        currentTypeFilter = this.value;
    });
});

document.querySelectorAll('input[name="rateFilter"]').forEach(input => {
    input.addEventListener("change", function() {
        currentRateFilter = this.value;
    });
});


/* ===== DATA FETCHING ===== */
// Load main items database
fetch('items_db.json')
    .then(response => response.json())
    .then(data => {
        itemsDb = data;

        // Populate the tour dropdown with available tours
        const tourSelect = document.getElementById("tourSelect");
        availableTours.forEach(tour => {
            const option = document.createElement("option");
            option.value = tour;
            option.textContent = tour;
            tourSelect.appendChild(option);
        });
    })
    .catch(error => {
        console.error("Error loading items database:", error);
    });

// Load Daily Selects database
fetch('daily_items_db.json')
    .then(response => response.json())
    .then(data => {
        dailySelects = data;
    })
    .catch(error => {
        console.error('Error loading "Daily Selects" database:', error);
    });

// Load All-Clear Pipe database
fetch('acp_items_db.json')
    .then(response => response.json())
    .then(data => {
        acpItems = data;
    })
    .catch(error => {
        console.error('Error loading "All-Clear Pipe" database:', error);
    });


/* ===== NAVIGATION & MODES ===== */
function selectMode(mode) {
    // Hide both search boxes by default so they don't overlap
    document.getElementById("itemSearchContainer").style.display = "none";
    document.getElementById("tourSearchContainer").style.display = "none";
    document.getElementById("filterDetails").removeAttribute("open");
    document.getElementById("filterDetails").style.display = "none";

    // Show the appropriate container or trigger the generation function
    if (mode === 'item') {
        document.getElementById("itemSearchContainer").style.display = "block";
        document.getElementById("filterDetails").style.display = "block";
    } else if (mode === 'tour') {
        document.getElementById("tourSearchContainer").style.display = "block";
        document.getElementById("tourSelect").value = "";
    } else if (mode === 'daily') {
        showDailySelects();
    } else if (mode === 'gpc') {
        showGPCItems();
    } else if (mode === 'acp') {
        showACPItems();
    }
}


/* ===== SEARCH & FILTER LOGIC ===== */
function fuzzySearch(query, itemName) {
    const keywords = query.toLowerCase().split(/\s+/);
    const itemNameLower = itemName.toLowerCase();

    // Check if all keywords are found in the item name (in any order)
    return keywords.every(keyword => itemNameLower.includes(keyword));
}

function searchByItem() {
    let searchQuery = document.getElementById("itemSearch").value.toLowerCase();
    let matchingItems = [];

    for (let itemId in itemsDb) {
        let itemData = itemsDb[itemId];

        // Use fuzzy search instead of exact match
        if (fuzzySearch(searchQuery, itemId) &&
            (currentTypeFilter === "All" || itemData.type.toLowerCase() === currentTypeFilter.toLowerCase()) &&
            (currentRateFilter === "All" || Object.values(itemData.rates).includes(currentRateFilter.toLowerCase()))) {
            matchingItems.push({
                itemId,
                itemData
            });
        }
    }

    if (!matchingItems.length) {
        document.getElementById("output").innerHTML = "<span>No items found matching the search criteria.</span>";
        return;
    }

    // Sort matching items by type when the filter is "All"
    if (currentTypeFilter === "All") {
        const typeOrder = ["driver", "kart", "glider"]; // Define custom order

        matchingItems.sort((a, b) => {
            const typeA = a.itemData.type.toLowerCase();
            const typeB = b.itemData.type.toLowerCase();

            return typeOrder.indexOf(typeA) - typeOrder.indexOf(typeB);
        });
    }

    let result = "<h3>Matching Items:</h3><br><hr>";

    matchingItems.forEach((item, index) => {
        result += `<p><strong>${item.itemId}</strong> - ${item.itemData.type.charAt(0).toUpperCase() + item.itemData.type.slice(1)}</p>`;
        for (let tour in item.itemData.rates) {
            if (currentRateFilter === "All" || item.itemData.rates[tour].toLowerCase() === currentRateFilter.toLowerCase()) {
                result += `<p>${tour}: ${item.itemData.rates[tour].charAt(0).toUpperCase() + item.itemData.rates[tour].slice(1)}</p>`;
            }
        }

        if (index < matchingItems.length - 1) {
            result += "<hr>";
        }
    });

    document.getElementById("output").innerHTML = result;
}

function searchByTour() {
    const tour = document.getElementById("tourSelect").value;

    if (!tour) {
        document.getElementById("output").innerHTML = "<span>Please select a tour.</span>";
        return;
    }

    let sortedItems = {};

    // Sort items by rate
    for (let itemId in itemsDb) {
        let itemData = itemsDb[itemId];
        if (itemData.rates[tour]) {
            let rate = itemData.rates[tour].toLowerCase();
            if (!sortedItems[rate]) {
                sortedItems[rate] = { drivers: [], karts: [], gliders: [] };
            }
            // Append an 's' to the type ("driver" becomes "drivers") to match the object keys
            sortedItems[rate][itemData.type.toLowerCase() + "s"].push(itemId);
        }
    }

    // Format data to control the order and apply proper capitalization for the table headers
    const formattedData = {};
    availableRates.forEach(rate => {
        if (sortedItems[rate]) {
            const titleText = rate.charAt(0).toUpperCase() + rate.slice(1) + " Rate";
            formattedData[titleText] = sortedItems[rate];
        }
    });

    if (Object.keys(formattedData).length === 0) {
        document.getElementById("output").innerHTML = `<p>No items found for ${tour}.</p>`;
        return;
    }

    const outputHTML = generateItemTable(`${tour} Spotlight Shop`, formattedData);
    document.getElementById("output").innerHTML = outputHTML;
}


/* ===== UI GENERATION ===== */
function generateItemTable(title, categorizedData, applyColors = false) {
    let result = `<h3>${title}</h3>`;

    result += `<div class="table-responsive">`;
    result += `<table class="daily-selects-table">`;

    // Loop through each category
    for (const category in categorizedData) {
        const items = categorizedData[category];
        const drivers = items.drivers || [];
        const karts = items.karts || [];
        const gliders = items.gliders || [];

        // Only generate a section if there are actually items inside it
        if (drivers.length > 0 || karts.length > 0 || gliders.length > 0) {
            // Determine the row color based on the rate class
            let rateClass = "";
            const catLower = category.toLowerCase();

            if (applyColors) {
                if (catLower.includes('high-end')) {
                    rateClass = "bg-high";
                } else if (catLower.includes('super')) {
                    rateClass = "bg-super";
                } else if (catLower.includes('normal')) {
                    rateClass = "bg-normal";
                }
            }

            // Row 1: Category Heading
            result += `<tr class="rarity-header ${rateClass}"><th colspan="3">${category}</th></tr>`;
            
            // Row 2: Item Type Column Headers
            result += `<tr class="type-header">
                        <th>Drivers</th>
                        <th>Karts</th>
                        <th>Gliders</th>
                      </tr>`;

            // Row 3: All items grouped into a single combined cell per category
            result += `<tr class="item-lists">`;
            result += `<td>${drivers.join('<br>')}</td>`;
            result += `<td>${karts.join('<br>')}</td>`;
            result += `<td>${gliders.join('<br>')}</td>`;
            result += `</tr>`;
        }
    }

    result += `</table>`;
    result += `</div>`;

    return result; // Return the raw HTML string
}

function showDailySelects() {
    const rarityTypes = ['Normal', 'Super', 'High-End'];
    const formattedData = {};

    rarityTypes.forEach((rarity) => {
        if (dailySelects[rarity]) {
            formattedData[`${rarity} Items`] = {
                drivers: dailySelects[rarity]['Drivers'] || [],
                karts: dailySelects[rarity]['Karts'] || [],
                gliders: dailySelects[rarity]['Gliders'] || []
            };
        }
    });

    const outputHTML = generateItemTable("Daily Selects", formattedData, true);
    document.getElementById("output").innerHTML = outputHTML;
}

function showGPCItems() {
    document.getElementById("output").innerHTML = `
        <h3>Gold Premium Challenge Items</h3><br><hr>
        <p><b>Gold Hard Hat Balloon</b>: New Year's Tour</p>
        <p><b>Gold 8-Bit Glider</b>: Mario Tour</p>
        <p><b>Gold Shielded Speedster</b>: Mario vs. Luigi Tour</p>
        <p><b>Gold Monarch Kart</b>: Anniversary Tour</p><hr>
        <p><em>These items are <strong>exclusively</strong> available through the "Gold Premium Challenge" cards in their respective tours, all of which cost <b>US$14.99</b>.</em></p>
    `;
}

function showACPItems() {
    // Format the data into a single category so it generates exactly one row
    const formattedData = {
        "High-End Items": {
            drivers: acpItems.drivers || [],
            karts: acpItems.karts || [],
            gliders: acpItems.gliders || []
        }
    };

    const outputHTML = generateItemTable("All-Clear Pipe", formattedData, true);
    document.getElementById("output").innerHTML = outputHTML;
}


