console.log("logging output, after modifying locally")

$(document).ready(function() {
    console.log("JQuery is loaded");

    // Fetch league data
    leagueData = JSON.parse(document.getElementById("leagueData").innerHTML);

    // Populate list of teams
    var teamsListHtml = "";
    var style = "btn btn-sm btn-outline-dark text-start";

    Object.keys(leagueData).forEach(teamId => {
        teamName = leagueData[teamId].teamName;
        teamLogo = `<img src="${leagueData[teamId].teamLogoUrl}" height="24px" style="padding: 0px 4px; border-radius: 50%;">`
        teamsListHtml +=`<button type="button" onclick="showKeepers(${teamId})" id="team-list-${teamId}" class="${style}">${teamLogo} ${teamName}</button>`;
    });

    $("#list-of-teams").html(teamsListHtml);

    // If wide screen show keepers.
    showKeepers('1');
})

var currentTeamId = '1';
function showKeepers(teamId) {
    
    // restore style for current team
    $(`#team-list-${currentTeamId}`).removeClass("list-group-item-info");
    
    // set active style for selected team
    $(`#team-list-${teamId}`).addClass("list-group-item-info");
    currentTeamId = teamId;
    
    // list all players from selected team
    currentTeamPlayers = leagueData[currentTeamId].players;
    currentTeamPlayers.sort((a, b) => { return b.keeperValue - a.keeperValue; });

    var playersListHtml = "";
    currentTeamPlayers.forEach(p => {
        keeperPill = getKeeperPill(p.keeperValue);
        headshot = `<img src="${p.imageUrl}" height="28px" style="padding: 0px 4px;">`
        position = getPositionPill(p.position);
        playersListHtml += `<li class="list-group-item list-group-item-info">${position} &nbsp; ${headshot} &nbsp; ${p.name} &nbsp; ${keeperPill}</li>`;
    });

    console.log(playersListHtml);

    $("#list-of-keepers").html(playersListHtml);
}

const getPositionPill = function(pos) {
    style = "display: inline-block; background-color: blue; color: white; font-weight: bold; font-size: 12px; ";
    style += "height: 24px; width: 24px; border-radius: 50%; text-align: center; padding: 3px 2px 3px 1px";
    return `<span style="${style}">${pos}</span>`;
}

const getKeeperPill = function(keeperValue) {
    pillColor = keeperValue >= 0 ? "green" : "red";
    keeperNote = "";
    switch (keeperValue) {
        case -5:
            keeperNote = "Nope";
            break;
        case -4:
            keeperNote = "No Bro";
            break;
        case -3:
            keeperNote = "Late Add";
            break;
        case -2:
            keeperNote = "Keeper Limit";
            break;
        case -1:
            keeperNote = "Drafted R1";
            break;
        case 0:
            keeperNote = "R10 (UDFA)";
            break;
        default:
            keeperNote = `R${keeperValue}`;
    }

    pillStyle = "padding: 2px 5px 4px 4px; color: white; font-weight: bold; font-size: 12px; border-radius: 5px;";
    return `<span style="background-color: ${pillColor}; ${pillStyle}">${keeperNote}</span>`;
}
