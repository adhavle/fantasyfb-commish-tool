console.log("logging output, after modifying locally")

$(document).ready(function() {
    console.log("JQuery is loaded");

    // fetch team and player data
    teams = JSON.parse(document.getElementById("teams_data").innerHTML);
    players = JSON.parse(document.getElementById("players_data").innerHTML);

    // add list of teams
    var teamsListHtml = "";
    teams.forEach(team => {
        teamsListHtml += `<li onclick="showKeepers(${team['teamId']})" id="team-list-${team['teamId']}" class="list-group-item d-flex justify-content-between align-items-center">${team['teamName']}</li>`;
    });
    $("#list-of-teams").html(teamsListHtml);
    showKeepers(1);    
})

var currentTeamId = 1;
function showKeepers(teamId) {
    teamId = parseInt(teamId);
    
    // restore style for current team
    $(`#team-list-${currentTeamId}`).removeClass("list-group-item-success");
    
    // set active style for selected team
    $(`#team-list-${teamId}`).addClass("list-group-item-success");
    currentTeamId = teamId;
    
    // list all players from selected team
    currentTeamPlayers = players[currentTeamId];
    var playersListHtml = "";
    currentTeamPlayers.forEach(plr => {
        playersListHtml += `<li class="list-group-item list-group-item-info">[${plr['position']}] ${plr['fullname']}</li>`;
    });

    $("#list-of-keepers").html(playersListHtml);
}