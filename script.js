let GOOGLE_SHEET_SCRIPT = "https://script.google.com/macros/s/AKfycbybcj-4o8js-weDD6RVnPJYiz71cYMQ07SbV7keNcY4OLiSc5zjLiOj9X40eddab9M/exec"
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
        const response = await fetch(GOOGLE_SHEET_SCRIPT, { // Replace with your Web App URL
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name, email, score })
        });

        if (response.ok) {
            document.getElementById('score-page').style.display = 'none';
            document.getElementById('leaderboard-page').style.display = 'flex';
            updateLeaderboard();
        } else {
            console.error('Failed to submit score:', response.statusText);
        }
    } catch (error) {
        console.error('Error submitting score:', error);
    }
});

async function updateLeaderboard() {
    try {
        const response = await fetch(GOOGLE_SHEET_SCRIPT); // Replace with your Web App URL
        if (!response.ok) {
            throw new Error('Failed to fetch leaderboard: ' + response.statusText);
        }
        const leaderboard = await response.json();

        let leaderboardDiv = document.getElementById('leaderboard');
        leaderboardDiv.innerHTML = '';
        for (let i = 0; i < leaderboard.length; i++) {
            leaderboardDiv.innerHTML += '<p>' + leaderboard[i].name + ': ' + leaderboard[i].score + '</p>';
        }
    } catch (error) {
        console.error('Error updating leaderboard:', error);
    }
}




/*
let leaderboard = JSON.parse(localStorage.getItem('leaderboard')) || [];
function updateLeaderboard_offline() {
    let leaderboardDiv = document.getElementById('leaderboard');
    leaderboardDiv.innerHTML = '';
    for (let i = 0; i < leaderboard.length; i++) {
        leaderboardDiv.innerHTML += '<p>' + leaderboard[i].name + ': ' + leaderboard[i].score + '</p>';
    }
}
*/
