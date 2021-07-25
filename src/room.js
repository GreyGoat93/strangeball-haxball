// Custom maps.
import game from './game.js'
import maps from './maps.js'
import players from './players.js'
import {processChat} from './chat';
import { antiStrangenesses, strangenesses, strangenessUsage } from './strangeness.js';

// Create room variable to use in exports.
let room;

// Rooms properties when initializing.
const ROOM_INIT_PROPERTIES = {
  token: process.env.TOKEN, // Token is REQUIRED to have this app to skip the recapctha!
  roomName: `🤡 JOKERBALL 7/24 :)`,
  maxPlayers: 15,
  noPlayer: true,
  public: false,
  geo: {
    code: process.env.GEO_CODE, 
    lat: parseFloat(process.env.GEO_LAT), 
    lon: parseFloat(process.env.GEO_LON)
  }
}


const SYSTEM = {
  MANAGE_AFKS: false,
  ONE_TAB: false,
  PEOPLE_COUNT_BY_TEAM: 5,
  GAME_TIME_LIMIT: 0,
  GAME_SCORE_LIMIT: 2,
}

const makeSystemDefault = () => {
  SYSTEM.MANAGE_AFKS = true;
  SYSTEM.ONE_TAB = false;
  SYSTEM.PEOPLE_COUNT_BY_TEAM = 4;
  SYSTEM.GAME_TIME_LIMIT = 2;
  SYSTEM.GAME_SCORE_LIMIT = 3;
}

const ADMIN = {
  PASSWORD: "123456a",
}

//gamePhase: "idle" | "choosing" | "running" | "finishing"

export const strangenessesInit = {
  ballRadiusId: 0,
  makeEnemiesSmallerIdRed: 0,
  makeEnemiesSmallerIdBlue: 0,
  makeEnemiesSmallerRed: false,
  makeEnemiesSmallerBlue: false,
  frozenBall: false,
  frozenBallId: 0,
  makeEnemiesFrozenIdRed: 0,
  makeEnemiesFrozenIdBlue: 0,
  makeEnemiesFrozenRed: false,
  makeEnemiesFrozenBlue: false,
  timeTravelBall: false,
  timeTravelBallId: 0,
  timeTravelBallCoordinates: null,
}

// Room states.
const roomStates = {
  gameId: 0,
  gameStarted: false,
  gameLocked: false,
  gamePhase: "idle",
  gameTick: 0, 
  lastTouch: null, // player id 
  kickCount: 0, // Increases per kick to the ball
  positionId: 0, // Increases per position reset
  teamSelecting: 0,
  autoSelectTimeout: null,
  scores: {
    red: 0,
    blue: 0,
    time: 0.00,
  },
  strangenesses: {
    ...strangenessesInit
  }
}

// Player list and their states.
const playerList = []

// Timeouts
let gameAgainDelay = 5000 //ms

//** MAIN **//
// Main Room Config, It is recommended to put headless room events here.
window.onHBLoaded = () => {
  room = HBInit(ROOM_INIT_PROPERTIES)

  room.setDefaultStadium("Huge");
  room.setTeamsLock(true);
  room.setScoreLimit(SYSTEM.GAME_SCORE_LIMIT);
  room.setTimeLimit(SYSTEM.GAME_TIME_LIMIT);

  room.onPlayerJoin = (player) => {
    players.onPlayerJoin(player);
    room.setPlayerAdmin(player.id, true);
  }

  room.onPlayerLeave = (player) => {
    players.onPlayerLeave(player);
  }

  room.onGameStart = () => {
    game.onGameStart();
  }

  room.onGameStop = () => {
    game.onGameStop();
  }

  room.onTeamVictory = (scores) => {
    game.onTeamVictory(scores);
  }

  room.onTeamGoal = (teamID) => {

  }

  room.onPositionsReset = () => {
    console.log("res");
    roomStates.positionId += 1;
    players.onPositionsReset();
  }

  room.onGameTick = () => {
    players.assignPosition();
    strangenessUsage.filter(pre => pre.tick === roomStates.gameTick && pre.positionId === roomStates.positionId).forEach(pre => pre.invoke());
    game.checkIfPlayersFrozen();
    game.checkIfPlayersSelfFrozen();
    game.checkIfPlayersAreSuperman();
    roomStates.gameTick += 1;
  }

  room.onPlayerTeamChange = (changedPlayer, byPlayer) => {
    players.onPlayerTeamChange(changedPlayer, byPlayer);
    roomStates.gamePhase !== "idle" && game.checkTheGame();
  }

  room.onPlayerBallKick = (player) => {
    game.onPlayerBallKick(player);
    let {x: bx, y: by} = room.getDiscProperties(0);
    room.sendAnnouncement(`bx: ${bx}, by: ${by}`);
    let {x: px, y: py} = room.getPlayerDiscProperties(player.id);
    room.sendAnnouncement(`px: ${px}, py: ${py}`);
    room.sendAnnouncement(`dx: ${px - bx}, dy: ${py - by}, rxy: ${(px - bx) / (py - by)}`);
    setTimeout(() => {
        let {xspeed, yspeed} = room.getDiscProperties(0);
        room.sendAnnouncement(`xspd: ${xspeed}, yspd: ${yspeed}`)
    }, 300);
  }

  room.onPlayerActivity = (player) => {
    game.useSpeedBoost(player);
  }

  room.onPlayerChat = (player, message) => {
    processChat(player, message)
    return true
  }
}
//** MAIN **//

// Initialize headless room.
if (typeof window.HBInit === 'function') {
  window.onHBLoaded()
}

export let DEFAULT_AVATAR = "🤡";

// Import this whenever you want to use functionality of Haxball Headless Room API.
export { room }

// Import this whenever you want to change states of the room.
export { roomStates }

// Import this whenever you want to change players state.
export { playerList }

// Import this to manage functions from outside.
export { SYSTEM }
export { ADMIN }
export { makeSystemDefault }
