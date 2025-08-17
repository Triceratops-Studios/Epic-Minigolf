import { Airship } from "@Easy/Core/Shared/Airship";
import Character from "@Easy/Core/Shared/Character/Character";
import { Game } from "@Easy/Core/Shared/Game";
import { Player } from "@Easy/Core/Shared/Player/Player";
import { Team } from "@Easy/Core/Shared/Team/Team";
import TrackSpawner from "./TrackSpawner";
import ColorPallette from "Minigolf/Settings/ColorPallette";
import BallMechanics from "./BallMechanics";
import Events from "Code/Events";
import MobileChatToggleButton from "@Easy/Core/Shared/MainMenu/Components/MobileChatToggleButton";
import { Network } from "Code/Network";

export default class RoundSystem extends AirshipBehaviour {
	public static status = "waiting"; //intermission, setup, cleanup, running, waiting, starting, none

	public static scores: { [name: string]: {[round: number]: number} } = {};

	private intermission = 15;
	private static rounds = 5;
	private wait = 0;
	private requiredPlayers = 2;
	private timer = 30;
	private timeLeft = 30;
	private currentRound = 0;
	private playersLeft = 0;

	private static team: Team;
	private updating = false;
	private pending: string | undefined;

	private tracks = new Array<GameObject>();
	private static currentTrack: GameObject | undefined;

	public static getScore(player: Player): number {
		let score = 0;
		if (RoundSystem.scores[player.username]) {
			for (let round = 1; round <= RoundSystem.rounds; round++) {
				if (!RoundSystem.scores[player.username][round]) {
					continue;
				}
				score += RoundSystem.scores[player.username][round];
			}
		}
		return score
	}

	public static JoinRound(player: Player): void {
		if (RoundSystem.status === "none") {
			RoundSystem.status = "intermission";
		}

		if (RoundSystem.status === "intermission" || RoundSystem.status === "starting") {
			this.team.AddPlayer(player);
		}
	}

	protected override Start(): void {
		if (!Game.IsServer()) { return; }
		Events.inHole.server.OnClientEvent((player, hits) => {
			const character = GameObject.Find(`Character_${player.username}`)
			if (character) {
				Airship.Damage.InflictDamage(character, 1000, undefined);
				Destroy(character);
				NetworkServer.Destroy(character);
			}
			if (RoundSystem.team.HasPlayer(player)) {
				const score = math.round(this.timeLeft * 7 / hits * (1 + 0.2 * (TrackSpawner.getTrackInfo(RoundSystem.currentTrack || -1)?.difficulty || 1)));
				if (!RoundSystem.scores[player.username]) {
					RoundSystem.scores[player.username] = {};
				}
				RoundSystem.scores[player.username][this.currentRound] = score || 0;
				this.playersLeft -= 1;
				Events.reportScore.server.FireClient(player, RoundSystem.getScore(player));
			}
		})
	}

	override Update(dt: number): void {
		if (!Game.IsServer() || this.updating) {
			return;
		}
		this.updating = true;
		print(RoundSystem.status)

		switch (RoundSystem.status) {
			case "intermission":
				RoundSystem.team = new Team("In Round", "inround", ColorPallette.palette[5]);
				Airship.Teams.RegisterTeam(RoundSystem.team);
				Airship.Chat.BroadcastMessage(`Round is starting in ${this.intermission} seconds!`)
				for (let i = this.intermission; i > 0; i--) {
					task.wait(1);
				}
				RoundSystem.status = "starting";
				break;

			case "starting":
				let gameTracks = TrackSpawner.getTracks();

				for (let i = RoundSystem.rounds; i > 0; i--) {
					const index = math.random(1, gameTracks.size()) - 1;
					this.tracks.push(gameTracks[index]);
					gameTracks.remove(index);
				}

				for (let player of Airship.Players.GetPlayers()) {
					RoundSystem.JoinRound(player)
				}

				RoundSystem.status = "setup";
				break;

			case "setup":
				
				this.currentRound += 1
				const track = this.tracks.shift();
				if (track) {
					RoundSystem.status = "running";
					this.timer = ((TrackSpawner.getTrackInfo(track)?.difficulty || 1) -1) * 15 + 45;
					RoundSystem.currentTrack = TrackSpawner.spawnTrack(track)
					const spawn = GameObject.Find("CharacterSpawner");

					this.playersLeft = 0;
					for (let player of Airship.Players.GetPlayers()) {
						if (player.team !== RoundSystem.team) { continue; }

						if (!RoundSystem.scores[player.username]) {
							RoundSystem.scores[player.username] = {};
						}
						RoundSystem.scores[player.username][this.currentRound] = 0;
						
						player.SpawnCharacter(spawn.transform.position, {
							lookDirection: spawn.transform.forward,
						});
						task.spawn(() => {
							if (player.character) {
								player.character.gameObject.GetAirshipComponent<BallMechanics>()!.isEnabled = false;
								task.wait(3)
								player.character.gameObject.GetAirshipComponent<BallMechanics>()!.isEnabled = true;
							}
						})
						this.playersLeft += 1;
					}

					Airship.Chat.BroadcastMessage(`Track #${this.currentRound}`);
					task.wait(3)
					Airship.Chat.BroadcastMessage("GO!");
				}
				break;

			case "running":
				RoundSystem.status = "cleanup";
				const gameUI = GameObject.Find("GameUI");
				for (let i = this.timer; i >= 0; i--) {
					this.timeLeft = i;
					const min = math.floor(i / 60);
					const sec = i % 60

					Events.updateTimer.server.FireAllClients(`${min}:${sec < 10 ? "0" + sec : sec}`);
					if (this.playersLeft > 0) {
						task.wait(1);
					}
				}
				break;

			case "cleanup":

				for (let player of Airship.Players.GetPlayers()) {
					if (Airship.Teams.FindByPlayer(player) !== RoundSystem.team) { continue; }
					const object = GameObject.Find(`Character_${player.username}`)
					if (object) {
						Airship.Damage.InflictDamage(object, 1000, undefined);
						Destroy(object)
						NetworkServer.Destroy(object);
						
						Events.reportScore.server.FireClient(player, RoundSystem.getScore(player));
					}
				}
				if (RoundSystem.currentTrack) {
					Destroy(RoundSystem.currentTrack);
				}
				if (this.currentRound >= RoundSystem.rounds) {
					let winner: [string, number] = ["No one", 0];
					for (let player of Airship.Players.GetPlayers()) {
						if (player.team !== RoundSystem.team) { continue; }
						const score = RoundSystem.getScore(player);
						if (score > winner[1]) {
							winner[0] = player.username;
							winner[1] = score;
						}
					}
					Airship.Chat.BroadcastMessage(`Round ended: ${winner[0]} won with ${winner[1]} points!`);
					this.wait = 10;
					this.pending = "intermission";
					RoundSystem.status = "waiting";
					Airship.Teams.RemoveTeam(RoundSystem.team);
					RoundSystem.scores = {};
					this.currentRound = 0;
					this.timer = 30;
					this.timeLeft = 30;
					break;
				} else {
					this.pending = "setup";
					this.wait = 5;
					RoundSystem.status = "waiting";
					
					RoundSystem.currentTrack = undefined;
				}

			case "waiting":
				for (let i = this.wait; i > 0; i--) {
					task.wait(1);
				}
				this.wait = 0;
				if (Airship.Players.GetPlayers().size() < this.requiredPlayers && this.currentRound === 0) {;
					this.wait = 1;
				} else {
					RoundSystem.status = this.pending || "intermission";
				}
				break;
		}
		this.updating = false;
	}
}
