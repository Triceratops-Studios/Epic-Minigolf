import { Airship } from "@Easy/Core/Shared/Airship";
import Character from "@Easy/Core/Shared/Character/Character";
import { Game } from "@Easy/Core/Shared/Game";
import { Player } from "@Easy/Core/Shared/Player/Player";
import { Team } from "@Easy/Core/Shared/Team/Team";
import TrackSpawner from "./TrackSpawner";
import ColorPallette from "Minigolf/Settings/ColorPallette";

export default class RoundSystem extends AirshipBehaviour {
	public static status = "intermission"; //intermission, setup, cleanup, running, waiting, starting

	public static scores: { [name: string]: {[round: number]: number} } = {};

	private intermission = 15;
	private rounds = 8;
	private wait = 0;
	private static timer = 30;
	private static timeLeft = 30;
	private static currentRound = 1;

	private static team: Team;
	private updating = false;
	private pending: string | undefined;

	private tracks = new Array<GameObject>();
	private static currentTrack: GameObject | undefined;

	public static JoinRound(player: Player): void {
		this.team.AddPlayer(player);
	}

	public static reportScore(player: Player, hits: number): void {
		if (this.team.HasPlayer(player)) {
			const score = math.round(this.timeLeft * 7 / hits * (1 + 0.2 * (TrackSpawner.getTrackInfo(this.currentTrack || -1)?.difficulty || 1)));
			if (!this.scores[player.username]) {
				this.scores[player.username] = {};
			}
			print(`Player ${player.username} scored ${score} in round ${this.currentRound}`);
			this.scores[player.username][this.currentRound] = score || 0;
		}
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
				for (let i = this.intermission; i > 0; i--) {
					//message players to join
					task.wait(1);
				}
				RoundSystem.status = "starting";
				break;

			case "starting":
				// let gameTracks = TrackSpawner.getTracks();

				// for (let i = this.rounds; i > 0; i--) {
				// 	const index = math.random(1, gameTracks.size()) - 1;
				// 	this.tracks.push(gameTracks[index]);
				// 	gameTracks.remove(index);
				// }
				RoundSystem.status = "setup";
				break;

			case "setup":
				RoundSystem.currentRound += 1
				// const track = this.tracks.shift();
				// if (track) {
				RoundSystem.status = "running";
				// 	RoundSystem.timer = ((TrackSpawner.getTrackInfo(track)?.difficulty || 1) -1) * 15 + 30;
				// 	RoundSystem.currentTrack = TrackSpawner.spawnTrack(track)
				// }
				break;

			case "running":
				RoundSystem.status = "cleanup";
				const timerText = GameObject.Find("TimerText")?.GetComponent<TMP_Text>();
				for (let i = RoundSystem.timer; i >= 0; i--) {
					RoundSystem.timeLeft = i;
					const min = math.floor(i / 60);
					const sec = i % 60

					if (timerText) {
						timerText.text = `${min}:${sec < 10 ? "0" + sec : sec}`;
					}
					task.wait(1);
				}
				break;

			case "cleanup":
				if (RoundSystem.currentTrack) {
					Destroy(RoundSystem.currentTrack);
				}
				if (RoundSystem.currentRound >= this.rounds) {
					this.wait = 10;
					RoundSystem.status = "waiting";
					Airship.Teams.RemoveTeam(RoundSystem.team);
					RoundSystem.scores = {};
					RoundSystem.currentRound = 1;
					RoundSystem.timer = 30;
					RoundSystem.timeLeft = 30;
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
				RoundSystem.status = this.pending || "Intermission";
				break;
		}
		this.updating = false;
	}
}
