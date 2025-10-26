var isPhone = false;
var currentTeamId = undefined;
var mql = window.matchMedia("(max-width: 600px)");

function screenTest(e) {
    isPhone = e.matches ? true : false;
 
    if (isPhone) {
        if (currentTeamId === undefined) {
            $('#keepersColumn').addClass('ffl-display-none');
            $('#btn-copy').addClass('disabled');
        }
        else {
            $('#teamsListColumn').addClass('ffl-display-none');
        }
        $('#btn-back').removeClass('disabled');
    }
    else {
        $('#keepersColumn').removeClass('ffl-display-none');
        $('#teamsListColumn').removeClass('ffl-display-none');
        $('#btn-back').addClass('disabled');
    }
}

mql.addEventListener("change", screenTest, false);

mql.onchange = function () {
  console.log(mql);
};

$(document).ready(function() {
    // Check the media width (phone vs. laptop/desktop) and setup accordingly
    screenTest(mql);

    // Fetch league data
    leagueData = JSON.parse(document.getElementById("leagueData").innerHTML);

    // Populate list of teams
    var teamsListHtml = "";
    var style = "btn btn-sm btn-outline-light text-start";

    Object.keys(leagueData).forEach(teamId => {
        teamName = leagueData[teamId].teamName;
        teamLogo = `<img src="${leagueData[teamId].teamLogoUrl}" `;
        teamLogo += `height="24px" style="padding: 0px 4px; border-radius: 50%;">`;
        teamsListHtml +=`<button style="color: #272727;" type="button" onclick="showKeepers(${teamId})" `;
        teamsListHtml += `id="team-list-${teamId}" class="${style}">${teamLogo} ${teamName}</button>`;
    });

    $("#list-of-teams").html(teamsListHtml);

    if (!isPhone) {
        currentTeamId = '1';
        showKeepers(currentTeamId);
    }
})

const onNextClick = function() {
    console.log(`called onNextClick with currentTeamId = ${currentTeamId}`);
    if (currentTeamId === undefined || currentTeamId === '12' || currentTeamId === 12) {
        // nothing to do
    }
    else {
        showKeepers(parseInt(currentTeamId) + 1);
    }
}

const onPrevClick = function() {
    console.log(`called onNextClick with currentTeamId = ${currentTeamId}`);
    if (currentTeamId === undefined || currentTeamId === '1' || currentTeamId === 1) {
        // nothing to do
    }
    else {
        showKeepers(parseInt(currentTeamId) - 1);
    }
}

const onBackClick = function() {
    console.log('back button clicked');
    if (isPhone) {
        $(`#team-list-${currentTeamId}`).removeClass("list-group-item-info");
        $('#teamsListColumn').removeClass('ffl-display-none');
        $('#keepersColumn').addClass('ffl-display-none');
        currentTeamId = undefined;
    }
}

function getKeepersForTeam(teamId, useKeeperVerbiage) {
    let keeperText = `-- ${leagueData[teamId].teamName} ${useKeeperVerbiage? "keepers" : "" } --`;
    currentTeamPlayers = leagueData[teamId].players;
    currentTeamPlayers.sort((a, b) => { return b.keeperValue - a.keeperValue; });
    currentTeamPlayers.forEach(p => {
        if (p.keeperValue > 0) {
            keeperText += `\n• R${p.keeperValue}: ${p.name}`;
        }
        else if (p.keeperValue == 0) {
            keeperText += `\n• R10: ${p.name}`;
        }
    });

    return keeperText;
}

const onCopyTeamKeepersClick = function() {
    console.log(`copy team keepers clicked, with current team set to ${currentTeamId}`);
    keepers = getKeepersForTeam(currentTeamId, true);
    navigator.clipboard.writeText(keepers);
}

const onCopyAllKeepersClick = function() {
    console.log(`copy all keepers clicked`);

    allKeepers = "";
    Object.keys(leagueData).forEach(teamId => {
        if (allKeepers === "") {} else { allKeepers += "\n\n"; }

        allKeepers += getKeepersForTeam(teamId, false);
        navigator.clipboard.writeText(allKeepers);
    });
}

function showKeepers(teamId) {

    $('#btn-copy').removeClass('disabled');

    if (isPhone) {
        $('#teamsListColumn').addClass('ffl-display-none');
        $('#keepersColumn').removeClass('ffl-display-none');
    }

    if (teamId === '1' || teamId === 1) {
        $('#btn-prev').addClass('disabled');
    }
    else {
        $('#btn-prev').removeClass('disabled');
    }

    if (teamId === '12' || teamId === 12) {
        $('#btn-next').addClass('disabled');
    }
    else {
        $('#btn-next').removeClass('disabled');
    }
    
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
        playersListHtml += `<li class="list-group-item list-group-item-info">${position} `;
        playersListHtml += `&nbsp; ${headshot} &nbsp; ${p.name} &nbsp; ${keeperPill}</li>`;
    });

    $("#list-of-keepers").html(playersListHtml);
}

const getPositionPill = function(pos) {
    style = "display: inline-block; background-color: blue; color: white; font-weight: bold;";
    style += " font-size: 12px; height: 24px; width: 24px; border-radius: 50%;";
    style += " text-align: center; padding: 3px 2px 3px 1px";
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
            keeperNote = "Week 10+ Add";
            break;
        case -2:
            keeperNote = "2x Keeper Limit";
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

    pillStyle = "padding: 2px 5px 4px 4px; color: white; font-weight: bold; ";
    pillStyle += "font-size: 12px; border-radius: 5px;";
    return `<span style="background-color: ${pillColor}; ${pillStyle}">${keeperNote}</span>`;
}
