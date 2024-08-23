// Imports
db = window.db;
addDoc = window.addDoc;
collection = window.collection;
getDocs = window.getDocs;
query = window.query;
orderBy = window.orderBy;
limit = window.limit;

// Score constants
const INITIAL_INVENTORY = 10;
const MAX_PAST_ORDERS = 3; // Number of past orders to consider
const SALE_POINTS = 7;
const STORAGE_COST = 2;
const BACKLOG_COST = 5;
const BULLWHIP_EFFECT = true;
const STARTING_EXPECTED_SUPPLY = 7;
const SMOOTHENING_FACTOR = 0.65;

// Initial values
let day = 1;
let inventory = INITIAL_INVENTORY;
let demand = 0;
let backlog = 0;
let score = 0;
let order = 0;
let code = "0000";
let expectedSupply = STARTING_EXPECTED_SUPPLY;
let pastOrders = [];
document.body.className = 'front-page-bg';

document.getElementById('play-button').addEventListener('click', function() {
    day = 1;
    inventory = INITIAL_INVENTORY;
    demand = Math.floor(Math.random() * 10);
    backlog = 0;
    score = 0;
    order = 0;
    expectedSupply = STARTING_EXPECTED_SUPPLY;
    pastOrders = [];

    // Update display
    document.getElementById('day-counter').textContent = day;
    document.getElementById('inventory').textContent = inventory;
    document.getElementById('demand').textContent = demand;
    document.getElementById('backlog').textContent = backlog;
    document.getElementById('order').textContent = order;
    document.getElementById('score').textContent = score;

    document.getElementById('score-breakdown').style.display = 'none';

    document.getElementById('front-page').style.display = 'none';
    document.getElementById('game-page').style.display = 'flex';
    
    document.getElementById('game-start').play();

    document.body.className = 'game-page-bg'; // When showing front page
});

document.getElementById('increase-order').addEventListener('click', function() {
    order++;
    document.getElementById('order').textContent = order;
});

document.getElementById('decrease-order').addEventListener('click', function() {
    if (order > 0) {
        order--;
        document.getElementById('order').textContent = order;
    }
});

document.getElementById('next-day').addEventListener('click', function() {
    if (day < 10) {
        // Update inventory and backlog
        let fulfilled = Math.min(inventory, demand + backlog);
        inventory -= fulfilled;
        backlog = demand + backlog - fulfilled;

        // Calculate old score
        let score_change = 0;

        // Update score
        score_change += fulfilled * SALE_POINTS;
        score_change -= inventory * STORAGE_COST;
        score_change -= backlog * BACKLOG_COST;
        score += score_change;

        if (score_change > 0) {
            document.getElementById('points-earned').play();
        } else if (score_change < 0) {
            document.getElementById('points-lost').play();
        }

        // Update day
        demand = Math.floor(Math.random() * 10); // Random demand
        day++;

        // Update inventory from order
        let supply = Math.floor(Math.random() * 20); // Random supply
        if (BULLWHIP_EFFECT) {
            supply = calculateSupply(order);
        }

        // Update past orders
        pastOrders.push(order);
        if (pastOrders.length > MAX_PAST_ORDERS) {
            pastOrders.shift(); // Remove the oldest order
        }

        // Update score breakdown
        updateScoreBreakdown(fulfilled, inventory, backlog, order, supply);

        // Update inventory from order
        inventory += Math.min(order, supply);

        // Update display
        document.getElementById('day-counter').textContent = day;
        document.getElementById('inventory').textContent = inventory;
        document.getElementById('demand').textContent = demand;
        document.getElementById('backlog').textContent = backlog;
        document.getElementById('order').textContent = order;
        document.getElementById('score').textContent = score;

        // Show the score breakdown if it's day 1 or later
        if (day === 2) {
            document.getElementById('score-breakdown').style.display = 'block';
        }

        // Highlight score change
        let scoreElement = document.getElementById('score');
        scoreElement.style.color = score_change < 0 ? 'red' : 'green';
        setTimeout(() => {
            scoreElement.style.color = 'black';
        }, 1000);
        
    } else if (day == 10) {
        // Hide order buttons
        const orderButtons = document.querySelectorAll('.order-button');
        orderButtons.forEach(button => button.style.display = 'none');

        // Change Next Day button text
        const nextDayButton = document.getElementById('next-day');
        nextDayButton.textContent = 'Submit Score';

        day++;
    } else {
        // End of game, show score page
        document.getElementById('game-page').style.display = 'none';
        document.getElementById('score-page').style.display = 'flex';

        // Reset Next Day button text
        const nextDayButton = document.getElementById('next-day');
        nextDayButton.textContent = 'Next Day';
    }
});

document.getElementById('play-again').addEventListener('click', function() {
	document.getElementById('leaderboard-page').style.display = 'none';
    document.getElementById('front-page').style.display = 'flex';
    document.body.className = 'front-page-bg';
});


document.getElementById('submit-score').addEventListener('click', async function() {
    let name = document.getElementById('name-input').value;
    let email = document.getElementById('email-input').value;
    code = document.getElementById('code-input').value;

    // Validate inputs
    if (!name || !email || !code) {
        alert("Please fill in all fields correctly.");
        return;
    }

    try {
        // Add the new score to Firestore
        const collectionName = code;
        await addDoc(collection(db, collectionName), {
            name: name,
            email: email,
            score: score,
            code: code
        });
        console.log("Score added to Firestore");

        // Fetch and update the leaderboard from Firestore
        const q = query(collection(db, collectionName), orderBy("score", "desc"), limit(15));
        const querySnapshot = await getDocs(q);
        const leaderboard = [];
        querySnapshot.forEach((doc) => {
            leaderboard.push(doc.data());
        });

        // Update the leaderboard display
        updateLeaderboard(leaderboard);
        document.getElementById('score-page').style.display = 'none';
        document.getElementById('leaderboard-page').style.display = 'flex';
        document.getElementById('leaderboard-show').play();
    } catch (error) {
        console.error("Error adding score: ", error);
        alert("Enter valid Code.");
    }
});

function updateLeaderboard(leaderboard) {
    let leaderboardDiv = document.getElementById('leaderboard');
    leaderboardDiv.innerHTML = '';
    for (let i = 0; i < leaderboard.length; i++) {
        leaderboardDiv.innerHTML += '<p>' + leaderboard[i].name + ': ' + leaderboard[i].score + '</p>';
    }
}

function updateScoreBreakdown(fulfilled, inventory, backlog, order, supply) {
    let scoreBreakdown = document.getElementById('score-breakdown');
    let salesScore = fulfilled * SALE_POINTS;
    let storageCost = inventory * STORAGE_COST;
    let backlogCost = backlog * BACKLOG_COST;
    
    let breakdownHTML = `
        <p>Sales: <span style="color: green;">+${salesScore}</span></p>
        <p>Storage Cost: <span style="color: red;">-${storageCost}</span></p>
        <p>Backlog Cost: <span style="color: red;">-${backlogCost}</span></p>
        <p>Net Change: <span style="color: ${salesScore - storageCost - backlogCost >= 0 ? 'green' : 'red'};">
            ${salesScore - storageCost - backlogCost >= 0 ? '+' : ''}${salesScore - storageCost - backlogCost}
        </span></p>
    `;

    if (supply < order) {
        breakdownHTML += `
            <p style="color: orange;">Oh no, our supplier ran out! We ordered ${order} but only received ${supply}.</p>
        `;
    }
    
    scoreBreakdown.innerHTML = breakdownHTML;
}

function calculateSupply(currentOrder) {
    let randomValue = Math.sqrt(-2 * Math.log(Math.random())) * Math.cos(2 * Math.PI * Math.random());
    let deviation = 1;
    let baseSupply = expectedSupply + deviation * randomValue;
    
    expectedSupply = (SMOOTHENING_FACTOR)*expectedSupply+(1-SMOOTHENING_FACTOR)*currentOrder;

    // Ensure the supply doesn't exceed the current order
    return Math.max(0, Math.floor(Math.min(currentOrder, baseSupply)));
}