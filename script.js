db = window.db;
addDoc = window.addDoc;
collection = window.collection;
getDocs = window.getDocs;

let INITIAL_INVENTORY = 10;

// Initial values
let day = 1;
let inventory = INITIAL_INVENTORY;
let demand = Math.floor(Math.random() * 10);
let backlog = 0;
let score = 0;
let order = 0;


// Score constants
let SALE_POINTS = 7;
let STORAGE_COST = 2;
let BACKLOG_COST = 4;

document.getElementById('play-button').addEventListener('click', function() {
    day = 1;
    inventory = INITIAL_INVENTORY;
    demand = Math.floor(Math.random() * 10);
    backlog = 0;
    score = 0;
    order = 0;

    // Update display
    document.getElementById('day-counter').textContent = day;
    document.getElementById('inventory').textContent = inventory;
    document.getElementById('demand').textContent = demand;
    document.getElementById('backlog').textContent = backlog;
    document.getElementById('order').textContent = order;
    document.getElementById('score').textContent = score;

    document.getElementById('front-page').style.display = 'none';
    document.getElementById('game-page').style.display = 'flex';
    //document.getElementById('my-sound').play();

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
        demand = Math.floor(Math.random() * 10); // Random demand
        let fulfilled = Math.min(inventory, demand + backlog);
        inventory -= fulfilled;
        backlog = demand + backlog - fulfilled;

        // Update score
        score += fulfilled * SALE_POINTS;
        score -= inventory * STORAGE_COST;
        score -= backlog * BACKLOG_COST;

        // Update day
        day++;

        // Update inventory from order
        let supply = Math.floor(Math.random() * 20); // Random demand
        inventory += Math.min(order, supply);


        // Update display
        document.getElementById('day-counter').textContent = day;
        document.getElementById('inventory').textContent = inventory;
        document.getElementById('demand').textContent = demand;
        document.getElementById('backlog').textContent = backlog;
        document.getElementById('order').textContent = order;
        document.getElementById('score').textContent = score;
    } else {
        // End of game, show score page
        document.getElementById('game-page').style.display = 'none';
        document.getElementById('score-page').style.display = 'flex';
    }
});

document.getElementById('play-again').addEventListener('click', function() {
    document.getElementById('game-page').style.display = 'none';
    document.getElementById('front-page').style.display = 'flex';
});


document.getElementById('submit-score').addEventListener('click', async function() {
    let name = document.getElementById('name-input').value;
    let email = document.getElementById('email-input').value;

    try {
        // Add the new score to Firestore
        await addDoc(collection(db, "scores"), {
            name: name,
            email: email,
            score: score
        });
        console.log("Score added to Firestore");

        // Fetch and update the leaderboard from Firestore
        const q = collection(db, "scores");
        const querySnapshot = await getDocs(q);
        const leaderboard = [];
        querySnapshot.forEach((doc) => {
            leaderboard.push(doc.data());
        });

        // Update the leaderboard display
        updateLeaderboard(leaderboard);
        document.getElementById('score-page').style.display = 'none';
        document.getElementById('leaderboard-page').style.display = 'flex';
    } catch (error) {
        console.error("Error adding score: ", error);
    }
});

function updateLeaderboard(leaderboard) {
    let leaderboardDiv = document.getElementById('leaderboard');
    leaderboardDiv.innerHTML = '';
    for (let i = 0; i < leaderboard.length; i++) {
        leaderboardDiv.innerHTML += '<p>' + leaderboard[i].name + ': ' + leaderboard[i].score + '</p>';
    }
}